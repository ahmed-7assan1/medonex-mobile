import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { api, apiV1 } from "@/lib/api";
import { isFixtureMode } from "@/lib/fixtures";
import { useLiveEnabled } from "@/lib/query-mode";
import { useAuth } from "@/lib/auth";

// Warm the primary tab queries right after sign-in/bootstrap so the first
// tap on Home / Modules renders from cache instead of waiting on the
// network. prefetchQuery is a no-op when the entry is already fresh, so
// this never double-fetches and stays well under one request per tab.
const PREFETCH_STALE_TIME = 5 * 60 * 1000;

export function usePrefetchPrimaryTabs() {
  const client = useQueryClient();
  const { bootstrapped, token } = useAuth();
  const live = useLiveEnabled();
  useEffect(() => {
    if (!bootstrapped || !token || !live || isFixtureMode()) return;
    void client.prefetchQuery({
      queryKey: ["home"],
      queryFn: () => api.get("/home"),
      staleTime: PREFETCH_STALE_TIME,
    });
    void client.prefetchQuery({
      queryKey: ["modules-catalog"],
      queryFn: () => apiV1.get("/modules/catalog"),
      staleTime: PREFETCH_STALE_TIME,
    });
    void client.prefetchQuery({
      queryKey: ["forums"],
      queryFn: () => apiV1.get("/forums"),
      staleTime: PREFETCH_STALE_TIME,
    });
  }, [bootstrapped, token, live, client]);
}
