use std::path::{Path, PathBuf};
use std::process::Command;

use chrono::{DateTime, Utc};
use uuid::Uuid;

use crate::models::{Category, RiskLevel, ScanItem};
use crate::scanner::util::dir_size;

fn list_app_bundles(root: &Path) -> Vec<PathBuf> {
    let mut out = Vec::new();
    if let Ok(rd) = std::fs::read_dir(root) {
        for e in rd.flatten() {
            let p = e.path();
            if p.extension().and_then(|s| s.to_str()) == Some("app") {
                out.push(p);
            }
        }
    }
    out
}

fn parse_mdls_output(stdout: &str) -> (Option<chrono::DateTime<Utc>>, Option<String>) {
    let mut last_used: Option<DateTime<Utc>> = None;
    let mut version: Option<String> = None;
    for raw in stdout.lines() {
        let line = raw.trim();
        if line.starts_with("kMDItemLastUsedDate") {
            if let Some(v) = line.split('=').nth(1) {
                let v = v.trim().trim_matches(|c| c == '"' || c == '(' || c == ')');
                if v != "(null)" && !v.is_empty() {
                    // Try ISO-like parsing
                    if let Ok(dt) = DateTime::parse_from_rfc3339(v) {
                        last_used = Some(dt.with_timezone(&Utc));
                    } else if let Ok(dt) = DateTime::parse_from_str(v, "%Y-%m-%d %H:%M:%S %z") {
                        last_used = Some(dt.with_timezone(&Utc));
                    }
                }
            }
        } else if line.starts_with("kMDItemVersion") {
            if let Some(v) = line.split('=').nth(1) {
                let v = v.trim().trim_matches('"');
                if v != "(null)" && !v.is_empty() {
                    version = Some(v.to_string());
                }
            }
        }
    }
    (last_used, version)
}

fn mdls_app(path: &Path) -> (Option<DateTime<Utc>>, Option<String>) {
    let out = Command::new("mdls")
        .args([
            "-name",
            "kMDItemLastUsedDate",
            "-name",
            "kMDItemVersion",
            &path.display().to_string(),
        ])
        .output();

    let Ok(output) = out else {
        return (None, None);
    };
    let s = String::from_utf8_lossy(&output.stdout);
    parse_mdls_output(&s)
}

pub fn scan_dormant_apps(
    home: &Path,
    app_unused_threshold_days: u32,
) -> Result<Vec<ScanItem>, String> {
    let roots = [PathBuf::from("/Applications"), home.join("Applications")];
    let mut items = Vec::new();

    for root in roots {
        for app in list_app_bundles(&root) {
            let app_s = app.display().to_string();
            if app_s.starts_with("/System/") {
                continue;
            }

            let (last_used, version) = mdls_app(&app);
            let now = Utc::now();

            let days_since = last_used.map(|lu| (now - lu).num_days());

            // App never used / no metadata date -> Caution, lowest priority.
            let (risk, desc) = match days_since {
                None => (
                    RiskLevel::Caution,
                    "No last-used metadata found; review before removing.".to_string(),
                ),
                Some(d) if d < app_unused_threshold_days as i64 => {
                    continue;
                }
                Some(d) if d < 365 => (
                    RiskLevel::Caution,
                    format!("Last used about {d} days ago (>{app_unused_threshold_days}d)."),
                ),
                Some(d) => (
                    RiskLevel::Recommended,
                    format!("Last used about {d} days ago; likely safe to remove if unneeded."),
                ),
            };

            let size = dir_size(&app).unwrap_or(0);
            let stem = app
                .file_stem()
                .and_then(|s| s.to_str())
                .unwrap_or("App")
                .to_string();

            let mut description = desc;
            if let Some(v) = version {
                description.push_str(&format!(" (version {v})"));
            }

            items.push(ScanItem {
                id: Uuid::new_v4().to_string(),
                category: Category::DormantApps,
                name: stem,
                path: app.display().to_string(),
                size_bytes: size,
                last_modified: None,
                last_accessed: last_used.map(|d| d.timestamp()),
                risk_level: risk,
                description,
                related_app: None,
                is_deletable: true,
            });
        }
    }

    Ok(items)
}
