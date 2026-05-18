import { useSyncExternalStore } from "react";
import type { Category, ScanItem, ScanStatus, ScanSummary } from "../lib/types";

export type ActiveCategory = Category | "all";

type ScanState = {
  status: ScanStatus;
  items: ScanItem[];
  summary: ScanSummary | null;
  selectedIds: Set<string>;
  activeCategory: ActiveCategory;
  /** When set, Results shows item detail view instead of the list. */
  detailItemId: string | null;
  /**
   * Folder navigation inside result detail: stack of paths; the last entry is
   * the directory whose immediate subfolders are listed.
   */
  detailFolderStack: string[];
  progress: {
    category: string;
    currentPath: string;
    itemsFound: number;
    bytesFound: number;
  } | null;
  completedCategories: Set<string>;
};

const ALL_CATEGORIES: Category[] = [
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

const initial: ScanState = {
  status: "idle",
  items: [],
  summary: null,
  selectedIds: new Set(),
  activeCategory: "all",
  detailItemId: null,
  detailFolderStack: [],
  progress: null,
  completedCategories: new Set(),
};

let state: ScanState = initial;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

function setState(partial: Partial<ScanState>) {
  state = { ...state, ...partial };
  emit();
}

export const scanActions = {
  reset() {
    state = {
      ...initial,
      completedCategories: new Set(),
      detailItemId: null,
      detailFolderStack: [],
    };
    emit();
  },
  setStatus(status: ScanStatus) {
    setState({ status });
  },
  addItem(item: ScanItem) {
    const exists = state.items.some((i) => i.id === item.id);
    const items = exists ? state.items : [...state.items, item];
    setState({ items });
  },
  setItems(items: ScanItem[]) {
    setState({ items });
  },
  setSummary(summary: ScanSummary | null) {
    setState({ summary });
  },
  toggleSelect(id: string) {
    const next = new Set(state.selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setState({ selectedIds: next });
  },
  selectAll(ids: string[]) {
    const next = new Set(state.selectedIds);
    ids.forEach((id) => next.add(id));
    setState({ selectedIds: next });
  },
  clearSelection() {
    setState({ selectedIds: new Set() });
  },
  removeItems(ids: Set<string>) {
    let detailItemId = state.detailItemId;
    let detailFolderStack = state.detailFolderStack;
    if (detailItemId && ids.has(detailItemId)) {
      detailItemId = null;
      detailFolderStack = [];
    }
    setState({
      items: state.items.filter((i) => !ids.has(i.id)),
      selectedIds: new Set(
        [...state.selectedIds].filter((id) => !ids.has(id)),
      ),
      detailItemId,
      detailFolderStack,
    });
  },
  setActiveCategory(cat: ActiveCategory) {
    setState({
      activeCategory: cat,
      detailItemId: null,
      detailFolderStack: [],
    });
  },
  openResultDetail(id: string) {
    const it = state.items.find((i) => i.id === id);
    setState({
      detailItemId: id,
      detailFolderStack: it ? [it.path] : [],
    });
  },
  closeResultDetail() {
    setState({ detailItemId: null, detailFolderStack: [] });
  },
  navigateDetailSubfolder(path: string) {
    setState({
      detailFolderStack: [...state.detailFolderStack, path],
    });
  },
  navigateDetailFolderUp() {
    const st = state.detailFolderStack;
    if (st.length <= 1) return;
    setState({ detailFolderStack: st.slice(0, -1) });
  },
  setProgress(p: ScanState["progress"]) {
    setState({ progress: p });
  },
  markCategoryDone(slug: string) {
    const next = new Set(state.completedCategories);
    next.add(slug);
    setState({ completedCategories: next });
  },
  clearProgressArtifacts() {
    setState({ progress: null, completedCategories: new Set() });
  },
  allCategorySlugs() {
    return ALL_CATEGORIES.map((c) => categoryToSlug(c));
  },
};

function categoryToSlug(c: Category): string {
  const map: Record<Category, string> = {
    Dotfiles: "dotfiles",
    NodeModules: "node_modules",
    DormantApps: "dormant_apps",
    AppSupport: "app_support",
    DeveloperTools: "developer_tools",
    SystemCache: "system_cache",
    Browser: "browser",
    Backups: "backups",
    LargeFiles: "large_files",
  };
  return map[c];
}

export function useScanStore(): ScanState;
export function useScanStore<T>(selector: (s: ScanState) => T): T;
export function useScanStore<T = ScanState>(
  selector: (s: ScanState) => T = (s) => s as T,
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

export { categoryToSlug, ALL_CATEGORIES };
