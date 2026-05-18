use std::collections::HashSet;
use std::fs;
use std::path::{Path, PathBuf};

use plist::Value;
use uuid::Uuid;

use crate::models::{Category, RiskLevel, ScanItem};
use crate::scanner::util::{dir_size, is_excluded, is_never_touch_scan_path};

pub fn collect_installed_bundle_ids(home: &Path) -> Result<HashSet<String>, String> {
    let mut ids = HashSet::new();
    for root in [PathBuf::from("/Applications"), home.join("Applications")] {
        if let Ok(rd) = fs::read_dir(&root) {
            for e in rd.flatten() {
                let p = e.path();
                if p.extension().and_then(|s| s.to_str()) != Some("app") {
                    continue;
                }
                let plist_path = p.join("Contents/Info.plist");
                if let Ok(val) = Value::from_file(&plist_path) {
                    if let Some(dict) = val.as_dictionary() {
                        if let Some(id) = dict
                            .get("CFBundleIdentifier")
                            .and_then(|v| v.as_string())
                        {
                            ids.insert(id.to_string());
                        }
                    }
                }
            }
        }
    }
    Ok(ids)
}

fn is_whitelisted_key(key: &str) -> bool {
    key.starts_with("com.apple.")
        || key == "Apple"
        || key == "macOS"
        || key.starts_with("com.microsoft.")
}

fn key_matches_installed(key: &str, ids: &HashSet<String>) -> bool {
    if is_whitelisted_key(key) {
        return true;
    }
    for id in ids {
        if id == key {
            return true;
        }
        if id.starts_with(&format!("{key}.")) || key.starts_with(&format!("{id}.")) {
            return true;
        }
        if let Some(last) = id.rsplit('.').next() {
            if last == key {
                return true;
            }
        }
    }
    false
}

fn scan_dir_children(
    base: &Path,
    home: &Path,
    ids: &HashSet<String>,
    exclude_paths: &[String],
    prefs_only: bool,
    items: &mut Vec<ScanItem>,
) {
    let Ok(rd) = fs::read_dir(base) else {
        return;
    };
    for e in rd.flatten() {
        let path = e.path();
        if is_never_touch_scan_path(home, &path) || is_excluded(&path, exclude_paths, home) {
            continue;
        }
        let key = path
            .file_name()
            .and_then(|s| s.to_str())
            .unwrap_or("")
            .to_string();

        if prefs_only {
            if path.extension().and_then(|s| s.to_str()) != Some("plist") {
                continue;
            }
            let stem = path
                .file_stem()
                .and_then(|s| s.to_str())
                .unwrap_or("")
                .to_string();
            if key_matches_installed(&stem, ids) || is_whitelisted_key(&stem) {
                continue;
            }
            let size = fs::metadata(&path).map(|m| m.len()).unwrap_or(0);
            items.push(ScanItem {
                id: Uuid::new_v4().to_string(),
                category: Category::AppSupport,
                name: stem.clone(),
                path: path.display().to_string(),
                size_bytes: size,
                last_modified: None,
                last_accessed: None,
                risk_level: RiskLevel::Recommended,
                description: "Preference plist with no obvious installed owner.".to_string(),
                related_app: None,
                is_deletable: true,
            });
            continue;
        }

        if key_matches_installed(&key, ids) || is_whitelisted_key(&key) {
            continue;
        }

        let size = if path.is_dir() {
            dir_size(&path).unwrap_or(0)
        } else {
            fs::metadata(&path).map(|m| m.len()).unwrap_or(0)
        };

        items.push(ScanItem {
            id: Uuid::new_v4().to_string(),
            category: Category::AppSupport,
            name: key.clone(),
            path: path.display().to_string(),
            size_bytes: size,
            last_modified: None,
            last_accessed: None,
            risk_level: RiskLevel::Recommended,
            description: "Leftover Application Support data with no obvious installed owner."
                .to_string(),
            related_app: None,
            is_deletable: true,
        });
    }
}

pub fn scan_app_support(home: &Path, exclude_paths: &[String]) -> Result<Vec<ScanItem>, String> {
    let ids = collect_installed_bundle_ids(home)?;
    let mut items = Vec::new();

    let bases = vec![
        home.join("Library/Application Support"),
        home.join("Library/Caches"),
        home.join("Library/Containers"),
        home.join("Library/Group Containers"),
        home.join("Library/Logs"),
        home.join("Library/Saved Application State"),
        home.join("Library/Application Scripts"),
    ];

    for base in bases {
        if base.exists() {
            scan_dir_children(&base, home, &ids, exclude_paths, false, &mut items);
        }
    }

    let prefs = home.join("Library/Preferences");
    if prefs.exists() {
        scan_dir_children(&prefs, home, &ids, exclude_paths, true, &mut items);
    }

    Ok(items)
}
