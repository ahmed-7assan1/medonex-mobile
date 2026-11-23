import React, { useState } from "react";
import { View, Text, Pressable, ActivityIndicator, Linking, Platform, ScrollView } from "react-native";
import * as FileSystem from "expo-file-system/legacy";
import * as IntentLauncher from "expo-intent-launcher";
import { Download, RefreshCw } from "lucide-react-native";
import { useTranslation } from "react-i18next";
import { useTheme } from "@/theme/ThemeContext";
import type { UpdateManifest } from "@/lib/update-gate";

// Full-screen forced-update gate: the only screen the app opens onto while
// the running build is below the manifest's minimum supported version.
// Shows the update size, a changelog preview, and live download progress.

export function UpdateGate({
  manifest,
  current,
  recheck,
}: {
  manifest: UpdateManifest;
  current: string;
  recheck: () => void;
}) {
  const { st, fonts } = useTheme();
  const { i18n } = useTranslation();
  const ar = i18n.language === "ar";
  const [progress, setProgress] = useState<number | null>(null);
  const [failed, setFailed] = useState(false);
  const sizeMB = manifest.sizeBytes > 0 ? (manifest.sizeBytes / 1048576).toFixed(0) : null;
  const notes = (ar ? manifest.changelog.ar : manifest.changelog.en) ?? manifest.changelog.en;

  const openInBrowser = () => {
    if (manifest.apkUrl) void Linking.openURL(manifest.apkUrl);
  };

  const download = async () => {
    if (!manifest.apkUrl || progress !== null) return;
    setFailed(false);
    setProgress(0);
    try {
      const target = FileSystem.cacheDirectory + "medonex-update.apk";
      const task = FileSystem.createDownloadResumable(
        manifest.apkUrl,
        target,
        {},
        (p) => {
          if (p.totalBytesExpectedToWrite > 0) {
            setProgress(p.totalBytesWritten / p.totalBytesExpectedToWrite);
          }
        }
      );
      const result = await task.downloadAsync();
      if (!result?.uri) throw new Error("no file");
      if (Platform.OS === "android") {
        const contentUri = await FileSystem.getContentUriAsync(result.uri);
        await IntentLauncher.startActivityAsync("android.intent.action.VIEW", {
          data: contentUri,
          type: "application/vnd.android.package-archive",
          flags: 1 | 0x10000000, // FLAG_GRANT_READ_URI_PERMISSION | NEW_TASK
        });
      } else {
        openInBrowser();
      }
      setProgress(null);
    } catch {
      setProgress(null);
      setFailed(true);
    }
  };

  return (
    <View
      testID="update-gate"
      style={{ flex: 1, backgroundColor: st.bg, justifyContent: "center", padding: 28 }}
    >
      <View style={{ gap: 18, width: "100%", maxWidth: 420, alignSelf: "center" }}>
        <Text style={{ color: st.text, fontSize: 24, fontFamily: fonts.sansBold, textAlign: "center" }}>
          {ar ? "مطلوب تحديث التطبيق" : "Update required"}
        </Text>
        <Text style={{ color: st.muted, fontSize: 14, lineHeight: 21, textAlign: "center" }}>
          {ar
            ? `الإصدار ${current} مش مدعوم دلوقتي. حدّث للإصدار ${manifest.minSupportedVersion} عشان تكمل استخدام التطبيق.`
            : `Version ${current} is no longer supported. Update to ${manifest.minSupportedVersion} to keep using the app.`}
        </Text>
        {notes.length > 0 && (
          <View
            style={{
              borderWidth: 1,
              borderColor: st.border,
              borderRadius: 16,
              padding: 16,
              gap: 8,
              backgroundColor: st.surface,
            }}
          >
            <Text style={{ color: st.text, fontSize: 13, fontFamily: fonts.sansSemiBold }}>
              {ar ? `الجديد في ${manifest.latestVersion}` : `What's new in ${manifest.latestVersion}`}
            </Text>
            <ScrollView style={{ maxHeight: 140 }}>
              {notes.slice(0, 6).map((note, i) => (
                <Text key={i} style={{ color: st.muted, fontSize: 13, lineHeight: 22 }}>
                  {"• "}
                  {note}
                </Text>
              ))}
            </ScrollView>
          </View>
        )}
        {progress !== null ? (
          <View style={{ gap: 10, alignItems: "center" }}>
            <View style={{ height: 8, width: "100%", borderRadius: 4, backgroundColor: st.surface, overflow: "hidden" }}>
              <View style={{ height: 8, width: `${Math.round(progress * 100)}%`, backgroundColor: st.text }} />
            </View>
            <Text style={{ color: st.text, fontSize: 14, fontFamily: fonts.sansSemiBold }}>
              {Math.round(progress * 100)}%
              {sizeMB ? ` ${ar ? "من" : "of"} ${sizeMB} MB` : ""}
            </Text>
          </View>
        ) : (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={ar ? "حدّث التطبيق" : "Update now"}
            onPress={() => void download()}
            style={{
              flexDirection: "row",
              gap: 10,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: st.text,
              borderRadius: 26,
              paddingVertical: 15,
            }}
          >
            <Download size={18} color={st.bg} />
            <Text style={{ color: st.bg, fontSize: 15, fontFamily: fonts.sansSemiBold }}>
              {ar ? "حدّث دلوقتي" : "Update now"}
              {sizeMB ? ` (${sizeMB} MB)` : ""}
            </Text>
          </Pressable>
        )}
        {failed && (
          <Text accessibilityRole="alert" style={{ color: "#f87171", fontSize: 13, textAlign: "center" }}>
            {ar ? "التحميل ما كملش. حاول تاني." : "The download did not finish. Try again."}
          </Text>
        )}
        <Pressable
          accessibilityRole="button"
          onPress={recheck}
          style={{ flexDirection: "row", gap: 6, alignItems: "center", justifyContent: "center", padding: 8 }}
        >
          {progress === null ? <RefreshCw size={14} color={st.muted} /> : <ActivityIndicator color={st.muted} />}
          <Text style={{ color: st.muted, fontSize: 12 }}>
            {ar ? "حدّثت التطبيق بالفعل؟ اضغط هنا" : "Already updated? Tap to recheck"}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
