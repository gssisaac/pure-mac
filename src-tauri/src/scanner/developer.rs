use std::fs;
use std::path::{Path, PathBuf};

use uuid::Uuid;

use crate::models::{Category, RiskLevel, ScanItem};
use crate::scanner::util::{dir_size, file_mtime_unix, is_excluded, is_never_touch_scan_path};

fn push_dir_if_exists(
    path: PathBuf,
    home: &Path,
    exclude_paths: &[String],
    name: &str,
    description: &str,
    risk: RiskLevel,
    items: &mut Vec<ScanItem>,
) {
    if !path.exists() {
        return;
    }
    if is_never_touch_scan_path(home, &path) || is_excluded(&path, exclude_paths, home) {
        return;
    }
    let size = dir_size(&path).unwrap_or(0);
    let mt = file_mtime_unix(&path).ok();
    items.push(ScanItem {
        id: Uuid::new_v4().to_string(),
        category: Category::DeveloperTools,
        name: name.to_string(),
        path: path.display().to_string(),
        size_bytes: size,
        last_modified: mt,
        last_accessed: None,
        risk_level: risk,
        description: description.to_string(),
        related_app: None,
        is_deletable: true,
    });
}

fn push_children_versioned(
    base: PathBuf,
    home: &Path,
    exclude_paths: &[String],
    kind_label: &str,
    items: &mut Vec<ScanItem>,
) -> Result<(), String> {
    if !base.exists() {
        return Ok(());
    }
    let mut kids: Vec<(PathBuf, i64)> = Vec::new();
    for e in fs::read_dir(&base)
        .map_err(|err| format!("read {}: {err}", base.display()))?
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
        kids.push((p, mt));
    }
    if kids.is_empty() {
        return Ok(());
    }
    kids.sort_by(|a, b| b.1.cmp(&a.1)); // newest first
    let newest = kids.first().map(|k| k.0.clone());
    for (path, _) in kids {
        let is_newest = newest.as_ref().map(|n| n == &path).unwrap_or(false);
        let risk = if is_newest {
            RiskLevel::Caution
        } else {
            RiskLevel::Recommended
        };
        let ver = path
            .file_name()
            .and_then(|s| s.to_str())
            .unwrap_or("version")
            .to_string();
        let size = dir_size(&path).unwrap_or(0);
        let mt = file_mtime_unix(&path).ok();
        items.push(ScanItem {
            id: Uuid::new_v4().to_string(),
            category: Category::DeveloperTools,
            name: format!("{kind_label} {ver}"),
            path: path.display().to_string(),
            size_bytes: size,
            last_modified: mt,
            last_accessed: None,
            risk_level: risk,
            description: format!("{kind_label} installation; newest may still be active."),
            related_app: None,
            is_deletable: true,
        });
    }
    Ok(())
}

