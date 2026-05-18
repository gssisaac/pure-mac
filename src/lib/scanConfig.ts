import type { ScanConfig } from "./types";
import type { SettingsState } from "../store/settingsStore";
import {
  CANONICAL_CATEGORIES,
  normalizeEnabledCategories,
} from "./categoryOrder";

export function buildScanConfig(s: SettingsState): ScanConfig {
  const enabled = s.enabledCategories.length
    ? normalizeEnabledCategories(s.enabledCategories)
    : CANONICAL_CATEGORIES;
  return {
    enabledCategories: enabled,
    searchPaths: s.searchPaths,
    nodeModulesThresholdDays: s.nodeModulesThresholdDays,
    appUnusedThresholdDays: s.appUnusedThresholdDays,
    largeFileThresholdBytes: Math.floor(s.largeFileThresholdMB * 1024 * 1024),
    excludePaths: s.excludePaths,
  };
}
