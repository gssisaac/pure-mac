import { TopBar } from "../components/layout/TopBar";
import {
  settingsActions,
  useSettingsStore,
} from "../store/settingsStore";
import type { Category } from "../lib/types";
import * as api from "../lib/tauri";
import { useEffect, useState } from "react";
import { Card } from "../components/ui/card";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { Select } from "../components/ui/select";
import { Button } from "../components/ui/button";
import { Switch } from "../components/ui/switch";

const ALL_CATS: Category[] = [
  "Dotfiles",
  "NodeModules",
  "DormantApps",
  "AppSupport",
  "DeveloperTools",
  "SystemCache",
  "Browser",
  "Backups",
  "LargeFiles",
];

export function SettingsPage() {
  const s = useSettingsStore((x) => x);
  const [fda, setFda] = useState<boolean | null>(null);

  useEffect(() => {
    void api.checkFullDiskAccess().then(setFda).catch(() => setFda(null));
  }, []);

  const nmMonths = Math.round(s.nodeModulesThresholdDays / 30);
  const appMonths = Math.round(s.appUnusedThresholdDays / 30);

  return (
    <div className="page settings-page">
      <TopBar title="Settings" subtitle="Tune scans and defaults." />
      <div className="stack settings-grid">
        <Card>
          <h3>Scan targets</h3>
          <div className="grid toggles">
            {ALL_CATS.map((c) => (
              <label key={c} className="row spread ui-list-row">
                <span className="mono small">{c}</span>
                <Switch
                  checked={s.enabledCategories.includes(c)}
                  onCheckedChange={(value) => settingsActions.toggleCategory(c, value)}
                />
              </label>
            ))}
          </div>
        </Card>

        <Card>
          <h3>Paths</h3>
          <Label>Search paths (one per line)</Label>
          <Textarea
            rows={4}
            value={s.searchPaths.join("\n")}
            onChange={(e) =>
              settingsActions.setSearchPaths(
                e.target.value.split("\n").map((l) => l.trim()).filter(Boolean),
              )
            }
          />
          <Label>Exclude paths (one per line)</Label>
          <Textarea
            rows={3}
            value={s.excludePaths.join("\n")}
            onChange={(e) =>
              settingsActions.setExcludePaths(
                e.target.value.split("\n").map((l) => l.trim()).filter(Boolean),
              )
            }
          />
        </Card>

        <Card>
          <h3>Thresholds</h3>
          <Label>
            Node modules age: {nmMonths} months (min ~6, max ~36)
          </Label>
          <input
            className="ui-range"
            type="range"
            min={180}
            max={1095}
            value={s.nodeModulesThresholdDays}
            onChange={(e) =>
              settingsActions.setNodeModulesThresholdDays(Number(e.target.value))
            }
          />
          <Label>
            Unused app threshold: {appMonths} months (min ~3, max ~24)
          </Label>
          <input
            className="ui-range"
            type="range"
            min={90}
            max={730}
            value={s.appUnusedThresholdDays}
            onChange={(e) =>
              settingsActions.setAppUnusedThresholdDays(Number(e.target.value))
            }
          />
          <Label>
            Large file threshold: {s.largeFileThresholdMB} MB (100–2048)
          </Label>
          <input
            className="ui-range"
            type="range"
            min={100}
            max={2048}
            value={s.largeFileThresholdMB}
            onChange={(e) =>
              settingsActions.setLargeFileThresholdMB(Number(e.target.value))
            }
          />
        </Card>

        <Card>
          <h3>Delete behavior</h3>
          <Label>Default delete mode</Label>
          <Select
            value={s.defaultDeleteMode}
            onChange={(e) =>
              settingsActions.setDefaultDeleteMode(
                e.target.value as "trash" | "permanent",
              )
            }
          >
            <option value="trash">Move to Trash</option>
            <option value="permanent">Delete Permanently</option>
          </Select>
          <label className="row spread ui-list-row">
            <span>Dry-run mode</span>
            <Switch
              checked={s.dryRun}
              onCheckedChange={(value) => settingsActions.setDryRun(value)}
            />
          </label>
        </Card>

        <Card>
          <h3>Permissions</h3>
          <p className="muted small">
            Full Disk Access lets PureMac read Safari data, Messages, and deep
            Library folders.
          </p>
          <div className="row gap">
            <span className="mono">
              FDA:{" "}
              {fda === null
                ? "checking…"
                : fda
                  ? "granted (best-effort probe)"
                  : "limited / denied"}
            </span>
            <Button variant="outline" onClick={() => void api.openPrivacySettings()}>
              Open privacy settings
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
