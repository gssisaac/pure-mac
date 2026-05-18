import { ExternalLink, Folder } from "lucide-react";
import type { ScanItem } from "../../lib/types";
import { formatRelativeDate } from "../../lib/utils";
import { previewInFinder } from "../../lib/tauri";
import { RiskBadge } from "../shared/RiskBadge";
import { SizeLabel } from "../shared/SizeLabel";
import { scanActions, useScanStore } from "../../store/scanStore";
import { Checkbox } from "../ui/checkbox";
import { Button } from "../ui/button";

export function ResultItem({ item }: { item: ScanItem }) {
  const checked = useScanStore((s) => s.selectedIds.has(item.id));

  return (
    <tr
      className="result-row"
      role="button"
      tabIndex={0}
      onClick={() => scanActions.openResultDetail(item.id)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          scanActions.openResultDetail(item.id);
        }
      }}
    >
      <td
        className="result-td-check"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
      >
        <div className="check result-table-check">
          <Checkbox
            checked={checked}
            onCheckedChange={() => scanActions.toggleSelect(item.id)}
          />
        </div>
      </td>
      <td className="result-td-name">
        <div className="result-name-cell">
          <Folder className="result-folder-icon muted" size={20} />
          <div className="result-name-stack">
            <div className="name">{item.name}</div>
            <div className="path mono small muted ellipsis">{item.path}</div>
            <div className="result-meta-row row spread small muted">
              <span className="ellipsis">{item.description}</span>
              <span className="result-td-date">
                {item.lastModified != null
                  ? formatRelativeDate(item.lastModified)
                  : "—"}
              </span>
            </div>
          </div>
        </div>
      </td>
      <td className="result-td-size">
        <SizeLabel bytes={item.sizeBytes} />
      </td>
      <td className="result-td-risk">
        <RiskBadge level={item.riskLevel} />
      </td>
      <td
        className="result-td-action"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
      >
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="result-finder-btn"
          title="Reveal in Finder"
          onClick={(e) => {
            e.stopPropagation();
            void previewInFinder(item.path);
          }}
        >
          <ExternalLink size={18} />
        </Button>
      </td>
    </tr>
  );
}
