import React from "react";
import { useLocalSearchParams } from "expo-router";
import { HandleProfile } from "@/components/profile/HandleProfile";
import { ResourceState } from "@/components/ResourceState";
export default function HandleAlias() {
  const { handle } = useLocalSearchParams<{ handle: string }>();
  if (!handle?.startsWith("@"))
    return <ResourceState title="Page" notFound onRetry={() => undefined} />;
  return <HandleProfile handle={handle.slice(1)} />;
}
