import React from "react";
import { useLocalSearchParams } from "expo-router";
import { StudentEducatorScreen } from "@/components/StudentEducatorScreen";
export default function InstructorScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return (
    <StudentEducatorScreen
      id={typeof id === "string" ? id : ""}
      variant="instructor"
    />
  );
}
