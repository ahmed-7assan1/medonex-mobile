import{useStudentDimensions as useWindowDimensions}from'@/lib/student-viewport';
import React, { useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
  } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Send } from "lucide-react-native";
import { StudentPageFrame } from "@/components/StudentPageFrame";
import { ResourceState } from "@/components/ResourceState";
import { useStudentExtra } from "@/lib/student-extras";
import { useAuth } from "@/lib/auth";
import { isFixtureMode } from "@/lib/fixtures";
import { useTheme } from "@/theme/ThemeContext";
type Conversation = {
  peer: { id: string; name: string | null };
  messages: {
    id: string;
    body: string;
    senderId: string;
    receiverId: string;
    read: boolean;
    createdAt: string;
  }[];
  limit: number;
};
export default function DirectMessagesScreen() {
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const id = typeof userId === "string" ? userId : "";
  const { user } = useAuth();
  const {viewportWidth, width } = useWindowDimensions();
  const tablet = viewportWidth >= 768;
  const { colors, fonts } = useTheme();
  const router = useRouter();
  const guest = isFixtureMode();
  const [draft, setDraft] = useState("");
  const resource = useStudentExtra<Conversation>(
    "/messages?withUserId=" + encodeURIComponent(id),
    { peer: { id, name: "Sample Member" }, messages: [], limit: 200 }
  );
  const data = resource.data;
  if (!data)
    return (
      <ResourceState
        title="Messages"
        error={resource.error}
        onRetry={() => resource.refetch()}
      />
    );
  return (
    <StudentPageFrame
      title="Messages"
      flatPhone={false}
      maxWidth={768}
      guestSample={guest}
    >
      <View style={{ marginBottom: 32 }}>
        <Text
          style={{
            color: colors.primary,
            fontFamily: fonts.sansBold,
            fontSize: 10,
            letterSpacing: 2,
            marginBottom: 8,
          }}
        >
          MESSAGES
        </Text>
        <Text
          style={{
            color: colors.foreground,
            fontFamily: fonts.display,
            fontSize: tablet ? 48 : 30,
            lineHeight: tablet ? 52 : 34,
          }}
        >
          {data.peer.name || "Member"}
        </Text>
        <Text
          style={{
            color: colors.mutedForeground,
            fontFamily: fonts.sans,
            fontSize: 14,
            marginTop: 16,
          }}
        >
          Private conversation
        </Text>
        <View
          style={{
            width: 80,
            height: 4,
            borderRadius: 4,
            marginTop: 32,
            backgroundColor: colors.primary + "33",
          }}
        />
      </View>
      <Pressable
        accessibilityRole="button"
        onPress={() =>
          router.push(("/profile/" + encodeURIComponent(data.peer.id)) as never)
        }
      >
        <Text
          style={{
            fontSize: 14,
            fontFamily: fonts.sans,
            color: colors.primary,
            marginBottom: 12,
          }}
        >
          ← {data.peer.name || "Member"}'s profile
        </Text>
      </Pressable>
      <ScrollView
        nestedScrollEnabled
        style={{
          height: 420,
          borderRadius: 12,
          borderWidth: 1,
          borderColor: colors.border,
          backgroundColor: colors.muted + "33",
        }}
        contentContainerStyle={{ padding: 16, gap: 8 }}
      >
        {data.messages.length ? (
          data.messages.map((message) => {
            const mine = message.senderId === user?.id;
            return (
              <View
                key={message.id}
                style={{
                  alignSelf: mine ? "flex-end" : "flex-start",
                  maxWidth: "85%",
                  backgroundColor: mine ? colors.primary : colors.card,
                  borderWidth: mine ? 0 : 1,
                  borderColor: colors.border,
                  borderRadius: 16,
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                }}
              >
                <Text
                  selectable
                  style={{
                    fontSize: 14,
                    lineHeight: 21,
                    fontFamily: fonts.sans,
                    color: mine ? colors.primaryForeground : colors.foreground,
                  }}
                >
                  {message.body}
                </Text>
                <Text
                  style={{
                    fontSize: 10,
                    opacity: 0.7,
                    marginTop: 4,
                    color: mine
                      ? colors.primaryForeground
                      : colors.mutedForeground,
                  }}
                >
                  {new Date(message.createdAt).toLocaleString()}
                </Text>
              </View>
            );
          })
        ) : (
          <Text
            style={{
              textAlign: "center",
              paddingVertical: 32,
              fontSize: 14,
              color: colors.mutedForeground,
            }}
          >
            {guest
              ? "Sign in to read real messages."
              : "No messages yet. Say hello."}
          </Text>
        )}
      </ScrollView>
      <View style={{ marginTop: 12, flexDirection: "row", gap: 8 }}>
        <TextInput
          accessibilityLabel="Message draft"
          placeholder="Write a message..."
          placeholderTextColor={colors.mutedForeground}
          multiline
          value={draft}
          onChangeText={setDraft}
          maxLength={8000}
          style={{
            flex: 1,
            minHeight: 44,
            maxHeight: 132,
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: 12,
            color: colors.foreground,
            backgroundColor: colors.background,
            paddingHorizontal: 12,
            paddingVertical: 8,
            fontSize: 14,
            fontFamily: fonts.sans,
          }}
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Send"
          disabled={!draft.trim()}
          onPress={() =>
            Alert.alert(
              "Read-only on mobile",
              "No message was sent. Send messages on the website. Your draft is only on this screen."
            )
          }
          style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            backgroundColor: colors.primary,
            opacity: draft.trim() ? 1 : 0.5,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Send size={20} color={colors.primaryForeground} />
        </Pressable>
      </View>
      <Text
        style={{
          fontSize: 11,
          lineHeight: 17,
          color: colors.mutedForeground,
          marginTop: 12,
        }}
      >
        Read-only conversation. Up to {data.limit} messages are shown. Opening
        this screen does not change read receipts.
      </Text>
    </StudentPageFrame>
  );
}
