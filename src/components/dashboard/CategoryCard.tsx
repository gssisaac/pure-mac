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
  { label: string; hint: string; icon: LucideIcon; accent: string }
> = {
  Dotfiles: {
    label: "Dotfiles",
    hint: "Stale app configs & hidden paths",
    icon: FolderOpen,
    accent: "cyan",
  },
  NodeModules: {
    label: "node_modules",
    hint: "Old JS ecosystem dependencies",
    icon: Package,
    accent: "emerald",
  },
  DormantApps: {
    label: "Dormant Apps",
    hint: "Unused binary files & binaries",
    icon: AppWindow,
    accent: "indigo",
  },
  AppSupport: {
    label: "App Support Orphans",
    hint: "Leftover fragments & trash data",
    icon: LayoutGrid,
    accent: "purple",
  },
  DeveloperTools: {
    label: "Developer",
    hint: "Build logs, artifacts & SDKs",
    icon: Code2,
    accent: "amber",
  },
  SystemCache: {
    label: "System Caches",
    hint: "Safe-to-flush OS cache bundles",
    icon: Database,
    accent: "rose",
  },
  Browser: {
    label: "Browser Caches",
    hint: "Rebuilds dynamically on launch",
    icon: Globe,
    accent: "teal",
  },
  Backups: {
    label: "Backups",
    hint: "Local iOS & iPad disk mirror logs",
    icon: Archive,
    accent: "pink",
  },
  LargeFiles: {
    label: "Large Files",
    hint: "Notable files in home",
    icon: FileStack,
    accent: "orange",
  },
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
    <Card className="category-card dash-cat-card">
      <div className="dash-cat-head">
        <div className={`cat-lucide-wrap dash-cat-icon-wrap dash-cat-icon-${meta.accent}`}>
          <Icon size={18} strokeWidth={1.75} className="cat-lucide" />
        </div>
        <Switch
          checked={enabled}
          onCheckedChange={(value) => settingsActions.toggleCategory(cat, value)}
        />
      </div>
      <div className="dash-cat-body">
        <h3 className="dash-cat-title">{meta.label}</h3>
        <p className="dash-cat-hint">{meta.hint}</p>
        <div className="cat-size dash-cat-size mono">{bytes == null ? "—" : formatBytes(bytes)}</div>
      </div>
    </Card>
  );
}

export function allDashboardCategories(): Category[] {
  return Object.keys(META) as Category[];
}
