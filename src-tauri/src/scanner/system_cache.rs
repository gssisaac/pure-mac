use std::collections::HashSet;
use std::fs;
use std::path::Path;
use std::process::Command;

use uuid::Uuid;

use crate::models::{Category, RiskLevel, ScanItem};
use crate::scanner::util::{dir_size, file_age_days, is_excluded, is_never_touch_scan_path};

fn running_process_tokens() -> HashSet<String> {
    let mut set = HashSet::new();
    let Ok(out) = Command::new("ps").arg("aux").output() else {
        return set;
    };
    let s = String::from_utf8_lossy(&out.stdout);
    for line in s.lines().skip(1) {
        // last column is command with args
        if let Some(cmd) = line.split_whitespace().last() {
            let base = cmd.rsplit('/').next().unwrap_or(cmd).to_lowercase();
            set.insert(base);
            set.insert(cmd.to_lowercase());
        }
    }
    set
}

fn name_looks_running(name: &str, ps: &HashSet<String>) -> bool {
    let n = name.to_lowercase();
    for p in ps {
        if p.contains(&n) || n.contains(p) {
            return true;
        }
    }
    false
}

pub fn scan_system_cache(home: &Path, exclude_paths: &[String]) -> Result<Vec<ScanItem>, String> {
    let ps = running_process_tokens();
    let mut items = Vec::new();

    let caches = home.join("Library/Caches");
    if caches.exists() {
        for e in fs::read_dir(&caches)
            .map_err(|e| format!("Caches: {e}"))?
            .flatten()
        {
            let p = e.path();
            if !p.is_dir() {
                continue;
            }
            if is_never_touch_scan_path(home, &p) || is_excluded(&p, exclude_paths, home) {
                continue;
            }
            let name = p.file_name().and_then(|s| s.to_str()).unwrap_or("cache");
            if name_looks_running(name, &ps) {
                continue;
            }
            let size = dir_size(&p).unwrap_or(0);
            items.push(ScanItem {
                id: Uuid::new_v4().to_string(),
                category: Category::SystemCache,
                name: name.to_string(),
                path: p.display().to_string(),
                size_bytes: size,
                last_modified: None,
                last_accessed: None,
                risk_level: RiskLevel::Safe,
                description: "User cache folder; macOS/apps recreate as needed.".to_string(),
                related_app: None,
                is_deletable: true,
            });
        }
    }

    let logs = home.join("Library/Logs");
    if logs.exists() {
        for e in fs::read_dir(&logs)
            .map_err(|e| format!("Logs: {e}"))?
            .flatten()
        {
            let p = e.path();
            if is_never_touch_scan_path(home, &p) || is_excluded(&p, exclude_paths, home) {
                continue;
            }
            let age = file_age_days(&p).unwrap_or(0);
            if age < 30 {
                continue;
            }
            let name = p.file_name().and_then(|s| s.to_str()).unwrap_or("log");
            if name_looks_running(name, &ps) {
                continue;
            }
            let size = if p.is_dir() {
                dir_size(&p).unwrap_or(0)
            } else {
                fs::metadata(&p).map(|m| m.len()).unwrap_or(0)
            };
            items.push(ScanItem {
                id: Uuid::new_v4().to_string(),
                category: Category::SystemCache,
                name: name.to_string(),
                path: p.display().to_string(),
                size_bytes: size,
                last_modified: None,
                last_accessed: None,
                risk_level: RiskLevel::Safe,
                description: "Old log data (>30 days); generally safe to remove.".to_string(),
                related_app: None,
                is_deletable: true,
            });
        }
    }

    let saved = home.join("Library/Saved Application State");
    if saved.exists() {
        for e in fs::read_dir(&saved)
            .map_err(|e| format!("Saved state: {e}"))?
            .flatten()
        {
            let p = e.path();
            if is_never_touch_scan_path(home, &p) || is_excluded(&p, exclude_paths, home) {
                continue;
            }
            let name = p.file_name().and_then(|s| s.to_str()).unwrap_or("state");
            if name_looks_running(name, &ps) {
                continue;
            }
            let size = if p.is_dir() {
                dir_size(&p).unwrap_or(0)
            } else {
                fs::metadata(&p).map(|m| m.len()).unwrap_or(0)
            };
            items.push(ScanItem {
                id: Uuid::new_v4().to_string(),
                category: Category::SystemCache,
                name: name.to_string(),
                path: p.display().to_string(),
                size_bytes: size,
                last_modified: None,
                last_accessed: None,
                risk_level: RiskLevel::Safe,
                description: "Saved window state; apps recreate session snapshots.".to_string(),
                related_app: None,
                is_deletable: true,
            });
        }
    }

    Ok(items)
}
