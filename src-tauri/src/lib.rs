mod cleaner;
mod models;
mod scanner;

use std::fs::{create_dir_all, OpenOptions};
use std::io::Write;
use std::path::Path;
use std::process::Command;
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Arc;

use parking_lot::Mutex;
use serde_json::json;
use tauri::{AppHandle, Emitter, State};

use crate::models::{
    Category, DeleteResult, DiskInfo, ScanConfig, ScanItem, ScanSummary, SubfolderEntry,
};

pub struct AppScanState {
    pub items: Mutex<Vec<ScanItem>>,
    pub summary: Mutex<Option<ScanSummary>>,
    pub cancel: AtomicBool,
}

fn disk_info_impl() -> Result<DiskInfo, String> {
    #[cfg(target_os = "macos")]
    {
        use std::ffi::CString;
        use std::mem::MaybeUninit;

        let home = dirs::home_dir().ok_or_else(|| "No home directory.".to_string())?;
        let path = CString::new(
            home.to_str()
                .ok_or_else(|| "Home path is not valid UTF-8.".to_string())?,
        )
        .map_err(|_| "Home path contains NUL.".to_string())?;

        unsafe {
            let mut st = MaybeUninit::<libc::statfs>::zeroed();
            if libc::statfs(path.as_ptr(), st.as_mut_ptr()) != 0 {
                return Err("statfs failed (disk info unavailable).".to_string());
            }
            let st = st.assume_init();
            let bsize = st.f_bsize as u64;
            let total = (st.f_blocks as u64).saturating_mul(bsize);
            let avail = (st.f_bavail as u64).saturating_mul(bsize);
            let used = total.saturating_sub(avail);
            Ok(DiskInfo {
                total_bytes: total,
                available_bytes: avail,
                used_bytes: used,
            })
        }
    }
    #[cfg(not(target_os = "macos"))]
    {
        Err("PureMac targets macOS only.".to_string())
    }
}

fn append_delete_log(mode: &str, paths: &[String], bytes_freed: u64) -> Result<(), String> {
    let home = dirs::home_dir().ok_or_else(|| "No home directory.".to_string())?;
    let dir = home.join(".purémac");
    create_dir_all(&dir).map_err(|e| format!("create log dir: {e}"))?;
    let mut file = OpenOptions::new()
        .create(true)
        .append(true)
        .open(dir.join("delete_log.jsonl"))
        .map_err(|e| format!("open delete log: {e}"))?;

    let payload = json!({
        "timestamp": chrono::Utc::now().timestamp(),
        "mode": mode,
        "paths": paths,
        "bytes_freed": bytes_freed,
    });

    writeln!(file, "{}", payload).map_err(|e| format!("write delete log: {e}"))
}

#[tauri::command]
async fn get_disk_info() -> Result<DiskInfo, String> {
    tokio::task::spawn_blocking(disk_info_impl)
        .await
        .map_err(|e| format!("join disk info task: {e}"))?
}

#[tauri::command]
async fn start_scan(
    config: ScanConfig,
    app: AppHandle,
    state: State<'_, Arc<AppScanState>>,
) -> Result<ScanSummary, String> {
    state.cancel.store(false, Ordering::SeqCst);
    {
        state.items.lock().clear();
        *state.summary.lock() = None;
    }

    let app_for_scan = app.clone();
    let state_for_scan = Arc::clone(&*state);
    let cfg = config;

    let outcome = tokio::task::spawn_blocking(move || {
        scanner::run_scan(&app_for_scan, &state_for_scan.cancel, cfg, true)
    })
    .await
    .map_err(|e| format!("scan task join: {e}"))?;

    let (items, summary) = outcome?;

    *state.items.lock() = items;
    *state.summary.lock() = Some(summary.clone());

    let _ = app.emit("scan_complete", &summary);
    Ok(summary)
}

#[tauri::command]
fn cancel_scan(state: State<'_, Arc<AppScanState>>) {
    state.cancel.store(true, Ordering::SeqCst);
}

#[tauri::command]
fn get_scan_results(
    category: Option<Category>,
    state: State<'_, Arc<AppScanState>>,
) -> Result<Vec<ScanItem>, String> {
    let guard = state.items.lock();
    Ok(match category {
        None => guard.clone(),
        Some(c) => guard.iter().filter(|i| i.category == c).cloned().collect(),
    })
}

#[tauri::command]
async fn move_to_trash(
    paths: Vec<String>,
    dry_run: bool,
) -> Result<DeleteResult, String> {
    let res = cleaner::trash::move_paths_to_trash(&paths, dry_run)?;
    append_delete_log(
        if dry_run { "trash_dry_run" } else { "trash" },
        &res.succeeded,
        res.bytes_freed,
    )?;
    Ok(res)
}

