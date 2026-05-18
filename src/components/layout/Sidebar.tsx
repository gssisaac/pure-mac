import {
  LayoutDashboard,
  ListOrdered,
  Search,
  Settings,
} from "lucide-react";
import brandIcon from "../../../src-tauri/icons/icon.png";
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
      <div className="sidebar-inner">
        <div className="brand">
          <div className="brand-mark" aria-hidden>
            <img
              src={brandIcon}
              alt=""
              className="brand-icon-img"
              width={32}
              height={32}
              draggable={false}
            />
          </div>
          <span className="brand-name">PureMac</span>
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
      </div>
      <div className="sidebar-footer">
        <div className="sidebar-version" title="PureMac release">
          <span>v0.1.0</span>
          <span className="sidebar-status-dot" aria-hidden />
        </div>
        <button
          type="button"
          className="link-btn sidebar-perm-link"
          onClick={() => settingsActions.setPermissionDismissed(false)}
        >
          Permissions…
        </button>
      </div>
    </aside>
  );
}
