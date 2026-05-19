import { useEffect, useMemo, useState } from "react";
import { TopBar } from "../components/layout/TopBar";
import { DiskOverviewSlim } from "../components/dashboard/DiskUsageChart";
import {
  buildCategorySidebar,
  CategoryTabs,
  ResultList,
  ResultsFilterSortControls,
  type RiskFilter,
  type ResultSortKey,
} from "../components/results/ResultList";
import { DeleteBar } from "../components/results/DeleteBar";
import { useScanStore } from "../store/scanStore";
import { useSettingsStore } from "../store/settingsStore";
import { formatBytes } from "../lib/utils";
import type { DiskInfo } from "../lib/types";
import * as api from "../lib/tauri";
import { Card } from "../components/ui/card";

export function ResultsPage() {
  const items = useScanStore((s) => s.items);
  const summary = useScanStore((s) => s.summary);
  const cat = useScanStore((s) => s.activeCategory);
  const dryRun = useSettingsStore((s) => s.dryRun);
  const [riskFilter, setRiskFilter] = useState<RiskFilter>("all");
  const [sort, setSort] = useState<ResultSortKey>("size");
  const [disk, setDisk] = useState<DiskInfo | null>(null);

  useEffect(() => {
    void api.getDiskInfo().then(setDisk).catch(console.error);
  }, [items.length, summary?.totalBytes]);

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
        end={
          shown.length > 0 ? (
            <ResultsFilterSortControls
              riskFilter={riskFilter}
              onRiskFilterChange={setRiskFilter}
              sort={sort}
              onSortChange={setSort}
            />
          ) : undefined
        }
      />
      {dryRun && (
        <div className="banner">DRY RUN — deletions are simulated only.</div>
      )}
      <DiskOverviewSlim disk={disk} summary={summary} />
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
            <ResultList items={shown} riskFilter={riskFilter} sort={sort} />
          )}
        </main>
      </div>
      <DeleteBar />
    </div>
  );
}
