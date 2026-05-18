import { useMemo } from "react";
import { TopBar } from "../components/layout/TopBar";
import {
  buildCategorySidebar,
  CategoryTabs,
  ResultList,
} from "../components/results/ResultList";
import { DeleteBar } from "../components/results/DeleteBar";
import { useScanStore } from "../store/scanStore";
import { useSettingsStore } from "../store/settingsStore";
import { formatBytes } from "../lib/utils";
import { Card } from "../components/ui/card";

export function ResultsPage() {
  const items = useScanStore((s) => s.items);
  const summary = useScanStore((s) => s.summary);
  const cat = useScanStore((s) => s.activeCategory);
  const dryRun = useSettingsStore((s) => s.dryRun);

  const sidebar = useMemo(() => buildCategorySidebar(items), [items]);

  const shown = useMemo(() => {
    if (cat === "all") return items;
    return items.filter((i) => i.category === cat);
  }, [items, cat]);

  return (
    <div className="page results-page">
      <TopBar
        title="Results"
        subtitle={
          summary
            ? `${summary.totalItems} items · ${formatBytes(summary.totalBytes)} can be freed`
            : "Run a scan to see reclaimable space."
        }
      />
      {dryRun && (
        <div className="banner">DRY RUN — deletions are simulated only.</div>
      )}
      <div className="results-layout">
        <aside className="results-aside app-scroll">
          <CategoryTabs categories={sidebar} />
        </aside>
        <main className="results-main">
          {shown.length === 0 ? (
            <Card className="category-card dash-cat-card results-empty-card">
              <p className="muted results-empty-card-text">
                Nothing in this filter yet.
              </p>
            </Card>
          ) : (
            <ResultList items={shown} />
          )}
        </main>
      </div>
      <DeleteBar />
    </div>
  );
}