#[tauri::command]
async fn delete_permanently(
    paths: Vec<String>,
    dry_run: bool,
) -> Result<DeleteResult, String> {
    let res = cleaner::permanent::delete_paths_permanently(&paths, dry_run)?;
    append_delete_log(
        if dry_run {
            "permanent_dry_run"
        } else {
            "permanent"
        },
        &res.succeeded,
        res.bytes_freed,
    )?;
    Ok(res)
}

#[tauri::command]
async fn preview_in_finder(path: String) -> Result<(), String> {
    let status = Command::new("open")
        .arg("-R")
        .arg(&path)
        .status()
        .map_err(|e| format!("open -R failed: {e}"))?;
    if status.success() {
        Ok(())
    } else {
        Err("open -R returned non-zero exit code.".to_string())
    }
}

#[tauri::command]
async fn get_item_size(path: String) -> Result<u64, String> {
    let p = Path::new(&path);
    if p.is_dir() {
        scanner::util::dir_size(p).map_err(|e| format!("size: {e}"))
    } else {
        std::fs::metadata(p)
            .map(|m| m.len())
            .map_err(|e| format!("metadata: {e}"))
    }
}

#[tauri::command]
async fn get_installed_apps() -> Result<Vec<String>, String> {
    let home = dirs::home_dir().ok_or_else(|| "No home directory.".to_string())?;
    let mut ids: Vec<String> = scanner::collect_installed_bundle_ids(&home)?
        .into_iter()
        .collect();
    ids.sort();
    Ok(ids)
}

#[tauri::command]
async fn check_full_disk_access() -> Result<bool, String> {
    tokio::task::spawn_blocking(|| {
        let home = dirs::home_dir().ok_or_else(|| "No home directory.".to_string())?;
        // Sensitive user locations usually require FDA for non-sandboxed helpers.
        let probe = home.join("Library/Messages");
        match std::fs::read_dir(&probe) {
            Ok(_) => Ok(true),
            Err(e) => {
                if e.kind() == std::io::ErrorKind::PermissionDenied {
                    Ok(false)
                } else if !probe.exists() {
                    // If folder doesn't exist, fall back to another probe.
                    let probe2 = home.join("Library/Safari");
                    match std::fs::read_dir(&probe2) {
                        Ok(_) => Ok(true),
                        Err(e2) => {
                            if e2.kind() == std::io::ErrorKind::PermissionDenied {
                                Ok(false)
                            } else {
                                Ok(true)
                            }
                        }
                    }
                } else {
                    Ok(true)
                }
            }
        }
    })
    .await
    .map_err(|e| format!("fda task join: {e}"))?
}

#[tauri::command]
async fn open_privacy_settings() -> Result<(), String> {
    let status = Command::new("open")
        .arg("x-apple.systempreferences:com.apple.preference.security?Privacy_AllFiles")
        .status()
        .map_err(|e| format!("open System Settings failed: {e}"))?;
    if status.success() {
        Ok(())
    } else {
        Err("open System Settings returned non-zero exit code.".to_string())
    }
}

fn list_subfolders_impl(root: std::path::PathBuf) -> Result<Vec<SubfolderEntry>, String> {
    use std::fs;
    if !root.is_dir() {
        return Ok(Vec::new());
    }
    let mut out = Vec::new();
    let rd = fs::read_dir(&root).map_err(|e| format!("read_dir: {e}"))?;
    for ent in rd {
        let ent = match ent {
            Ok(e) => e,
            Err(_) => continue,
        };
        let ft = match ent.file_type() {
            Ok(t) => t,
            Err(_) => continue,
        };
        let p = ent.path();
        let is_dir = if ft.is_symlink() {
            p.is_dir()
        } else {
            ft.is_dir()
        };
        if !is_dir {
            continue;
        }
        let size = scanner::util::dir_size(&p).unwrap_or(0);
        let name = ent.file_name().to_string_lossy().into_owned();
        out.push(SubfolderEntry {
            name,
            path: p.to_string_lossy().replace('\\', "/"),
            size_bytes: size,
        });
    }
    out.sort_by(|a, b| b.size_bytes.cmp(&a.size_bytes));
    Ok(out)
}

#[tauri::command]
async fn list_subfolders(path: String) -> Result<Vec<SubfolderEntry>, String> {
    let root = std::path::PathBuf::from(path);
    tokio::task::spawn_blocking(move || list_subfolders_impl(root))
        .await
        .map_err(|e| format!("list_subfolders join: {e}"))?
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let scan_state = Arc::new(AppScanState {
        items: Mutex::new(Vec::new()),
        summary: Mutex::new(None),
        cancel: AtomicBool::new(false),
    });

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .manage(scan_state)
        .invoke_handler(tauri::generate_handler![
            get_disk_info,
            start_scan,
            cancel_scan,
            get_scan_results,
            move_to_trash,
            delete_permanently,
            preview_in_finder,
            get_item_size,
            list_subfolders,
            get_installed_apps,
            check_full_disk_access,
            open_privacy_settings,
        ])
        .run(tauri::generate_context!())
        .expect("error while running PureMac");
}
