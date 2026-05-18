import {
  ArrowLeft,
  ArrowUp,
  ExternalLink,
  Folder,
  FolderOpen,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { TopBar } from "../components/layout/TopBar";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Checkbox } from "../components/ui/checkbox";
import { DeleteBar } from "../components/results/DeleteBar";
import { scanActions, useScanStore } from "../store/scanStore";
import { useSettingsStore } from "../store/settingsStore";
import type { SubfolderEntry } from "../lib/types";
import { formatBytes, formatRelativeDate } from "../lib/utils";
import { listSubfolders, previewInFinder } from "../lib/tauri";
import { RiskBadge } from "../components/shared/RiskBadge";

export function ResultDetailPage({ itemId }: { itemId: string }) {
  const items = useScanStore((s) => s.items);
  const selectedIds = useScanStore((s) => s.selectedIds);
  const detailFolderStack = useScanStore((s) => s.detailFolderStack);
  const dryRun = useSettingsStore((s) => s.dryRun);
  const item = useMemo(
    () => items.find((i) => i.id === itemId) ?? null,
    [items, itemId],
  );

  const listRootPath =
    detailFolderStack.length > 0
      ? detailFolderStack[detailFolderStack.length - 1]
      : item?.path ?? "";

  const [subfolders, setSubfolders] = useState<SubfolderEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (!listRootPath) {
      setSubfolders([]);
      setLoading(false);
      setLoadError(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setLoadError(null);
    void listSubfolders(listRootPath)
      .then((rows) => {
        if (!cancelled) {
          setSubfolders(rows);
          setLoadError(null);
        }
      })
      .catch((e: unknown) => {
        if (!cancelled) {
          setSubfolders([]);
          setLoadError(e instanceof Error ? e.message : String(e));
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [listRootPath]);

  if (!item) {
    return (
      <div className="page">
        <TopBar title="Item not found" />
        <Button variant="outline" onClick={() => scanActions.closeResultDetail()}>
          <ArrowLeft size={16} />
          Back to results
        </Button>
      </div>
    );
  }

  const itemChecked = selectedIds.has(item.id);
  const canGoUp = detailFolderStack.length > 1;

  return (
    <div className="page result-detail-page">
      <TopBar
        title={item.name}
        subtitle={
          <div className="topbar-subtitle-stack">
            <span className="mono small">{formatBytes(item.sizeBytes)}</span>
            <span className="topbar-subtitle-path mono muted ellipsis" title={item.path}>
              {item.path}
            </span>
          </div>
        }
      />
      {dryRun && (
        <div className="banner">DRY RUN — deletions are simulated only.</div>
      )}
      <div className="result-detail-actions">
        <Button variant="outline" onClick={() => scanActions.closeResultDetail()}>
          <ArrowLeft size={16} />
          Back to results
        </Button>
        <Button variant="secondary" onClick={() => void previewInFinder(item.path)}>
          <ExternalLink size={16} />
          Reveal in Finder
        </Button>
      </div>

      <div className="result-detail-grid">
        <Card className="result-detail-list-card">
          <div className="row spread tight" style={{ marginBottom: 8 }}>
            <h3 className="detail-aside-title" style={{ marginBottom: 0 }}>
              <FolderOpen size={18} />
              Subfolders
            </h3>
            {canGoUp && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => scanActions.navigateDetailFolderUp()}
              >
                <ArrowUp size={14} />
                Up
              </Button>
            )}
          </div>
          <p className="muted small detail-subfolder-context" title={listRootPath}>
            Inside <span className="mono">{listRootPath}</span>
          </p>
          <p className="muted small" style={{ marginTop: 0 }}>
            Direct child folders only, largest first. Click a row to open it;
            use the icon to reveal in Finder.
          </p>
          <ul className="detail-size-list app-scroll">
            {loading && (
              <li className="muted small detail-subfolder-status">Loading…</li>
            )}
            {loadError && (
              <li className="detail-subfolder-error">{loadError}</li>
            )}
            {!loading && !loadError && subfolders.length === 0 && (
              <li className="muted small detail-subfolder-status">
                {listRootPath === item.path
                  ? "No subfolders here (file or empty directory)."
                  : "No subfolders in this folder."}
              </li>
            )}
            {!loading &&
              !loadError &&
              subfolders.map((row) => (
                <li key={row.path} className="detail-size-row-wrap">
                  <button
                    type="button"
                    className="detail-size-row"
                    onClick={() => scanActions.navigateDetailSubfolder(row.path)}
                  >
                    <span className="ellipsis mono small">{row.name}</span>
                    <span className="mono small muted">{formatBytes(row.sizeBytes)}</span>
                  </button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="detail-subfolder-finder"
                    title="Reveal in Finder"
                    onClick={(e) => {
                      e.stopPropagation();
                      void previewInFinder(row.path);
                    }}
                  >
                    <ExternalLink size={18} />
                  </Button>
                </li>
              ))}
          </ul>
        </Card>

        <Card className="result-detail-main">
          <div className="row gap tight" style={{ marginBottom: 12 }}>
            <div
              className="check detail-main-check"
              onClick={(e) => e.stopPropagation()}
              onKeyDown={(e) => e.stopPropagation()}
            >
              <Checkbox
                checked={itemChecked}
                onCheckedChange={() => scanActions.toggleSelect(item.id)}
              />
            </div>
            <Folder className="muted" size={22} />
            <RiskBadge level={item.riskLevel} />
          </div>
          <dl className="detail-dl">
            <dt>Path</dt>
            <dd className="mono small">{item.path}</dd>
            <dt>Size</dt>
            <dd className="mono">{formatBytes(item.sizeBytes)}</dd>
            <dt>Category</dt>
            <dd>{item.category}</dd>
            <dt>Last modified</dt>
            <dd>
              {item.lastModified != null
                ? formatRelativeDate(item.lastModified)
                : "—"}
            </dd>
            <dt>Last accessed</dt>
            <dd>
              {item.lastAccessed != null
                ? formatRelativeDate(item.lastAccessed)
                : "—"}
            </dd>
            {item.relatedApp && (
              <>
                <dt>Related app</dt>
                <dd className="mono small">{item.relatedApp}</dd>
              </>
            )}
            <dt>Description</dt>
            <dd>{item.description}</dd>
          </dl>
        </Card>
      </div>
      <DeleteBar />
    </div>
  );
}
