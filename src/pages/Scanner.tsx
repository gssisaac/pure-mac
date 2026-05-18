import { useScanLive } from "../hooks/useScan";
import { useScanStore, categoryToSlug, scanActions } from "../store/scanStore";
import { useSettingsStore } from "../store/settingsStore";
import { useEffect, useMemo, useRef } from "react";
import { Check, Circle, Loader2 } from "lucide-react";
import { Button } from "../components/ui/button";
import { formatBytes } from "../lib/utils";
import { TopBar } from "../components/layout/TopBar";

export function ScannerPage({ goHome }: { goHome: () => void }) {
  const progress = useScanStore((s) => s.progress);
  const itemsFound = useScanStore((s) => s.items.length);
  const bytesFound = useScanStore((s) =>
    s.items.reduce((a, i) => a + i.sizeBytes, 0),
  );
  const completed = useScanStore((s) => s.completedCategories);
  const enabled = useSettingsStore((s) => s.enabledCategories);
  const { cancel } = useScanLive();

  const slugs = useMemo(
    () => enabled.map((c) => categoryToSlug(c)),
    [enabled],
  );

  const prevCat = useRef<string | null>(null);
  useEffect(() => {
    const cur = progress?.category ?? null;
    if (prevCat.current && cur && prevCat.current !== cur) {
      scanActions.markCategoryDone(prevCat.current);
    }
    if (cur) prevCat.current = cur;
  }, [progress?.category]);

  const currentPath = progress?.currentPath ?? "";

  return (
    <div className="page scanner-page">
      <TopBar title="Scanning" subtitle="Live progress from your Mac" />
      <div className="stack center">
        <Loader2 className="spinner-icon" size={48} strokeWidth={1.5} />
        <div className="mono strong">
          {progress?.category ?? "starting…"}
        </div>
        <div className="path-ticker mono small muted">
          {currentPath || "—"}
        </div>
        <div className="row gap wide">
          <div className="stat card">
            <div className="muted tiny">Items</div>
            <div className="mono strong">{itemsFound}</div>
          </div>
          <div className="stat card">
            <div className="muted tiny">Size so far</div>
            <div className="mono strong">{formatBytes(bytesFound)}</div>
          </div>
        </div>
        <ul className="checklist">
          {slugs.map((s) => (
            <li key={s} className="checklist-row mono small">
              {completed.has(s) ? (
                <Check className="checklist-ico done" size={16} strokeWidth={2.5} />
              ) : (
                <Circle className="checklist-ico pending" size={14} strokeWidth={2} />
              )}
              {s}
            </li>
          ))}
        </ul>
        <div className="row gap">
          <Button type="button" variant="ghost" onClick={() => void cancel()}>
            Cancel scan
          </Button>
          <Button type="button" variant="ghost" onClick={goHome}>
            Back
          </Button>
        </div>
      </div>
    </div>
  );
}
