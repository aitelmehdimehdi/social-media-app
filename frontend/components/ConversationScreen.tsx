import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../context/ThemeContext";
import AvatarImage from "./AvatarImage";

// ─── Bubble colors ────────────────────────────────────────────────────────────
// Dark theme:  my bubbles = green,  their bubbles = white  (text dark on white)
// Light theme: my bubbles = navy,   their bubbles = black  (text white on both)

const BUBBLE = {
  dark:  { mine: "#25D366", theirs: "#ffffff" },
  light: { mine: "#1565C0", theirs: "#212121" },
};

// ─── Static mock data ─────────────────────────────────────────────────────────

type Message = { id: string; text: string; isMine: boolean; time: string };

const MOCK_MESSAGES: Message[] = [
  { id: "11", text: "Sounds like a plan! 👋", isMine: true,  time: "11:05 AM" },
  { id: "10", text: "Let's grab coffee and talk about the project 🎉", isMine: false, time: "11:03 AM" },
  { id: "9",  text: "Yes I am! What do you have in mind?", isMine: true,  time: "11:02 AM" },
  { id: "8",  text: "By the way, are you free this weekend?", isMine: false, time: "11:00 AM" },
  { id: "7",  text: "Perfect! Looking forward to it 👍", isMine: false, time: "10:37 AM" },
  { id: "6",  text: "I'll send you the link later, it's almost ready for testing", isMine: true,  time: "10:36 AM" },
  { id: "5",  text: "Wow that sounds really cool! I'd love to see it 😍", isMine: false, time: "10:35 AM" },
  { id: "4",  text: "Sure! Built it with React Native — dark mode and everything 😄", isMine: true,  time: "10:33 AM" },
  { id: "3",  text: "That's awesome! Can you share the details?", isMine: false, time: "10:32 AM" },
  { id: "2",  text: "I'm great, thanks! Just finished that project 🚀", isMine: true,  time: "10:31 AM" },
  { id: "1",  text: "Hey! How are you doing?", isMine: false, time: "10:30 AM" },
];


// ─── Message bubble ───────────────────────────────────────────────────────────

