use std::fs;
use std::path::{Path, PathBuf};

use uuid::Uuid;

use crate::models::{Category, RiskLevel, ScanItem};
use crate::scanner::util::{dir_size, file_age_days, file_mtime_unix, is_excluded, is_never_touch_scan_path, DOTFILE_WHITELIST};

fn list_application_bundles(roots: &[PathBuf]) -> Vec<PathBuf> {
    let mut out = Vec::new();
    for root in roots {
        if let Ok(rd) = fs::read_dir(root) {
            for e in rd.flatten() {
                let p = e.path();
                if p.extension().and_then(|s| s.to_str()) == Some("app") {
                    out.push(p);
                }
            }
        }
    }
    out
}

fn bundle_display_token(path: &Path) -> String {
    path.file_stem()
        .and_then(|s| s.to_str())
        .unwrap_or("")
        .to_lowercase()
}

fn related_app_for_dotfolder(dot_name: &str, apps: &[PathBuf]) -> Option<String> {
    let stem = dot_name.trim_start_matches('.').to_lowercase();
    if stem.is_empty() {
        return None;
    }
    for app in apps {
        let token = bundle_display_token(app);
        if token.contains(&stem) || stem.contains(&token) {
            return Some(app.display().to_string());
        }
        // e.g. .vscode ↔ "visual studio code.app"
        if stem == "vscode" && token.contains("code") && token.contains("studio") {
            return Some(app.display().to_string());
        }
        if stem == "docker" && token.contains("docker") {
            return Some(app.display().to_string());
        }
    }
    None
}

pub fn scan_dotfiles(home: &Path, exclude_paths: &[String]) -> Result<Vec<ScanItem>, String> {
    let mut items = Vec::new();
    let app_roots = vec![PathBuf::from("/Applications"), home.join("Applications")];
    let apps = list_application_bundles(&app_roots);

    let rd = fs::read_dir(home).map_err(|e| format!("read home: {e}"))?;
    for entry in rd.flatten() {
        let path = entry.path();
        let name = entry.file_name().to_string_lossy().to_string();
        if !name.starts_with('.') {
            continue;
        }
        if !path.is_dir() {
            continue;
        }
        if DOTFILE_WHITELIST.iter().any(|w| w == &&name) {
            continue;
        }
        if is_never_touch_scan_path(home, &path) || is_excluded(&path, exclude_paths, home) {
            continue;
        }

        let related = related_app_for_dotfolder(&name, &apps);
        let age = file_age_days(&path).unwrap_or(0);

        match related {
            None => {
                let size = dir_size(&path).unwrap_or(0);
                let mt = file_mtime_unix(&path).ok();
                items.push(ScanItem {
                    id: Uuid::new_v4().to_string(),
                    category: Category::Dotfiles,
                    name: name.clone(),
                    path: path.display().to_string(),
                    size_bytes: size,
                    last_modified: mt,
                    last_accessed: None,
                    risk_level: RiskLevel::Recommended,
                    description: "No related installed app was found for this dot-directory."
                        .to_string(),
                    related_app: None,
                    is_deletable: true,
                });
            }
            Some(app_path) => {
                if age <= 365 {
                    continue;
                }
                let size = dir_size(&path).unwrap_or(0);
                let mt = file_mtime_unix(&path).ok();
                items.push(ScanItem {
                    id: Uuid::new_v4().to_string(),
                    category: Category::Dotfiles,
                    name: name.clone(),
                    path: path.display().to_string(),
                    size_bytes: size,
                    last_modified: mt,
                    last_accessed: None,
                    risk_level: RiskLevel::Caution,
                    description: format!(
                        "Related app exists ({app_path}), but this folder looks stale (>365 days old)."
                    ),
                    related_app: Some(app_path),
                    is_deletable: true,
                });
            }
        }
    }

    Ok(items)
}
