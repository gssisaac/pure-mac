import { useState, useEffect } from "react";
import type { DeleteMode } from "../../store/settingsStore";
import type { ScanItem } from "../../lib/types";
import { formatBytes } from "../../lib/utils";
import { RiskBadge } from "./RiskBadge";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Select } from "../ui/select";

type Props = {
  open: boolean;
  onClose: () => void;
  items: ScanItem[];
  onConfirm: (mode: DeleteMode) => void;
  defaultMode: DeleteMode;
};

export function ConfirmModal({
  open,
  onClose,
  items,
  onConfirm,
  defaultMode,
}: Props) {
  const [mode, setMode] = useState<DeleteMode>(defaultMode);
  const [typed, setTyped] = useState("");

  useEffect(() => {
    if (open) {
      setMode(defaultMode);
      setTyped("");
    }
  }, [open, defaultMode]);

  if (!open) return null;

  const total = items.reduce((a, x) => a + x.sizeBytes, 0);
  const preview = items.slice(0, 5);
  const rest = items.length - preview.length;
  const permanentOk = typed === "DELETE";

  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>Confirm deletion</h2>
        <p className="muted small">
          {items.length} item{items.length === 1 ? "" : "s"} · {formatBytes(total)}{" "}
          estimated
        </p>
        <ul className="confirm-list">
          {preview.map((it) => (
            <li key={it.id}>
              <span className="mono">{it.name}</span>
              <RiskBadge level={it.riskLevel} />
            </li>
          ))}
        </ul>
        {rest > 0 && <p className="muted small">+ {rest} more</p>}

        <div className="field">
          <Label>Mode</Label>
          <Select value={mode} onChange={(e) => setMode(e.target.value as DeleteMode)}>
            <option value="trash">Move to Trash (recommended)</option>
            <option value="permanent">Delete permanently</option>
          </Select>
        </div>

        {mode === "permanent" && (
          <div className="field">
            <Label>
              Type <strong>DELETE</strong> to confirm permanent removal
            </Label>
            <Input
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              placeholder="DELETE"
              autoComplete="off"
            />
          </div>
        )}

        <div className="row end gap">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="button"
            variant={mode === "permanent" ? "destructive" : "default"}
            disabled={mode === "permanent" && !permanentOk}
            onClick={() => onConfirm(mode)}
          >
            {mode === "trash" ? "Move to Trash" : "Delete permanently"}
          </Button>
        </div>
      </div>
    </div>
  );
}
