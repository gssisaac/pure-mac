use std::fs;
use std::time::UNIX_EPOCH;

/// `generate_context!` reads bundle icons from disk; Cargo does not track those paths, so changing
/// an icon would otherwise leave a stale app/window icon in dev. Emit a stamp + rerun-if-changed
/// so the library recompiles when any bundle icon changes.
fn stamp_bundle_icons() {
    const ICON_PATHS: &[&str] = &[
        "icons/32x32.png",
        "icons/128x128.png",
        "icons/128x128@2x.png",
        "icons/icon.icns",
        "icons/icon.ico",
        "icons/icon.png",
    ];

    for path in ICON_PATHS {
        println!("cargo:rerun-if-changed={path}");
    }

    let mut stamp = String::new();
    for path in ICON_PATHS {
        stamp.push_str(path);
        stamp.push('=');
        match fs::metadata(path).and_then(|m| m.modified()) {
            Ok(t) => {
                stamp.push_str(
                    &t.duration_since(UNIX_EPOCH)
                        .unwrap_or_default()
                        .as_nanos()
                        .to_string(),
                );
            }
            Err(_) => stamp.push('0'),
        }
        stamp.push(';');
    }
    println!("cargo:rustc-env=TAURI_ICON_STAMP={stamp}");
}

fn main() {
    stamp_bundle_icons();
    tauri_build::build();
}
