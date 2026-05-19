import {
  useCallback,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { Category, ScanItem } from "../../lib/types";
import { formatBytes } from "../../lib/utils";
import { ResultItem } from "./ResultItem";
import { scanActions, useScanStore, type ActiveCategory } from "../../store/scanStore";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";

const ROW_H = 72;

const LABELS: Record<Category, string> = {
  Dotfiles: "Dotfiles",
  NodeModules: "node_modules",
  DormantApps: "Dormant apps",
  AppSupport: "App support",
  DeveloperTools: "Developer",
  SystemCache: "System cache",
  Browser: "Browser",
  Backups: "Backups",
  LargeFiles: "Large files",
};

export function CategoryTabs({
  categories,
}: {
  categories: { cat: ActiveCategory; count: number; bytes: number }[];
}) {
  const active = useScanStore((s) => s.activeCategory);
  return (
    <div className="cat-tabs">
      {categories.map((c) => (
        <button
          key={c.cat}
          type="button"
          className={`cat-tab ${active === c.cat ? "active" : ""}`}
          onClick={() => scanActions.setActiveCategory(c.cat)}
        >
          <span>{c.cat === "all" ? "All" : LABELS[c.cat as Category]}</span>
          <span className="badge mono">{c.count}</span>
          <span className="muted tiny mono">{formatBytes(c.bytes)}</span>
        </button>
      ))}
    </div>
  );
}

export type RiskFilter = "all" | "recommended" | "other";
export type ResultSortKey = "size" | "accessed" | "name";

export function ResultsFilterSortControls({
  riskFilter,
  onRiskFilterChange,
  sort,
  onSortChange,
}: {
  riskFilter: RiskFilter;
  onRiskFilterChange: (v: RiskFilter) => void;
  sort: ResultSortKey;
  onSortChange: (v: ResultSortKey) => void;
}) {
  return (
    <div className="results-topbar-filters">
      <div className="result-toolbar-field result-toolbar-field-inline">
        <Label className="result-toolbar-label" htmlFor="results-risk-filter">
          Filter
        </Label>
        <Select
          value={riskFilter}
          onValueChange={(v) => onRiskFilterChange(v as RiskFilter)}
        >
          <SelectTrigger id="results-risk-filter" className="result-select-trigger">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All items</SelectItem>
            <SelectItem value="recommended">Recommended</SelectItem>
            <SelectItem value="other">Other (safe &amp; caution)</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="result-toolbar-field result-toolbar-field-inline">
        <Label className="result-toolbar-label" htmlFor="results-sort-select">
          Sort
        </Label>
        <Select value={sort} onValueChange={(v) => onSortChange(v as ResultSortKey)}>
          <SelectTrigger id="results-sort-select" className="result-select-trigger">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="size">Size (largest first)</SelectItem>
            <SelectItem value="accessed">Last accessed (recent first)</SelectItem>
            <SelectItem value="name">Name (A–Z)</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

function compareByAccessedDesc(a: ScanItem, b: ScanItem): number {
  const av = a.lastAccessed;
  const bv = b.lastAccessed;
  if (av == null && bv == null) return 0;
  if (av == null) return 1;
  if (bv == null) return -1;
  return bv - av;
}

export function ResultList({
  items,
  riskFilter,
  sort,
}: {
  items: ScanItem[];
  riskFilter: RiskFilter;
  sort: ResultSortKey;
}) {
  const [q, setQ] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const theadRef = useRef<HTMLTableSectionElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [viewH, setViewH] = useState(320);
  const [headH, setHeadH] = useState(40);

  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const measure = () => setViewH(Math.max(120, el.clientHeight));
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const filtered = useMemo(() => {
    let arr = items;
    if (riskFilter === "recommended") {
      arr = arr.filter((i) => i.riskLevel === "Recommended");
    } else if (riskFilter === "other") {
      arr = arr.filter((i) => i.riskLevel !== "Recommended");
    }
    arr = arr.filter((i) =>
      q.trim()
        ? `${i.name} ${i.path} ${i.description}`
            .toLowerCase()
            .includes(q.trim().toLowerCase())
        : true,
    );
    arr = [...arr].sort((a, b) => {
      if (sort === "size") return b.sizeBytes - a.sizeBytes;
      if (sort === "name") return a.name.localeCompare(b.name);
      return compareByAccessedDesc(a, b);
    });
    return arr;
  }, [items, q, sort, riskFilter]);

  useLayoutEffect(() => {
    const th = theadRef.current;
    if (!th) return;
    const measure = () => setHeadH(th.getBoundingClientRect().height);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(th);
    return () => ro.disconnect();
  }, [filtered.length, q, sort, riskFilter]);

  const onScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setScrollTop(el.scrollTop);
  }, []);

  const bodyTop = scrollTop - headH;
  const bodyBottom = scrollTop + viewH - headH;
  const start = Math.max(0, Math.floor(bodyTop / ROW_H) - 4);
  const end = Math.min(
    filtered.length,
    Math.ceil(bodyBottom / ROW_H) + 4,
  );
  const slice = filtered.slice(start, end);
  const padTop = start * ROW_H;
  const padBottom = (filtered.length - end) * ROW_H;

  return (
    <div className="result-list-wrap">
      <div className="result-toolbar row spread">
        <Input
          className="search"
          placeholder="Search…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>
      <div
        className="virtual-scroll app-scroll"
        ref={scrollRef}
        onScroll={onScroll}
      >
        <table className="result-table">
          <colgroup>
            <col className="result-col-check" />
            <col className="result-col-name" />
            <col className="result-col-size" />
            <col className="result-col-risk" />
            <col className="result-col-action" />
          </colgroup>
          <thead ref={theadRef}>
            <tr>
              <th scope="col" className="result-th result-th-check" aria-label="Select" />
              <th scope="col" className="result-th">Name</th>
              <th scope="col" className="result-th result-th-num">Size</th>
              <th scope="col" className="result-th">Risk</th>
              <th scope="col" className="result-th result-th-action" aria-label="Actions" />
            </tr>
          </thead>
          <tbody>
            {padTop > 0 && (
              <tr className="result-vspacer" aria-hidden>
                <td colSpan={5} style={{ height: padTop }} />
              </tr>
            )}
            {slice.map((it) => (
              <ResultItem key={it.id} item={it} />
            ))}
            {padBottom > 0 && (
              <tr className="result-vspacer" aria-hidden>
                <td colSpan={5} style={{ height: padBottom }} />
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function buildCategorySidebar(items: ScanItem[]) {
  const map = new Map<Category, { count: number; bytes: number }>();
  for (const it of items) {
    const cur = map.get(it.category) ?? { count: 0, bytes: 0 };
    cur.count += 1;
    cur.bytes += it.sizeBytes;
    map.set(it.category, cur);
  }
  const keys = Array.from(map.keys());
  keys.sort((a, b) => LABELS[a].localeCompare(LABELS[b]));
  const rows: { cat: ActiveCategory; count: number; bytes: number }[] = [
    {
      cat: "all",
      count: items.length,
      bytes: items.reduce((a, i) => a + i.sizeBytes, 0),
    },
  ];
  for (const k of keys) {
    const v = map.get(k)!;
    rows.push({ cat: k, count: v.count, bytes: v.bytes });
  }
  return rows;
}
