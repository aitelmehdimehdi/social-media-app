import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
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
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { apiGet, apiPatch } from "../utils/api";
import { getSocket } from "../utils/socket";
import AvatarImage from "./AvatarImage";
import type { Socket } from "socket.io-client";

// ─── Bubble colors ────────────────────────────────────────────────────────────
// Dark theme:  my bubbles = green,  their bubbles = white  (text dark on white)
// Light theme: my bubbles = navy,   their bubbles = black  (text white on both)

const BUBBLE = {
  dark:  { mine: "#25D366", theirs: "#ffffff" },
  light: { mine: "#1565C0", theirs: "#212121" },
};

// ─── Types ────────────────────────────────────────────────────────────────────

type Message = { id: string; text: string; isMine: boolean; time: string };

type ApiMessage = {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  isRead: boolean;
  createdAt: string;
};

function toMsg(m: ApiMessage, myId: string): Message {
  return {
    id: m.id,
    text: m.content,
    isMine: m.senderId === myId,
    time: new Date(m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
  };
}

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
  const { id: otherId, username, avatar } = useLocalSearchParams<{
    id: string;
    username: string;
    avatar: string;
  }>();
  const { colors, isDark } = useTheme();
  const { user } = useAuth();

  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState("");
  const socketRef = useRef<Socket | null>(null);

  const otherAvatar = avatar || null;
  const myId = user?.id ?? "";

  useEffect(() => {
    if (!otherId || !myId) return;

    // Load message history and mark messages from the other user as read
    apiGet<ApiMessage[]>(`/chat/${otherId}/messages`)
      .then((data) => setMessages([...data].reverse().map((m) => toMsg(m, myId))))
      .catch(console.error)
      .finally(() => setLoading(false));
    apiPatch(`/chat/${otherId}/read`).catch(console.error);

    // Connect socket and listen for incoming messages
    const sock = getSocket(myId);
    socketRef.current = sock;

    const handleNewMessage = (msg: ApiMessage) => {
      setMessages((prev) => [toMsg(msg, myId), ...prev]);
    };

    sock.on("newMessage", handleNewMessage);

    return () => {
      sock.off("newMessage", handleNewMessage);
    };
  }, [otherId, myId]);

  const handleSend = () => {
    const trimmed = draft.trim();
    if (!trimmed || !socketRef.current || !myId || !otherId) return;
    socketRef.current.emit("sendMessage", {
      senderId: myId,
      receiverId: otherId,
      content: trimmed,
    });
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
        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator color={colors.primary} />
          </View>
        ) : (
          <FlatList
            data={messages}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <Bubble msg={item} otherAvatar={otherAvatar} isDark={isDark} />
            )}
            inverted
            contentContainerStyle={styles.messageList}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                No messages yet. Say hi!
              </Text>
            }
          />
        )}

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
  centered: { flex: 1, alignItems: "center", justifyContent: "center" },

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
  headerName: { fontSize: 15, fontWeight: "700" },
  headerStatus: { fontSize: 12, marginTop: 1 },
  headerActions: { flexDirection: "row", gap: 14, marginLeft: 8 },

  // Messages list
  messageList: { paddingHorizontal: 12, paddingVertical: 16, gap: 8 },

  // Empty
  emptyText: { textAlign: "center", fontSize: 14, paddingVertical: 40 },

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
