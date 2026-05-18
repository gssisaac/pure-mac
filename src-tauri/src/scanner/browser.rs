use std::path::Path;

use glob::glob;
use uuid::Uuid;

use crate::models::{Category, RiskLevel, ScanItem};
use crate::scanner::util::{dir_size, is_excluded, is_never_touch_scan_path};

fn push_if_exists(out: &mut Vec<(&'static str, String)>, label: &'static str, path: &Path) {
    if path.exists() {
        out.push((label, path.display().to_string()));
    }
}

pub fn scan_browser_cache(home: &Path, exclude_paths: &[String]) -> Result<Vec<ScanItem>, String> {
    let mut candidates: Vec<(&'static str, String)> = Vec::new();

    push_if_exists(
        &mut candidates,
        "Chrome (Caches)",
        &home.join("Library/Caches/com.google.Chrome"),
    );
    push_if_exists(
        &mut candidates,
        "Chrome (Default cache)",
        &home.join("Library/Application Support/Google/Chrome/Default/Cache"),
    );
    push_if_exists(
        &mut candidates,
        "Safari (Caches)",
        &home.join("Library/Caches/com.apple.Safari"),
    );
    push_if_exists(
        &mut candidates,
        "Safari (LocalStorage)",
        &home.join("Library/Safari/LocalStorage"),
    );

    for pattern in [
        format!(
            "{}/Library/Application Support/Firefox/Profiles/*/cache2",
            home.display()
        ),
        format!(
            "{}/Library/Application Support/Firefox/Profiles/*/storage",
            home.display()
        ),
    ] {
        if let Ok(paths) = glob(&pattern) {
            for p in paths.flatten() {
                candidates.push(("Firefox cache", p.display().to_string()));
            }
        }
    }

    push_if_exists(
        &mut candidates,
        "Opera",
        &home.join("Library/Application Support/com.operasoftware.Opera"),
    );
    push_if_exists(
        &mut candidates,
        "Microsoft Edge",
        &home.join("Library/Application Support/Microsoft Edge/Default/Cache"),
    );
    push_if_exists(
        &mut candidates,
        "Brave",
        &home.join("Library/Application Support/Brave Browser/Default/Cache"),
    );

    let mut items = Vec::new();
    let mut seen = std::collections::HashSet::new();

    for (label, pstr) in candidates {
        let path = Path::new(&pstr);
        if is_never_touch_scan_path(home, path) || is_excluded(path, exclude_paths, home) {
            continue;
        }
        if !seen.insert(pstr.clone()) {
            continue;
        }
        let size = dir_size(path).unwrap_or(0);
        items.push(ScanItem {
            id: Uuid::new_v4().to_string(),
            category: Category::Browser,
            name: label.to_string(),
            path: pstr,
            size_bytes: size,
            last_modified: None,
            last_accessed: None,
            risk_level: RiskLevel::Safe,
            description: "Browser cache; will be rebuilt on next use.".to_string(),
            related_app: None,
            is_deletable: true,
        });
    }

    Ok(items)
}
