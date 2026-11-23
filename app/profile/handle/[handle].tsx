import React from "react";
import { useLocalSearchParams } from "expo-router";
import { HandleProfile } from "@/components/profile/HandleProfile";
export default function HandleProfileRoute() {
  const { handle } = useLocalSearchParams<{ handle: string }>();
  return <HandleProfile handle={handle || ""} />;
}
