import { useEffect, useState } from "react";
import Constants from "expo-constants";
import * as SecureStore from "expo-secure-store";

// Forced-update gate, no backend required. A static JSON manifest in this
// repo (served over raw.githubusercontent.com) names the latest and the
// minimum supported app version. When the running version is below
// minSupportedVersion the app opens only onto the update screen, on every
// launch, until a supported version is installed. The last fetched
// requirement is persisted (SecureStore), so a device that already knows an
// update is required stays gated even with no connectivity.

export type UpdateManifest = {
  latestVersion: string;
  minSupportedVersion: string;
  apkUrl: string;
  sizeBytes: number;
  changelog: { en: string[]; ar: string[] };
};

export const UPDATE_MANIFEST_URL =
  "https://raw.githubusercontent.com/ahmed-7assan1/medonex-mobile/main/update-manifest.json";

const STORE_KEY = "medonex.update.required.v1";

export function currentAppVersion(): string {
  return Constants.expoConfig?.version ?? "0.0.0";
}

/** -1 when a < b, 0 equal, 1 when a > b. Non-numeric parts compare as 0. */
export function compareVersions(a: string, b: string): number {
  const pa = a.split(".").map((x) => parseInt(x, 10) || 0);
  const pb = b.split(".").map((x) => parseInt(x, 10) || 0);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const d = (pa[i] ?? 0) - (pb[i] ?? 0);
    if (d !== 0) return d < 0 ? -1 : 1;
  }
  return 0;
}

export function isUpdateRequired(
  manifest: Pick<UpdateManifest, "minSupportedVersion">,
  version: string
): boolean {
  return compareVersions(version, manifest.minSupportedVersion) < 0;
}

async function readStoredRequirement(): Promise<UpdateManifest | null> {
  try {
    const raw = await SecureStore.getItemAsync(STORE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (typeof parsed?.minSupportedVersion === "string") return parsed;
  } catch {
    /* corrupted entry: ignore */
  }
  return null;
}

export type UpdateGateState =
  | { status: "checking" }
  | { status: "clear" }
  | { status: "required"; manifest: UpdateManifest; current: string };

export function useUpdateGate(): UpdateGateState & { recheck: () => void } {
  const [state, setState] = useState<UpdateGateState>({ status: "checking" });
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let active = true;
    (async () => {
      const current = currentAppVersion();
      // The persisted requirement gates immediately and independently of
      // connectivity: once required, every launch opens onto the update
      // screen until a supported build is installed.
      const stored = await readStoredRequirement();
      if (stored && isUpdateRequired(stored, current)) {
        if (active) setState({ status: "required", manifest: stored, current });
      }
      let fresh: UpdateManifest | null = null;
      try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 8000);
        const res = await fetch(UPDATE_MANIFEST_URL, {
          signal: controller.signal,
          headers: { "cache-control": "no-cache" },
        });
        clearTimeout(timer);
        if (res.ok) {
          const body = await res.json();
          if (typeof body?.minSupportedVersion === "string") fresh = body;
        }
      } catch {
        /* offline: the stored requirement above is the source of truth */
      }
      if (!active) return;
      if (fresh) {
        if (isUpdateRequired(fresh, current)) {
          await SecureStore.setItemAsync(STORE_KEY, JSON.stringify(fresh)).catch(() => {});
          setState({ status: "required", manifest: fresh, current });
        } else {
          await SecureStore.deleteItemAsync(STORE_KEY).catch(() => {});
          setState({ status: "clear" });
        }
      } else if (stored && isUpdateRequired(stored, current)) {
        setState({ status: "required", manifest: stored, current });
      } else {
        setState({ status: "clear" });
      }
    })();
    return () => {
      active = false;
    };
  }, [attempt]);
  return { ...state, recheck: () => setAttempt((n) => n + 1) };
}
