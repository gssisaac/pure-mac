import { useSyncExternalStore } from "react";
import type { Category } from "../lib/types";

const STORAGE_KEY = "puremac-settings-v1";

export type DeleteMode = "trash" | "permanent";

const defaultCategories: Category[] = [
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

export type SettingsState = {
  nodeModulesThresholdDays: number;
  appUnusedThresholdDays: number;
  largeFileThresholdMB: number;
  defaultDeleteMode: DeleteMode;
  searchPaths: string[];
  excludePaths: string[];
  enabledCategories: Category[];
  dryRun: boolean;
  lastScanAt: number | null;
  permissionDismissed: boolean;
};

const defaults: SettingsState = {
  nodeModulesThresholdDays: 365,
  appUnusedThresholdDays: 180,
  largeFileThresholdMB: 500,
  defaultDeleteMode: "trash",
  searchPaths: ["~/Developer", "~/Projects", "~/Desktop", "~/Documents"],
  excludePaths: [],
  enabledCategories: [...defaultCategories],
  dryRun: false,
  lastScanAt: null,
  permissionDismissed: false,
};

function load(): SettingsState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...defaults };
    const parsed = JSON.parse(raw) as Partial<SettingsState>;
    return { ...defaults, ...parsed };
  } catch {
    return { ...defaults };
  }
}

let state: SettingsState = load();
const listeners = new Set<() => void>();

function persist() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function emit() {
  listeners.forEach((l) => l());
}

export const settingsActions = {
  patch(partial: Partial<SettingsState>) {
    state = { ...state, ...partial };
    persist();
    emit();
  },
  setNodeModulesThresholdDays(v: number) {
    settingsActions.patch({ nodeModulesThresholdDays: v });
  },
  setAppUnusedThresholdDays(v: number) {
    settingsActions.patch({ appUnusedThresholdDays: v });
  },
  setLargeFileThresholdMB(v: number) {
    settingsActions.patch({ largeFileThresholdMB: v });
  },
  setDefaultDeleteMode(v: DeleteMode) {
    settingsActions.patch({ defaultDeleteMode: v });
  },
  setSearchPaths(paths: string[]) {
    settingsActions.patch({ searchPaths: paths });
  },
  setExcludePaths(paths: string[]) {
    settingsActions.patch({ excludePaths: paths });
  },
  toggleCategory(cat: Category, on: boolean) {
    const set = new Set(state.enabledCategories);
    if (on) set.add(cat);
    else set.delete(cat);
    settingsActions.patch({ enabledCategories: Array.from(set) });
  },
  setDryRun(v: boolean) {
    settingsActions.patch({ dryRun: v });
  },
  setLastScanAt(ts: number | null) {
    settingsActions.patch({ lastScanAt: ts });
  },
  setPermissionDismissed(v: boolean) {
    settingsActions.patch({ permissionDismissed: v });
  },
};

export function useSettingsStore(): SettingsState;
export function useSettingsStore<T>(selector: (s: SettingsState) => T): T;
export function useSettingsStore<T = SettingsState>(
  selector: (s: SettingsState) => T = (s) => s as T,
): T {
  return useSyncExternalStore(
    (on) => {
      listeners.add(on);
      return () => listeners.delete(on);
    },
    () => selector(state),
    () => selector(state),
  );
}
