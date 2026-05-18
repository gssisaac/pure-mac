use std::fs;
use std::path::Path;

use plist::Value;
use uuid::Uuid;

use crate::models::{Category, RiskLevel, ScanItem};
use crate::scanner::util::{dir_size, file_mtime_unix, is_excluded, is_never_touch_scan_path};

fn read_backup_info(backup_dir: &Path) -> (Option<String>, Option<String>) {
    let info = backup_dir.join("Info.plist");
    let Ok(val) = Value::from_file(&info) else {
        return (None, None);
    };
    let Some(dict) = val.as_dictionary() else {
        return (None, None);
    };
    let device = dict
        .get("Device Name")
        .or_else(|| dict.get("Target Identifier"))
        .and_then(|v| v.as_string())
        .map(|s| s.to_string());
    let ios = dict
        .get("Product Version")
        .and_then(|v| v.as_string())
        .map(|s| s.to_string());
    (device, ios)
}

pub fn scan_mobile_backups(home: &Path, exclude_paths: &[String]) -> Result<Vec<ScanItem>, String> {
    let base = home.join("Library/Application Support/MobileSync/Backup");
    if !base.exists() {
        return Ok(Vec::new());
    }

    let mut rows: Vec<(i64, std::path::PathBuf, u64)> = Vec::new();
    for e in fs::read_dir(&base)
        .map_err(|err| format!("MobileSync: {err}"))?
        .flatten()
    {
        let p = e.path();
        if !p.is_dir() {
            continue;
        }
        if is_never_touch_scan_path(home, &p) || is_excluded(&p, exclude_paths, home) {
            continue;
        }
        let mt = file_mtime_unix(&p).unwrap_or(0);
        let size = dir_size(&p).unwrap_or(0);
        rows.push((mt, p, size));
    }
    if rows.is_empty() {
        return Ok(Vec::new());
    }
    rows.sort_by_key(|r| r.0); // oldest first

    let mut items = Vec::new();
    for (idx, (mt, path, size)) in rows.into_iter().enumerate() {
        let (dev, ios) = read_backup_info(&path);
        let title = dev.unwrap_or_else(|| {
            path.file_name()
                .and_then(|s| s.to_str())
                .unwrap_or("backup")
                .to_string()
        });
        let mut desc = "iOS device backup".to_string();
        if let Some(v) = ios {
            desc.push_str(&format!(" (iOS {v})"));
        }
        let risk = if idx == 0 {
            RiskLevel::Recommended
        } else {
            RiskLevel::Caution
        };
        items.push(ScanItem {
            id: Uuid::new_v4().to_string(),
            category: Category::Backups,
            name: title,
            path: path.display().to_string(),
            size_bytes: size,
            last_modified: Some(mt),
            last_accessed: None,
            risk_level: risk,
            description: desc,
            related_app: Some("Finder / iTunes".to_string()),
            is_deletable: true,
        });
    }

    Ok(items)
}
