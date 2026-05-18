import {
  Hexagon,
  LayoutDashboard,
  ListOrdered,
  Search,
  Settings,
} from "lucide-react";
import { useScanStore } from "../../store/scanStore";
import { settingsActions } from "../../store/settingsStore";
import { cn } from "../../lib/utils";

const NAV: {
  id: "dashboard" | "scanner" | "results" | "settings";
  label: string;
  icon: typeof LayoutDashboard;
}[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "scanner", label: "Scanner", icon: Search },
  { id: "results", label: "Results", icon: ListOrdered },
  { id: "settings", label: "Settings", icon: Settings },
];

export function Sidebar({
  page,
  setPage,
}: {
  page: string;
  setPage: (p: "dashboard" | "scanner" | "results" | "settings") => void;
}) {
  const status = useScanStore((s) => s.status);

  return (
    <aside className="sidebar">
      <div className="brand">
        <Hexagon className="brand-icon" size={22} strokeWidth={1.75} />
        <span>PureMac</span>
      </div>
      <nav className="nav">
        {NAV.map((n) => {
          const Icon = n.icon;
          return (
            <button
              key={n.id}
              type="button"
              className={cn("nav-item", page === n.id && "active")}
              onClick={() => {
                if (n.id === "scanner" && status !== "scanning") {
                  setPage("dashboard");
                  return;
                }
                setPage(n.id);
              }}
              disabled={n.id === "scanner" && status !== "scanning"}
            >
              <Icon size={18} strokeWidth={1.75} className="nav-ico" />
              {n.label}
            </button>
          );
        })}
      </nav>
      <div className="sidebar-footer">
        <button
          type="button"
          className="link-btn"
          onClick={() => settingsActions.setPermissionDismissed(false)}
        >
          Permissions…
        </button>
      </div>
    </aside>
  );
}
