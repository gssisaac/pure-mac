import type { Category } from "./types";

/** Canonical order for scans, summaries, dashboard, and settings (node_modules is 6th). */
export const CANONICAL_CATEGORIES: Category[] = [
  "Dotfiles",
  "DormantApps",
  "AppSupport",
  "DeveloperTools",
  "SystemCache",
  "NodeModules",
  "Browser",
  "Backups",
  "LargeFiles",
];

/** Keep membership, drop extras, enforce canonical iteration order for the Rust scanner / UI. */
export function normalizeEnabledCategories(enabled: readonly Category[]): Category[] {
  const set = new Set(enabled);
  return CANONICAL_CATEGORIES.filter((c) => set.has(c));
}
