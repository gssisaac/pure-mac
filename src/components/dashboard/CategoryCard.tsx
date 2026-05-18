import type { Category, ScanSummary } from "../../lib/types";
import type { LucideIcon } from "lucide-react";
import {
  AppWindow,
  Archive,
  Code2,
  Database,
  FileStack,
  FolderOpen,
  Globe,
  LayoutGrid,
  Package,
} from "lucide-react";
import { formatBytes } from "../../lib/utils";
import { settingsActions, useSettingsStore } from "../../store/settingsStore";
import { Card } from "../ui/card";
import { Switch } from "../ui/switch";

const META: Record<
  Category,
  { label: string; hint: string; icon: LucideIcon }
> = {
  Dotfiles: { label: "Dotfiles", hint: "Stale app configs", icon: FolderOpen },
  NodeModules: { label: "node_modules", hint: "Old JS deps", icon: Package },
  DormantApps: { label: "Dormant apps", hint: "Unused apps", icon: AppWindow },
  AppSupport: {
    label: "App support orphans",
    hint: "Leftover data",
    icon: LayoutGrid,
  },
  DeveloperTools: { label: "Developer", hint: "Caches & SDKs", icon: Code2 },
  SystemCache: { label: "System caches", hint: "Safe-ish junk", icon: Database },
  Browser: { label: "Browser caches", hint: "Rebuild on launch", icon: Globe },
  Backups: { label: "Backups", hint: "iOS backups", icon: Archive },
  LargeFiles: { label: "Large files", hint: "Home scan", icon: FileStack },
};

function bytesForCategory(summary: ScanSummary | null, cat: Category): number | null {
  if (!summary) return null;
  const hit = summary.categories.find((c) => c.category === cat);
  return hit?.totalBytes ?? null;
}

export function CategoryCard({ cat, summary }: { cat: Category; summary: ScanSummary | null }) {
  const enabled = useSettingsStore((s) => s.enabledCategories.includes(cat));
  const meta = META[cat];
  const bytes = bytesForCategory(summary, cat);
  const Icon = meta.icon;

  return (
    <Card className="category-card">
      <div className="row spread">
        <div className="row gap tight">
          <span className="cat-lucide-wrap">
            <Icon size={22} strokeWidth={1.75} className="cat-lucide" />
          </span>
          <div>
            <div className="strong">{meta.label}</div>
            <div className="muted small">{meta.hint}</div>
          </div>
        </div>
        <Switch
          checked={enabled}
          onCheckedChange={(value) => settingsActions.toggleCategory(cat, value)}
        />
      </div>
      <div className="cat-size mono">{bytes == null ? "—" : formatBytes(bytes)}</div>
    </Card>
  );
}

export function allDashboardCategories(): Category[] {
  return Object.keys(META) as Category[];
}
