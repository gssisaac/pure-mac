import { listen } from "@tauri-apps/api/event";
import { useCallback, useEffect, useRef } from "react";
import type { ScanConfig, ScanItem, ScanProgress, ScanSummary } from "../lib/types";
import * as api from "../lib/tauri";
import { scanActions, useScanStore } from "../store/scanStore";

export function useScanLive() {
  const status = useScanStore((s) => s.status);
  const unlistenRef = useRef<(() => void)[]>([]);

  useEffect(() => {
    return () => {
      unlistenRef.current.forEach((u) => u());
      unlistenRef.current = [];
    };
  }, []);

  const start = useCallback(async (config: ScanConfig) => {
    scanActions.reset();
    scanActions.clearProgressArtifacts();
    scanActions.setStatus("scanning");
    unlistenRef.current.forEach((u) => u());
    unlistenRef.current = [];

    const u1 = await listen<ScanItem>("scan_item_found", (e) => {
      scanActions.addItem(e.payload);
    });
    const u2 = await listen<ScanProgress>("scan_progress", (e) => {
      scanActions.setProgress(e.payload);
    });
    unlistenRef.current = [u1, u2];

    try {
      const summary: ScanSummary = await api.startScan(config);
      scanActions.setSummary(summary);
      scanActions.setStatus("complete");
      return summary;
    } catch (err) {
      scanActions.setStatus("idle");
      throw err;
    } finally {
      unlistenRef.current.forEach((u) => u());
      unlistenRef.current = [];
      scanActions.setProgress(null);
    }
  }, []);

  const cancel = useCallback(async () => {
    await api.cancelScan();
  }, []);

  return { start, cancel, status };
}
