mod app_support;
mod backups;
mod browser;
mod developer;
mod dotfiles;
mod dormant_apps;
mod large_files;
mod node_modules;
mod system_cache;
pub mod util;

pub use app_support::collect_installed_bundle_ids;

use std::collections::HashSet;
use std::sync::atomic::{AtomicBool, Ordering};

use tauri::{AppHandle, Emitter};



use crate::models::{
    Category, CategorySummary, ScanConfig, ScanItem, ScanProgress, ScanSummary,
};

fn category_slug(c: &Category) -> &'static str {

    match c {
        Category::Dotfiles => "dotfiles",
        Category::NodeModules => "node_modules",
        Category::DormantApps => "dormant_apps",
        Category::AppSupport => "app_support",
        Category::DeveloperTools => "developer_tools",
        Category::SystemCache => "system_cache",
        Category::Browser => "browser",
        Category::Backups => "backups",
        Category::LargeFiles => "large_files",
    }
}

fn all_categories() -> Vec<Category> {
    vec![
        Category::Dotfiles,
        Category::DormantApps,
        Category::AppSupport,
        Category::DeveloperTools,
        Category::SystemCache,
        Category::NodeModules,
        Category::Browser,
        Category::Backups,
        Category::LargeFiles,
    ]
}

fn order_enabled_categories(enabled: &[Category]) -> Vec<Category> {
    let selected: HashSet<Category> = enabled.iter().cloned().collect();
    all_categories()
        .into_iter()
        .filter(|c| selected.contains(c))
        .collect()
}

pub fn run_scan(
    app: &AppHandle,
    cancel: &AtomicBool,
    mut config: ScanConfig,
    emit_item_events: bool,
) -> Result<(Vec<ScanItem>, ScanSummary), String> {
    let home =
        dirs::home_dir().ok_or_else(|| "Could not resolve user home directory.".to_string())?;

    if config.enabled_categories.is_empty() {
        config.enabled_categories = all_categories();
    } else {
        config.enabled_categories = order_enabled_categories(&config.enabled_categories);
    }

    let mut items: Vec<ScanItem> = Vec::new();
    let exclude = config.exclude_paths.clone();
    let search_paths = config.search_paths.clone();

    for cat in &config.enabled_categories {
        if cancel.load(Ordering::SeqCst) {
            break;
        }

        let slug = category_slug(cat);
        let _ = app.emit(
            "scan_progress",
            ScanProgress {
                category: slug.to_string(),
                current_path: String::new(),
                items_found: items.len(),
                bytes_found: items.iter().map(|i| i.size_bytes).sum(),
            },
        );

        let chunk = match cat {
            Category::Dotfiles => dotfiles::scan_dotfiles(&home, &exclude)?,
            Category::NodeModules => node_modules::scan_node_modules(
                &home,
                &search_paths,
                config.node_modules_threshold_days,
                &exclude,
            )?,
            Category::DormantApps => {
                dormant_apps::scan_dormant_apps(&home, config.app_unused_threshold_days)?
            }
            Category::AppSupport => app_support::scan_app_support(&home, &exclude)?,
            Category::DeveloperTools => developer::scan_developer(&home, &exclude)?,
            Category::SystemCache => system_cache::scan_system_cache(&home, &exclude)?,
            Category::Browser => browser::scan_browser_cache(&home, &exclude)?,
            Category::Backups => backups::scan_mobile_backups(&home, &exclude)?,
            Category::LargeFiles => large_files::scan_large_files(
                &home,
                config.large_file_threshold_bytes,
                &exclude,
            )?,
        };

        for it in chunk {
            if emit_item_events {
                let _ = app.emit("scan_item_found", &it);
            }
            items.push(it);

            if items.len() % 25 == 0 {
                let bytes_found: u64 = items.iter().map(|i| i.size_bytes).sum();
                let _ = app.emit(
                    "scan_progress",
                    ScanProgress {
                        category: slug.to_string(),
                        current_path: items
                            .last()
                            .map(|i| i.path.clone())
                            .unwrap_or_default(),
                        items_found: items.len(),
                        bytes_found,
                    },
                );
            }

            if cancel.load(Ordering::SeqCst) {
                break;
            }
        }
    }

    let mut summaries: Vec<CategorySummary> = Vec::new();
    for c in all_categories() {
        let mut item_count = 0usize;
        let mut total_bytes = 0u64;
        for it in &items {
            if it.category == c {
                item_count += 1;
                total_bytes += it.size_bytes;
            }
        }
        if item_count > 0 {
            summaries.push(CategorySummary {
                category: c,
                item_count,
                total_bytes,
            });
        }
    }

    let total_items = items.len();
    let total_bytes: u64 = items.iter().map(|i| i.size_bytes).sum();
    let summary = ScanSummary {
        total_items,
        total_bytes,
        categories: summaries,
    };

    Ok((items, summary))
}
