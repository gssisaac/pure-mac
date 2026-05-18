import type { RiskLevel } from "../../lib/types";

const copy: Record<RiskLevel, { label: string; className: string }> = {
  Safe: { label: "Safe to Remove", className: "risk safe" },
  Caution: { label: "Review First", className: "risk caution" },
  Recommended: { label: "Recommended", className: "risk recommended" },
};

export function RiskBadge({ level }: { level: RiskLevel }) {
  const c = copy[level];
  return <span className={c.className}>{c.label}</span>;
}
