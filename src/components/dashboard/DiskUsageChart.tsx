import type { DiskInfo, ScanSummary } from "../../lib/types";
import { formatBytes } from "../../lib/utils";

type Props = {
  disk: DiskInfo | null;
  summary: ScanSummary | null;
};

/** Shared layout math for dashboard hero and slim results strip. */
export function getDiskOverviewSegments(
  disk: DiskInfo,
  summary: ScanSummary | null,
) {
  const reclaim = summary?.totalBytes ?? 0;
  const used = disk.usedBytes;
  const avail = disk.availableBytes;
  const total = disk.totalBytes || used + avail;
  const reclaimFrac = total > 0 ? Math.min(1, reclaim / total) : 0;
  const usedFrac = total > 0 ? Math.min(1, used / total) : 0;
  const availFrac = Math.max(0, 1 - usedFrac - reclaimFrac);
  const freeBytes = avail;
  const reclaimShow = Math.min(reclaim, Math.max(0, total - used));
  return {
    used,
    reclaimShow,
    freeBytes,
    usedFrac,
    reclaimFrac,
    availFrac,
    total,
  };
}

export function DiskUsageChart({ disk, summary }: Props) {
  if (!disk) {
    return (
      <div className="disk-hero disk-hero-loading">
        <p className="muted small" style={{ margin: 0 }}>
          Loading disk…
        </p>
      </div>
    );
  }

  const {
    used,
    reclaimShow,
    freeBytes,
    usedFrac,
    reclaimFrac,
    availFrac,
    total,
  } = getDiskOverviewSegments(disk, summary);

  return (
    <section className="disk-hero">
      <div className="disk-hero-glow" aria-hidden />
      <div className="disk-hero-top">
        <div className="disk-hero-stats">
          <h2 className="disk-hero-label">Disk overview</h2>
          <div className="disk-hero-capacity">
            <span className="disk-hero-total">
              {formatBytes(total)}{" "}
              <span className="disk-hero-total-unit">total</span>
            </span>
            <span className="disk-hero-slash">/</span>
            <span className="disk-hero-used-line">{formatBytes(used)} used</span>
          </div>
          <p className="disk-hero-avail">
            Available space:{" "}
            <span className="disk-hero-avail-val">{formatBytes(freeBytes)}</span>
          </p>
        </div>
        <div className="disk-hero-freeable">
          <span className="disk-hero-freeable-label">Potentially freeable</span>
          <span className="disk-hero-freeable-val">{formatBytes(reclaimShow)}</span>
        </div>
      </div>
      <div className="disk-bar-wrap">
        <div className="disk-bar-inner disk-bar-inner-hero">
          <div className="bar used" style={{ width: `${usedFrac * 100}%` }} />
          <div
            className="bar reclaim"
            style={{ width: `${reclaimFrac * 100}%` }}
          />
          <div className="bar free" style={{ width: `${availFrac * 100}%` }} />
        </div>
        <div className="legend legend-hero row gap wrap">
          <span className="legend-item">
            <i className="swatch used" /> Used{" "}
            <span className="legend-size muted">({formatBytes(used)})</span>
          </span>
          <span className="legend-item">
            <i className="swatch reclaim" /> Potentially freeable{" "}
            <span className="legend-size muted">({formatBytes(reclaimShow)})</span>
          </span>
          <span className="legend-item">
            <i className="swatch free" /> Available{" "}
            <span className="legend-size muted">({formatBytes(freeBytes)})</span>
          </span>
        </div>
      </div>
    </section>
  );
}

/** Compact strip for Results: used vs reclaimable vs available + thin bar. */
export function DiskOverviewSlim({ disk, summary }: Props) {
  if (!disk) {
    return (
      <div className="disk-slim disk-slim-loading">
        <p className="muted small" style={{ margin: 0 }}>
          Loading disk…
        </p>
      </div>
    );
  }

  const {
    used,
    reclaimShow,
    freeBytes,
    usedFrac,
    reclaimFrac,
    availFrac,
  } = getDiskOverviewSegments(disk, summary);

  return (
    <section className="disk-slim" aria-label="Disk space overview">
      <div className="disk-slim-metrics">
        <div className="disk-slim-metric">
          <span className="disk-slim-label">Used</span>
          <span className="disk-slim-val">{formatBytes(used)}</span>
        </div>
        <div className="disk-slim-metric disk-slim-metric-reclaim">
          <span className="disk-slim-label">Potentially freeable</span>
          <span className="disk-slim-val">{formatBytes(reclaimShow)}</span>
        </div>
        <div className="disk-slim-metric">
          <span className="disk-slim-label">Available</span>
          <span className="disk-slim-val disk-slim-val-avail">
            {formatBytes(freeBytes)}
          </span>
        </div>
      </div>
      <div className="disk-slim-bar-wrap">
        <div className="disk-bar-inner disk-slim-bar-inner">
          <div className="bar used" style={{ width: `${usedFrac * 100}%` }} />
          <div
            className="bar reclaim"
            style={{ width: `${reclaimFrac * 100}%` }}
          />
          <div className="bar free" style={{ width: `${availFrac * 100}%` }} />
        </div>
      </div>
    </section>
  );
}
