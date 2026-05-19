import { Loader2 } from "lucide-react";
import { useMemo, useState } from "react";
import { formatBytes } from "../../lib/utils";
import { scanActions, useScanStore } from "../../store/scanStore";
import { useSettingsStore } from "../../store/settingsStore";
import type { DeleteMode } from "../../store/settingsStore";
import type { DeleteConfirmRow } from "../../lib/types";
import { useDelete } from "../../hooks/useDelete";
import { ConfirmModal } from "../shared/ConfirmModal";
import { Button } from "../ui/button";

export function DeleteBar() {
  const items = useScanStore((s) => s.items);
  const selectedIds = useScanStore((s) => s.selectedIds);
  const detailSubfolderSelection = useScanStore((s) => s.detailSubfolderSelection);
  const dryRun = useSettingsStore((s) => s.dryRun);
  const defaultMode = useSettingsStore((s) => s.defaultDeleteMode);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const { toTrash, permanent, pending } = useDelete();

  const selected = useMemo(
    () => items.filter((i) => selectedIds.has(i.id)),
    [items, selectedIds],
  );

  const subfolderRows = useMemo(
    () =>
      [...detailSubfolderSelection.entries()].map(([path, m]) => ({
        key: path,
        name: m.name,
        sizeBytes: m.sizeBytes,
      })),
    [detailSubfolderSelection],
  );

  const confirmRows: DeleteConfirmRow[] = useMemo(
    () => [
      ...selected.map((i) => ({
        key: i.id,
        name: i.name,
        sizeBytes: i.sizeBytes,
        riskLevel: i.riskLevel,
      })),
      ...subfolderRows.map((r) => ({
        key: r.key,
        name: r.name,
        sizeBytes: r.sizeBytes,
      })),
    ],
    [selected, subfolderRows],
  );

  const bytes = useMemo(
    () => confirmRows.reduce((a, r) => a + r.sizeBytes, 0),
    [confirmRows],
  );

  const count = confirmRows.length;

  if (count === 0) return null;

  const run = async (mode: DeleteMode) => {
    const pathSet = new Set<string>();
    for (const it of selected) pathSet.add(it.path);
    for (const row of subfolderRows) pathSet.add(row.key);
    const paths = [...pathSet];
    if (mode === "trash") {
      await toTrash(paths, dryRun);
    } else {
      await permanent(paths, dryRun);
    }
    scanActions.finishDeletingPaths(pathSet, new Set(selected.map((s) => s.id)));
  };

  return (
    <>
      <div className="delete-bar row spread">
        <div className="row gap tight">
          <span className="mono">
            {count} selected · {formatBytes(bytes)}
          </span>
          {dryRun && <span className="pill warn">DRY RUN</span>}
        </div>
        <div className="row gap tight">
          {pending && (
            <span className="row gap tight delete-bar-progress muted small">
              <Loader2 className="spinner-icon" size={18} aria-hidden />
              <span>Deleting…</span>
            </span>
          )}
          <Button
            type="button"
            variant="ghost"
            disabled={pending}
            onClick={() => scanActions.clearSelection()}
          >
            Deselect all
          </Button>
          <Button type="button" disabled={pending} onClick={() => setConfirmOpen(true)}>
            Delete…
          </Button>
        </div>
      </div>
      <ConfirmModal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        rows={confirmRows}
        defaultMode={defaultMode}
        onConfirm={(mode) => run(mode)}
      />
    </>
  );
}
