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
import { Select } from "../ui/select";

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

type SortKey = "size" | "date" | "name";

export function ResultList({ items }: { items: ScanItem[] }) {
  const [sort, setSort] = useState<SortKey>("size");
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
    let arr = items.filter((i) =>
      q.trim()
        ? `${i.name} ${i.path} ${i.description}`
            .toLowerCase()
            .includes(q.trim().toLowerCase())
        : true,
    );
    arr = [...arr].sort((a, b) => {
      if (sort === "size") return b.sizeBytes - a.sizeBytes;
      if (sort === "name") return a.name.localeCompare(b.name);
      const ad = a.lastModified ?? 0;
      const bd = b.lastModified ?? 0;
      return ad - bd;
    });
    return arr;
  }, [items, q, sort]);

  useLayoutEffect(() => {
    const th = theadRef.current;
    if (!th) return;
    const measure = () => setHeadH(th.getBoundingClientRect().height);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(th);
    return () => ro.disconnect();
  }, [filtered.length, q, sort]);

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
        <Select
          className="select"
          value={sort}
          onChange={(e) => setSort(e.target.value as SortKey)}
        >
          <option value="size">Size (desc)</option>
          <option value="date">Date (oldest first)</option>
          <option value="name">Name</option>
        </Select>
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
