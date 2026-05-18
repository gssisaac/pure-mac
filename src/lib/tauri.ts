import { invoke } from "@tauri-apps/api/core";
import type {
  Category,
  DeleteResult,
  DiskInfo,
  ScanConfig,
  ScanItem,
  ScanSummary,
  SubfolderEntry,
} from "./types";

export async function getDiskInfo(): Promise<DiskInfo> {
  return invoke("get_disk_info");
}

export async function startScan(config: ScanConfig): Promise<ScanSummary> {
  return invoke("start_scan", { config });
}

export async function cancelScan(): Promise<void> {
  return invoke("cancel_scan");
}

export async function getScanResults(
  category: Category | null,
): Promise<ScanItem[]> {
  return invoke("get_scan_results", { category });
}

export async function moveToTrash(
  paths: string[],
  dryRun: boolean,
): Promise<DeleteResult> {
  return invoke("move_to_trash", { paths, dryRun });
}

export async function deletePermanently(
  paths: string[],
  dryRun: boolean,
): Promise<DeleteResult> {
  return invoke("delete_permanently", { paths, dryRun });
}

export async function previewInFinder(path: string): Promise<void> {
  return invoke("preview_in_finder", { path });
}

export async function getItemSize(path: string): Promise<number> {
  return invoke("get_item_size", { path });
}

export async function listSubfolders(path: string): Promise<SubfolderEntry[]> {
  return invoke("list_subfolders", { path });
}

export async function getInstalledApps(): Promise<string[]> {
  return invoke("get_installed_apps");
}

export async function checkFullDiskAccess(): Promise<boolean> {
  return invoke("check_full_disk_access");
}

export async function openPrivacySettings(): Promise<void> {
  return invoke("open_privacy_settings");
}
