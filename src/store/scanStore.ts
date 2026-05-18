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
  /**
   * Subfolders selected for deletion on the result detail page (path → metadata).
   */
  detailSubfolderSelection: Map<string, { name: string; sizeBytes: number }>;
  /** Bumped after filesystem deletes so the subfolder list refetches. */
  detailSubfolderListNonce: number;
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
  detailSubfolderSelection: new Map(),
  detailSubfolderListNonce: 0,
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

function normPath(p: string): string {
  return p.replace(/\/+$/, "") || "/";
}

/** Drop stack entries removed or under deleted paths; preserve root if valid. */
function stackAfterPathDeletes(stack: string[], deleted: Set<string>): string[] {
  if (stack.length === 0) return [];
  const isRemoved = (p: string) => {
    const pn = normPath(p);
    for (const d of deleted) {
      const dn = normPath(d);
      if (pn === dn || pn.startsWith(`${dn}/`)) return true;
    }
    return false;
  };
  const root = stack[0]!;
  if (isRemoved(root)) return [];
  const filtered = stack.filter((p) => !isRemoved(p));
  if (filtered.length === 0) return [root];
  return filtered;
}

export const scanActions = {
  reset() {
    state = {
      ...initial,
      completedCategories: new Set(),
      detailItemId: null,
      detailFolderStack: [],
      detailSubfolderSelection: new Map(),
      detailSubfolderListNonce: 0,
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
    setState({
      selectedIds: new Set(),
      detailSubfolderSelection: new Map(),
    });
  },
  removeItems(ids: Set<string>) {
    let detailItemId = state.detailItemId;
    let detailFolderStack = state.detailFolderStack;
    let detailSubfolderSelection = state.detailSubfolderSelection;
    if (detailItemId && ids.has(detailItemId)) {
      detailItemId = null;
      detailFolderStack = [];
      detailSubfolderSelection = new Map();
    }
    setState({
      items: state.items.filter((i) => !ids.has(i.id)),
      selectedIds: new Set(
        [...state.selectedIds].filter((id) => !ids.has(id)),
      ),
      detailItemId,
      detailFolderStack,
      detailSubfolderSelection,
    });
  },
  setActiveCategory(cat: ActiveCategory) {
    setState({
      activeCategory: cat,
      detailItemId: null,
      detailFolderStack: [],
      detailSubfolderSelection: new Map(),
    });
  },
  openResultDetail(id: string) {
    const it = state.items.find((i) => i.id === id);
    setState({
      detailItemId: id,
      detailFolderStack: it ? [it.path] : [],
      detailSubfolderSelection: new Map(),
    });
  },
  closeResultDetail() {
    setState({
      detailItemId: null,
      detailFolderStack: [],
      detailSubfolderSelection: new Map(),
    });
  },
  navigateDetailSubfolder(path: string) {
    setState({
      detailFolderStack: [...state.detailFolderStack, path],
      detailSubfolderSelection: new Map(),
    });
  },
  navigateDetailFolderUp() {
    const st = state.detailFolderStack;
    if (st.length <= 1) return;
    setState({
      detailFolderStack: st.slice(0, -1),
      detailSubfolderSelection: new Map(),
    });
  },
  toggleDetailSubfolderSelection(entry: {
    path: string;
    name: string;
    sizeBytes: number;
  }) {
    const next = new Map(state.detailSubfolderSelection);
    if (next.has(entry.path)) next.delete(entry.path);
    else next.set(entry.path, { name: entry.name, sizeBytes: entry.sizeBytes });
    setState({ detailSubfolderSelection: next });
  },
  finishDeletingPaths(deletedPaths: Set<string>, deletedScanIds: Set<string>) {
    const items = state.items.filter(
      (i) => !deletedScanIds.has(i.id) && !deletedPaths.has(i.path),
    );
    const subSel = new Map(state.detailSubfolderSelection);
    for (const p of deletedPaths) subSel.delete(p);

    let detailItemId = state.detailItemId;
    let detailFolderStack = stackAfterPathDeletes(
      state.detailFolderStack,
      deletedPaths,
    );

    if (detailFolderStack.length === 0) {
      detailItemId = null;
    }
    if (detailItemId && !items.some((i) => i.id === detailItemId)) {
      detailItemId = null;
      detailFolderStack = [];
    }

    setState({
      items,
      selectedIds: new Set(
        [...state.selectedIds].filter((id) =>
          items.some((i) => i.id === id),
        ),
      ),
      detailItemId,
      detailFolderStack,
      detailSubfolderSelection: subSel,
      detailSubfolderListNonce: state.detailSubfolderListNonce + 1,
    });
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