pub fn scan_developer(home: &Path, exclude_paths: &[String]) -> Result<Vec<ScanItem>, String> {
    let mut items = Vec::new();

    let xcode_dd = home.join("Library/Developer/Xcode/DerivedData");
    if xcode_dd.exists() {
        for e in fs::read_dir(&xcode_dd)
            .map_err(|err| format!("read DerivedData: {err}"))?
            .flatten()
        {
            let p = e.path();
            if !p.is_dir() {
                continue;
            }
            if is_never_touch_scan_path(home, &p) || is_excluded(&p, exclude_paths, home) {
                continue;
            }
            let name = p
                .file_name()
                .and_then(|s| s.to_str())
                .unwrap_or("project")
                .to_string();
            let size = dir_size(&p).unwrap_or(0);
            let mt = file_mtime_unix(&p).ok();
            items.push(ScanItem {
                id: Uuid::new_v4().to_string(),
                category: Category::DeveloperTools,
                name: format!("DerivedData {name}"),
                path: p.display().to_string(),
                size_bytes: size,
                last_modified: mt,
                last_accessed: None,
                risk_level: RiskLevel::Safe,
                description: "Xcode build products; safe to delete (will rebuild).".to_string(),
                related_app: Some("Xcode".to_string()),
                is_deletable: true,
            });
        }
    }

    let xcode_arch = home.join("Library/Developer/Xcode/Archives");
    if xcode_arch.exists() {
        for e in fs::read_dir(&xcode_arch)
            .map_err(|err| format!("read Archives: {err}"))?
            .flatten()
        {
            let p = e.path();
            if !p.is_dir() {
                continue;
            }
            if is_never_touch_scan_path(home, &p) || is_excluded(&p, exclude_paths, home) {
                continue;
            }
            let name = p.file_name().and_then(|s| s.to_str()).unwrap_or("archive");
            let size = dir_size(&p).unwrap_or(0);
            let mt = file_mtime_unix(&p).ok();
            items.push(ScanItem {
                id: Uuid::new_v4().to_string(),
                category: Category::DeveloperTools,
                name: format!("Xcode Archive {name}"),
                path: p.display().to_string(),
                size_bytes: size,
                last_modified: mt,
                last_accessed: None,
                risk_level: RiskLevel::Caution,
                description: "Old app archive; verify you do not need it.".to_string(),
                related_app: Some("Xcode".to_string()),
                is_deletable: true,
            });
        }
    }

    let ios_support = home.join("Library/Developer/Xcode/iOS DeviceSupport");
    if ios_support.exists() {
        for e in fs::read_dir(&ios_support)
            .map_err(|err| format!("read DeviceSupport: {err}"))?
            .flatten()
        {
            let p = e.path();
            if !p.is_dir() {
                continue;
            }
            if is_never_touch_scan_path(home, &p) || is_excluded(&p, exclude_paths, home) {
                continue;
            }
            let name = p.file_name().and_then(|s| s.to_str()).unwrap_or("device");
            let size = dir_size(&p).unwrap_or(0);
            let mt = file_mtime_unix(&p).ok();
            items.push(ScanItem {
                id: Uuid::new_v4().to_string(),
                category: Category::DeveloperTools,
                name: format!("iOS DeviceSupport {name}"),
                path: p.display().to_string(),
                size_bytes: size,
                last_modified: mt,
                last_accessed: None,
                risk_level: RiskLevel::Recommended,
                description: "Device support symbols; Xcode can re-download when needed."
                    .to_string(),
                related_app: Some("Xcode".to_string()),
                is_deletable: true,
            });
        }
    }

    let sims = home.join("Library/Developer/CoreSimulator/Devices");
    if sims.exists() {
        for e in fs::read_dir(&sims)
            .map_err(|err| format!("read Simulators: {err}"))?
            .flatten()
        {
            let p = e.path();
            if !p.is_dir() {
                continue;
            }
            if is_never_touch_scan_path(home, &p) || is_excluded(&p, exclude_paths, home) {
                continue;
            }
            let name = p.file_name().and_then(|s| s.to_str()).unwrap_or("sim");
            let size = dir_size(&p).unwrap_or(0);
            let mt = file_mtime_unix(&p).ok();
            items.push(ScanItem {
                id: Uuid::new_v4().to_string(),
                category: Category::DeveloperTools,
                name: format!("Simulator {name}"),
                path: p.display().to_string(),
                size_bytes: size,
                last_modified: mt,
                last_accessed: None,
                risk_level: RiskLevel::Caution,
                description: "iOS Simulator device data; big but may be in use.".to_string(),
                related_app: Some("Xcode".to_string()),
                is_deletable: true,
            });
        }
    }

    push_dir_if_exists(
        home.join(".gradle/caches"),
        home,
        exclude_paths,
        "Gradle caches",
        "Gradle build caches; safe to clear (re-download).",
        RiskLevel::Safe,
        &mut items,
    );
    push_dir_if_exists(
        home.join(".m2/repository"),
        home,
        exclude_paths,
        "Maven repository",
        "Local Maven artifacts; safe to trim (re-download).",
        RiskLevel::Safe,
        &mut items,
    );
    push_dir_if_exists(
        home.join(".cargo/registry"),
        home,
        exclude_paths,
        "Cargo registry",
        "Rust crates cache; safe to clear (re-download).",
        RiskLevel::Safe,
        &mut items,
    );
    push_dir_if_exists(
        home.join(".cocoapods/repos"),
        home,
        exclude_paths,
        "CocoaPods specs",
        "CocoaPods spec repos; can be re-downloaded.",
        RiskLevel::Caution,
        &mut items,
    );

    push_children_versioned(
        home.join(".nvm/versions/node"),
        home,
        exclude_paths,
        "Node (nvm)",
        &mut items,
    )?;
    push_children_versioned(
        home.join(".pyenv/versions"),
        home,
        exclude_paths,
        "Python (pyenv)",
        &mut items,
    )?;
    push_children_versioned(
        home.join(".rbenv/versions"),
        home,
        exclude_paths,
        "Ruby (rbenv)",
        &mut items,
    )?;

    push_dir_if_exists(
        home.join("Library/Containers/com.docker.docker"),
        home,
        exclude_paths,
        "Docker Desktop data",
        "Docker Desktop container data; review before deleting.",
        RiskLevel::Caution,
        &mut items,
    );

    Ok(items)
}
