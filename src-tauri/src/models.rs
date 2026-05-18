use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "PascalCase")]
pub enum RiskLevel {
    Safe,
    Caution,
    Recommended,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq, Hash)]
#[serde(rename_all = "PascalCase")]
pub enum Category {
    Dotfiles,
    NodeModules,
    DormantApps,
    AppSupport,
    DeveloperTools,
    SystemCache,
    Browser,
    Backups,
    LargeFiles,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ScanItem {
    pub id: String,
    pub category: Category,
    pub name: String,
    pub path: String,
    pub size_bytes: u64,
    pub last_modified: Option<i64>,
    pub last_accessed: Option<i64>,
    pub risk_level: RiskLevel,
    pub description: String,
    pub related_app: Option<String>,
    pub is_deletable: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ScanProgress {
    pub category: String,
    pub current_path: String,
    pub items_found: usize,
    pub bytes_found: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ScanSummary {
    pub total_items: usize,
    pub total_bytes: u64,
    pub categories: Vec<CategorySummary>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CategorySummary {
    pub category: Category,
    pub item_count: usize,
    pub total_bytes: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DeleteResult {
    pub succeeded: Vec<String>,
    pub failed: Vec<(String, String)>,
    pub bytes_freed: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DiskInfo {
    pub total_bytes: u64,
    pub available_bytes: u64,
    pub used_bytes: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SubfolderEntry {
    pub name: String,
    pub path: String,
    pub size_bytes: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ScanConfig {
    pub enabled_categories: Vec<Category>,
    pub search_paths: Vec<String>,
    pub node_modules_threshold_days: u32,
    pub app_unused_threshold_days: u32,
    pub large_file_threshold_bytes: u64,
    pub exclude_paths: Vec<String>,
}
