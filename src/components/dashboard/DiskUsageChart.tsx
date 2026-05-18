import type { DiskInfo, ScanSummary } from "../../lib/types";
import { formatBytes } from "../../lib/utils";

type Props = {
  disk: DiskInfo | null;
  summary: ScanSummary | null;
};

export function DiskUsageChart({ disk, summary }: Props) {
  if (!disk) {
    return <div className="card chart-card">Loading disk…</div>;
  }

  const reclaim = summary?.totalBytes ?? 0;
  const used = disk.usedBytes;
  const avail = disk.availableBytes;
  const total = disk.totalBytes || used + avail;
  const reclaimFrac = total > 0 ? Math.min(1, reclaim / total) : 0;
  const usedFrac = total > 0 ? Math.min(1, used / total) : 0;
  const availFrac = Math.max(0, 1 - usedFrac - reclaimFrac);

  const freeBytes = avail;
  const reclaimShow = Math.min(reclaim, Math.max(0, total - used));

  return (
    <div className="card chart-card">
      <div className="row spread">
        <div>
          <h3>Disk overview</h3>
          <p className="muted small">
            Used {formatBytes(used)} · Free {formatBytes(freeBytes)}
            {reclaim > 0 && ` · Last scan: ${formatBytes(reclaimShow)} flagged`}
          </p>
        </div>
      </div>
      <div className="donut-simple row gap spread">
        <div>
          <div className="muted tiny">Composition</div>
          <div className="mono strong">
            {formatBytes(used)} / {formatBytes(total)}
          </div>
        </div>
        <div className="text-right">
          <div className="muted tiny">Potentially freeable</div>
          <div className="mono accent">{formatBytes(reclaimShow)}</div>
        </div>
      </div>
      <div className="disk-bar">
        <div className="disk-bar-inner">
          <div className="bar used" style={{ width: `${usedFrac * 100}%` }} />
          <div
            className="bar reclaim"
            style={{ width: `${reclaimFrac * 100}%` }}
          />
          <div className="bar free" style={{ width: `${availFrac * 100}%` }} />
        </div>
      </div>
      <div className="legend row gap wrap">
        <span>
          <i className="swatch used" /> Used
        </span>
        <span>
          <i className="swatch reclaim" /> Potentially freeable
        </span>
        <span>
          <i className="swatch free" /> Available
        </span>
      </div>
    </div>
  );
}
