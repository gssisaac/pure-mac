export type ScanStatus = "idle" | "scanning" | "complete";

export type RiskLevel = "Safe" | "Caution" | "Recommended";

export type Category =
  | "Dotfiles"
  | "NodeModules"
  | "DormantApps"
  | "AppSupport"
  | "DeveloperTools"
  | "SystemCache"
  | "Browser"
  | "Backups"
  | "LargeFiles";

export interface ScanItem {
  id: string;
  category: Category;
  name: string;
  path: string;
  sizeBytes: number;
  lastModified: number | null;
  lastAccessed: number | null;
  riskLevel: RiskLevel;
  description: string;
  relatedApp: string | null;
  isDeletable: boolean;
}

export interface ScanProgress {
  category: string;
  currentPath: string;
  itemsFound: number;
  bytesFound: number;
}

export interface CategorySummary {
  category: Category;
  itemCount: number;
  totalBytes: number;
}

export interface ScanSummary {
  totalItems: number;
  totalBytes: number;
  categories: CategorySummary[];
}

export interface DeleteResult {
  succeeded: string[];
  failed: [string, string][];
  bytesFreed: number;
}

export interface DiskInfo {
  totalBytes: number;
  availableBytes: number;
  usedBytes: number;
}

/** Immediate child directory of a path (from disk), with computed total size. */
export interface SubfolderEntry {
  name: string;
  path: string;
  sizeBytes: number;
}

export interface ScanConfig {
  enabledCategories: Category[];
  searchPaths: string[];
  nodeModulesThresholdDays: number;
  appUnusedThresholdDays: number;
  largeFileThresholdBytes: number;
  excludePaths: string[];
}
