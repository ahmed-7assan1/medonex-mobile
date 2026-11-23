import React from "react";
import { useLocalSearchParams } from "expo-router";
import { StudentEducatorScreen } from "@/components/StudentEducatorScreen";
export default function ChannelScreen() {
  const { channelId } = useLocalSearchParams<{ channelId: string }>();
  return (
    <StudentEducatorScreen
      id={typeof channelId === "string" ? channelId : ""}
      variant="channel"
    />
  );
}
