import { useState } from "react";
import { formatBytes } from "../../lib/utils";
import { scanActions, useScanStore } from "../../store/scanStore";
import { useSettingsStore } from "../../store/settingsStore";
import type { DeleteMode } from "../../store/settingsStore";
import { useDelete } from "../../hooks/useDelete";
import { ConfirmModal } from "../shared/ConfirmModal";
import { Button } from "../ui/button";

export function DeleteBar() {
  const items = useScanStore((s) => s.items);
  const selectedIds = useScanStore((s) => s.selectedIds);
  const dryRun = useSettingsStore((s) => s.dryRun);
  const defaultMode = useSettingsStore((s) => s.defaultDeleteMode);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const { toTrash, permanent, pending } = useDelete();

  const selected = items.filter((i) => selectedIds.has(i.id));
  const bytes = selected.reduce((a, i) => a + i.sizeBytes, 0);
  const paths = selected.map((i) => i.path);

  if (selected.length === 0) return null;

  const run = async (mode: DeleteMode) => {
    setConfirmOpen(false);
    if (mode === "trash") {
      await toTrash(paths, dryRun);
    } else {
      await permanent(paths, dryRun);
    }
    const idset = new Set(selected.map((s) => s.id));
    scanActions.removeItems(idset);
  };

  return (
    <>
      <div className="delete-bar row spread">
        <div className="row gap tight">
          <span className="mono">
            {selected.length} selected · {formatBytes(bytes)}
          </span>
          {dryRun && <span className="pill warn">DRY RUN</span>}
        </div>
        <div className="row gap">
          <Button type="button" variant="ghost" onClick={() => scanActions.clearSelection()}>
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
        items={selected}
        defaultMode={defaultMode}
        onConfirm={(mode) => void run(mode)}
      />
    </>
  );
}