function Bubble({
  msg,
  otherAvatar,
  isDark,
}: {
  msg: Message;
  otherAvatar: string | null;
  isDark: boolean;
}) {
  const bubbleBg  = msg.isMine
    ? (isDark ? BUBBLE.dark.mine  : BUBBLE.light.mine)
    : (isDark ? BUBBLE.dark.theirs : BUBBLE.light.theirs);

  // white text on all dark backgrounds; near-black on white (dark theme, other)
  const textColor = (!msg.isMine && isDark) ? "#1a1a1a" : "#ffffff";

  return (
    <View style={[styles.row, msg.isMine ? styles.rowMine : styles.rowTheirs]}>
      {!msg.isMine && (
        <AvatarImage uri={otherAvatar} size={28} style={styles.bubbleAvatar} />
      )}
      <View
        style={[
          styles.bubble,
          { backgroundColor: bubbleBg },
          msg.isMine ? styles.bubbleMine : styles.bubbleTheirs,
        ]}
      >
        <Text style={[styles.bubbleText, { color: textColor }]}>{msg.text}</Text>
        <Text style={[styles.bubbleTime, { color: textColor, opacity: 0.6 }]}>
          {msg.time}
        </Text>
      </View>
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function ConversationScreen() {
  const router = useRouter();
  const { username, avatar } = useLocalSearchParams<{ username: string; avatar: string }>();
  const { colors, isDark } = useTheme();

  const [messages, setMessages] = useState<Message[]>(MOCK_MESSAGES);
  const [draft, setDraft] = useState("");

  const otherAvatar = avatar || null;

  const handleSend = () => {
    const trimmed = draft.trim();
    if (!trimmed) return;
    setMessages((prev) => [
      {
        id: String(Date.now()),
        text: trimmed,
        isMine: true,
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      },
      ...prev,
    ]);
    setDraft("");
  };

  return (
    <SafeAreaView
      style={[styles.screen, { backgroundColor: colors.background }]}
      edges={["top", "bottom"]}
    >
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border, backgroundColor: colors.background }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="chevron-back" size={26} color={colors.text} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.headerCenter} activeOpacity={0.8}>
          <AvatarImage uri={otherAvatar} size={38} />
          <View>
            <Text style={[styles.headerName, { color: colors.text }]}>{username}</Text>
            <Text style={[styles.headerStatus, { color: colors.textSecondary }]}>Active now</Text>
          </View>
        </TouchableOpacity>

        <View style={styles.headerActions}>
          <TouchableOpacity hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="call-outline" size={24} color={colors.text} />
          </TouchableOpacity>
          <TouchableOpacity hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="videocam-outline" size={26} color={colors.text} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Messages */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      >
        <FlatList
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <Bubble msg={item} otherAvatar={otherAvatar} isDark={isDark} />
          )}
          inverted
          contentContainerStyle={styles.messageList}
          showsVerticalScrollIndicator={false}
        />

        {/* Input bar */}
        <View style={[styles.inputBar, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
          <TouchableOpacity style={styles.inputIcon}>
            <Ionicons name="happy-outline" size={26} color={colors.textSecondary} />
          </TouchableOpacity>

          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: colors.surface,
                color: colors.text,
              },
            ]}
            placeholder="Message..."
            placeholderTextColor={colors.textSecondary}
            value={draft}
            onChangeText={setDraft}
            multiline
            maxLength={500}
            returnKeyType="default"
          />

          <TouchableOpacity
            style={[
              styles.sendBtn,
              {
                backgroundColor: draft.trim()
                  ? (isDark ? BUBBLE.dark.mine : BUBBLE.light.mine)
                  : colors.surface,
              },
            ]}
            onPress={handleSend}
            activeOpacity={0.8}
          >
            <Ionicons
              name="send"
              size={18}
              color={draft.trim() ? "#fff" : colors.textSecondary}
            />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: { flex: 1 },

  // Header
  header: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 12, paddingVertical: 10,
    borderBottomWidth: 0.5,
  },
  headerCenter: {
    flex: 1, flexDirection: "row", alignItems: "center",
    marginLeft: 8, gap: 10,
  },
  headerAvatar: { width: 38, height: 38, borderRadius: 19 },
  headerName: { fontSize: 15, fontWeight: "700" },
  headerStatus: { fontSize: 12, marginTop: 1 },
  headerActions: { flexDirection: "row", gap: 14, marginLeft: 8 },

  // Messages list
  messageList: { paddingHorizontal: 12, paddingVertical: 16, gap: 8 },

  // Bubble row
  row: { flexDirection: "row", alignItems: "flex-end", marginVertical: 2 },
  rowMine: { justifyContent: "flex-end" },
  rowTheirs: { justifyContent: "flex-start" },
  bubbleAvatar: {
    width: 28, height: 28, borderRadius: 14,
    marginRight: 6, marginBottom: 2,
  },

  // Bubble shape
  bubble: {
    maxWidth: "75%",
    paddingHorizontal: 14, paddingVertical: 9,
    borderRadius: 20,
  },
  bubbleMine: {
    borderBottomRightRadius: 4,
  },
  bubbleTheirs: {
    borderBottomLeftRadius: 4,
  },
  bubbleText: { fontSize: 14.5, lineHeight: 20 },
  bubbleTime: { fontSize: 10.5, marginTop: 4, textAlign: "right" },

  // Input bar
  inputBar: {
    flexDirection: "row", alignItems: "flex-end",
    paddingHorizontal: 10, paddingVertical: 8,
    borderTopWidth: 0.5, gap: 8,
  },
  inputIcon: { paddingBottom: 8 },
  input: {
    flex: 1, borderRadius: 22,
    paddingHorizontal: 16, paddingVertical: 9,
    fontSize: 14.5, maxHeight: 120,
  },
  sendBtn: {
    width: 38, height: 38, borderRadius: 19,
    alignItems: "center", justifyContent: "center",
    marginBottom: 1,
  },
});
