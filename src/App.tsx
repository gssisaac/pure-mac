import { useEffect, useState, type ReactNode } from "react";
import { Sidebar } from "./components/layout/Sidebar";
import { Dashboard } from "./pages/Dashboard";
import { ScannerPage } from "./pages/Scanner";
import { ResultsPage } from "./pages/Results";
import { ResultDetailPage } from "./pages/ResultDetail";
import { SettingsPage } from "./pages/Settings";
import * as api from "./lib/tauri";
import {
  settingsActions,
  useSettingsStore,
} from "./store/settingsStore";
import { scanActions, useScanStore } from "./store/scanStore";
import { Button } from "./components/ui/button";

function PermissionsGate({ children }: { children: ReactNode }) {
  const dismissed = useSettingsStore((s) => s.permissionDismissed);
  const [fda, setFda] = useState<boolean | null>(null);

  useEffect(() => {
    void api.checkFullDiskAccess().then(setFda);
  }, [dismissed]);

  if (fda === false && !dismissed) {
    return (
      <div className="perm-screen">
        <div
          className="win-drag-region win-drag-region-perm"
          data-tauri-drag-region
        />
        <div className="card perm-card">
          <h1>Full Disk Access</h1>
          <p className="muted">
            PureMac reads caches, app support folders, and metadata under your
            home directory. macOS requires Full Disk Access for some locations
            (for example deep <span className="mono">~/Library</span> paths).
          </p>
          <div className="row gap">
            <Button onClick={() => void api.openPrivacySettings()}>
              Open Privacy Settings
            </Button>
            <Button variant="outline" onClick={() => settingsActions.setPermissionDismissed(true)}>
              Continue without full access
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

export default function App() {
  const [page, setPage] = useState<
    "dashboard" | "scanner" | "results" | "settings"
  >("dashboard");

  const detailItemId = useScanStore((s) => s.detailItemId);

  useEffect(() => {
    if (page !== "results") {
      scanActions.closeResultDetail();
    }
  }, [page]);

  return (
    <PermissionsGate>
      <div className="shell">
        <Sidebar page={page} setPage={setPage} />
        <div className="main">
          <div
            className="win-drag-region win-drag-region-content"
            data-tauri-drag-region
          />
          <div className="main-body app-scroll">
            {page === "dashboard" && (
              <Dashboard
                goScanner={() => setPage("scanner")}
                goResults={() => setPage("results")}
              />
            )}
            {page === "scanner" && (
              <ScannerPage goHome={() => setPage("dashboard")} />
            )}
            {page === "results" &&
              (detailItemId ? (
                <ResultDetailPage itemId={detailItemId} />
              ) : (
                <ResultsPage />
              ))}
            {page === "settings" && <SettingsPage />}
          </div>
        </div>
      </div>
    </PermissionsGate>
  );
}
