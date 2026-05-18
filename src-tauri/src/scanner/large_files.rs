use std::ffi::OsStr;
use std::fs;
use std::path::Path;

use uuid::Uuid;

use crate::models::{Category, RiskLevel, ScanItem};
use crate::scanner::util::{
    expand_path, file_age_days, file_mtime_unix, is_excluded, is_never_touch_scan_path,
};

fn is_skipped_segment(name: &OsStr) -> bool {
    let s = name.to_string_lossy();
    s.starts_with('.') || s == "node_modules"
}

/// Downloads rule: large archives older than 90 days.
fn downloads_large_archives(home: &Path, exclude_paths: &[String]) -> Vec<ScanItem> {
    let mut out = Vec::new();
    let dl = home.join("Downloads");
    if !dl.exists() {
        return out;
    }
    let exts = ["dmg", "pkg", "iso", "zip"];
    let Ok(rd) = fs::read_dir(&dl) else {
        return out;
    };
    for e in rd.flatten() {
        let p = e.path();
        if !p.is_file() {
            continue;
        }
        if is_never_touch_scan_path(home, &p) || is_excluded(&p, exclude_paths, home) {
            continue;
        }
        let ext = p.extension().and_then(|s| s.to_str()).unwrap_or("").to_ascii_lowercase();
        if !exts.contains(&ext.as_str()) {
            continue;
        }
        let size = fs::metadata(&p).map(|m| m.len()).unwrap_or(0);
        if size <= 100 * 1024 * 1024 {
            continue;
        }
        if file_age_days(&p).unwrap_or(0) < 90 {
            continue;
        }
        let name = p.file_name().and_then(|s| s.to_str()).unwrap_or("file").to_string();
        let mt = file_mtime_unix(&p).ok();
        out.push(ScanItem {
            id: Uuid::new_v4().to_string(),
            category: Category::LargeFiles,
            name,
            path: p.display().to_string(),
            size_bytes: size,
            last_modified: mt,
            last_accessed: None,
            risk_level: RiskLevel::Caution,
            description: "Large installer/archive in Downloads (>100MB, >90 days old).".to_string(),
            related_app: None,
            is_deletable: true,
        });
    }
    out
}

pub fn scan_large_files(
    home: &Path,
    threshold_bytes: u64,
    exclude_paths: &[String],
) -> Result<Vec<ScanItem>, String> {
    let mut items = Vec::new();
    items.extend(downloads_large_archives(home, exclude_paths));

    let home_abs = expand_path("~", home);
    let mut it = walkdir::WalkDir::new(&home_abs)
        .follow_links(false)
        .into_iter();
    loop {
        let entry = match it.next() {
            None => break,
            Some(Ok(e)) => e,
            Some(Err(e)) => return Err(format!("walk home: {e}")),
        };
        let path = entry.path();
        if is_never_touch_scan_path(home, path) || is_excluded(path, exclude_paths, home) {
            if entry.file_type().is_dir() {
                it.skip_current_dir();
            }
            continue;
        }

        let name = entry.file_name();
        if entry.depth() > 0 && is_skipped_segment(name) {
            if entry.file_type().is_dir() {
                it.skip_current_dir();
            }
            continue;
        }

        if entry.file_type().is_file() {
            let size = fs::metadata(path).map(|m| m.len()).unwrap_or(0);
            if size >= threshold_bytes {
                let fname = path
                    .file_name()
                    .and_then(|s| s.to_str())
                    .unwrap_or("file")
                    .to_string();
                let mt = file_mtime_unix(path).ok();
                items.push(ScanItem {
                    id: Uuid::new_v4().to_string(),
                    category: Category::LargeFiles,
                    name: fname,
                    path: path.display().to_string(),
                    size_bytes: size,
                    last_modified: mt,
                    last_accessed: None,
                    risk_level: RiskLevel::Caution,
                    description: format!(
                        "Large file (≥ {} bytes). Review before deleting.",
                        threshold_bytes
                    ),
                    related_app: None,
                    is_deletable: true,
                });
            }
        }
    }

    Ok(items)
}
