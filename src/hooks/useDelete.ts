import { useCallback, useState } from "react";
import * as api from "../lib/tauri";

export function useDelete() {
  const [pending, setPending] = useState(false);

  const toTrash = useCallback(async (paths: string[], dryRun: boolean) => {
    setPending(true);
    try {
      return await api.moveToTrash(paths, dryRun);
    } finally {
      setPending(false);
    }
  }, []);

  const permanent = useCallback(async (paths: string[], dryRun: boolean) => {
    setPending(true);
    try {
      return await api.deletePermanently(paths, dryRun);
    } finally {
      setPending(false);
    }
  }, []);

  return { toTrash, permanent, pending };
}
