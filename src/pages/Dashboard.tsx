import { useEffect, useState } from "react";
import * as api from "../lib/tauri";
import type { DiskInfo } from "../lib/types";
import { DiskUsageChart } from "../components/dashboard/DiskUsageChart";
import {
  CategoryCard,
  allDashboardCategories,
} from "../components/dashboard/CategoryCard";
import { TopBar } from "../components/layout/TopBar";
import { useScanStore } from "../store/scanStore";
import { useSettingsStore, settingsActions } from "../store/settingsStore";
import { buildScanConfig } from "../lib/scanConfig";
import { useScanLive } from "../hooks/useScan";
import { formatRelativeDate } from "../lib/utils";
import { Play } from "lucide-react";
import { Button } from "../components/ui/button";

export function Dashboard({
  goScanner,
  goResults,
}: {
  goScanner: () => void;
  goResults: () => void;
}) {
  const [disk, setDisk] = useState<DiskInfo | null>(null);
  const summary = useScanStore((s) => s.summary);
  const status = useScanStore((s) => s.status);
  const settings = useSettingsStore((s) => s);
  const last = useSettingsStore((s) => s.lastScanAt);
  const { start } = useScanLive();

  useEffect(() => {
    void api.getDiskInfo().then(setDisk).catch(console.error);
  }, []);

  const run = async () => {
    try {
      goScanner();
      await start(buildScanConfig(settings));
      settingsActions.setLastScanAt(Date.now() / 1000);
      goResults();
    } catch (e) {
      console.error(e);
    }
  };

  const cats = allDashboardCategories();

  return (
    <div className="page">
      <TopBar
        title="Dashboard"
        subtitle={
          last
            ? `Last scanned: ${formatRelativeDate(last)}`
            : "No scan yet — start below."
        }
      />
      <div className="stack">
        <DiskUsageChart disk={disk} summary={summary} />
        <div className="row gap wrap">
          <Button
            disabled={status === "scanning"}
            onClick={() => void run()}
          >
            <Play size={16} fill="currentColor" />
            Start scan
          </Button>
        </div>
        <div className="grid cats">
          {cats.map((c) => (
            <CategoryCard key={c} cat={c} summary={summary} />
          ))}
        </div>
      </div>
    </div>
  );
}
