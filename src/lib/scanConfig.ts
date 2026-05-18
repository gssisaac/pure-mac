import type { ScanConfig, Category } from "./types";
import type { SettingsState } from "../store/settingsStore";

const ALL: Category[] = [
  "Dotfiles",
  "NodeModules",
  "DormantApps",
  "AppSupport",
  "DeveloperTools",
  "SystemCache",
  "Browser",
  "Backups",
  "LargeFiles",
];

export function buildScanConfig(s: SettingsState): ScanConfig {
  return {
    enabledCategories: s.enabledCategories.length ? s.enabledCategories : ALL,
    searchPaths: s.searchPaths,
    nodeModulesThresholdDays: s.nodeModulesThresholdDays,
    appUnusedThresholdDays: s.appUnusedThresholdDays,
    largeFileThresholdBytes: Math.floor(s.largeFileThresholdMB * 1024 * 1024),
    excludePaths: s.excludePaths,
  };
}
