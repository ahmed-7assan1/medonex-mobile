import React from "react";
import { Redirect } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useLiveEnabled } from "@/lib/query-mode";
import { FIXTURE_PROFILE_USERS, isFixtureMode } from "@/lib/fixtures";
import { ResourceState } from "@/components/ResourceState";

/** Resolves a public handle, then delegates all data/privacy checks to ProfileView. */
export function HandleProfile({ handle }: { handle: string }) {
  const slug = handle.trim();
  const live = useLiveEnabled();
  const query = useQuery({
    queryKey: ["profile-handle", slug],
    enabled: live && !!slug,
    retry: 1,
    queryFn: () =>
      api.get<{ id: string }>(
        "/profile/handle?handle=" + encodeURIComponent(slug)
      ),
  });
  const fixture = isFixtureMode()
    ? Object.values(FIXTURE_PROFILE_USERS).find(
        (user) => user.handle.toLowerCase() === slug.toLowerCase()
      )
    : undefined;
  const id = isFixtureMode() ? fixture?.id : query.data?.id;
  if (id)
    return (
      <Redirect
        href={{ pathname: "/profile/[userId]", params: { userId: id } }}
      />
    );
  return (
    <ResourceState
      title="Profile"
      error={query.error}
      notFound={!slug || (isFixtureMode() && !fixture)}
      onRetry={() => query.refetch()}
    />
  );
}
