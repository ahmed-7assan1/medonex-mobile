import React from "react";
import { StudentPageFrame } from "@/components/StudentPageFrame";
import { AIProviderKeys } from "@/components/settings/AIProviderKeys";
export default function AISettingsScreen() {
  return (
    <StudentPageFrame
      title="AI Provider Keys"
      eyebrow="API Keys"
      heading="AI Provider Keys"
      subtitle="Manage your preferred AI provider. This native preview reads key-set status only."
      maxWidth={896}
      flatPhone={false}
    >
      <AIProviderKeys />
    </StudentPageFrame>
  );
}
