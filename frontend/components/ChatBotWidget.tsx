import { Ionicons } from "@expo/vector-icons";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../context/ThemeContext";
import { apiPost } from "../utils/api";

// ─── Types ────────────────────────────────────────────────────────────────────

type Role = "user" | "bot";

interface Message {
  id: string;
  role: Role;
  text: string;
}

// History item sent to backend (OpenAI format)
interface HistoryItem {
  role: "user" | "assistant";
  content: string;
}

// ─── Typing indicator ─────────────────────────────────────────────────────────

function TypingDots({ color }: { color: string }) {
  const dots = [
    useRef(new Animated.Value(0)).current,
    useRef(new Animated.Value(0)).current,
    useRef(new Animated.Value(0)).current,
  ];

  useEffect(() => {
    const anims = dots.map((dot, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(i * 150),
          Animated.timing(dot, { toValue: -6, duration: 300, useNativeDriver: true }),
          Animated.timing(dot, { toValue: 0, duration: 300, useNativeDriver: true }),
          Animated.delay(600 - i * 150),
        ]),
      ),
    );
    anims.forEach((a) => a.start());
    return () => anims.forEach((a) => a.stop());
  }, []);

  return (
    <View style={styles.typingRow}>
      {dots.map((dot, i) => (
        <Animated.View
          key={i}
          style={[styles.dot, { backgroundColor: color, transform: [{ translateY: dot }] }]}
        />
      ))}
    </View>
  );
}

// ─── Main widget ──────────────────────────────────────────────────────────────

export default function ChatBotWidget() {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();

  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "0",
      role: "bot",
      text: "Hi! 👋 I'm your Sharely Assistant. Ask me anything about the app!",
    },
  ]);
  const [draft, setDraft] = useState("");
  const [typing, setTyping] = useState(false);
  const historyRef = useRef<HistoryItem[]>([]);

  const slideAnim = useRef(new Animated.Value(0)).current;
  const fabAnim = useRef(new Animated.Value(1)).current;
  const listRef = useRef<FlatList<Message>>(null);

  const openChat = () => {
    setOpen(true);
    Animated.parallel([
      Animated.spring(slideAnim, { toValue: 1, useNativeDriver: true, tension: 70, friction: 12 }),
      Animated.spring(fabAnim, { toValue: 0, useNativeDriver: true, tension: 100, friction: 10 }),
    ]).start();
  };

  const closeChat = () => {
    Animated.parallel([
      Animated.timing(slideAnim, { toValue: 0, duration: 280, useNativeDriver: true }),
      Animated.spring(fabAnim, { toValue: 1, useNativeDriver: true, tension: 100, friction: 10 }),
    ]).start(() => setOpen(false));
  };

  const sendMessage = useCallback(async () => {
    const text = draft.trim();
    if (!text || typing) return;
    setDraft("");

    const userMsg: Message = { id: Date.now().toString(), role: "user", text };
    setMessages((prev) => [...prev, userMsg]);
    setTyping(true);

    // Append user turn to history before sending
    historyRef.current = [...historyRef.current, { role: "user", content: text }];

    try {
      const { reply } = await apiPost<{ reply: string }>("/chatbot/message", {
        message: text,
        history: historyRef.current.slice(0, -1), // history without the current message
      });

      // Append assistant turn to history
      historyRef.current = [...historyRef.current, { role: "assistant", content: reply }];

      setMessages((prev) => [
        ...prev,
        { id: (Date.now() + 1).toString(), role: "bot", text: reply },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { id: (Date.now() + 1).toString(), role: "bot", text: "Sorry, I couldn't reach the server. Please try again. 🔌" },
      ]);
    } finally {
      setTyping(false);
    }
  }, [draft, typing]);

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [messages, typing]);

  const panelTranslateY = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [700, 0],
  });

  const fabScale = fabAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  const botBg = isDark ? "#2a2a2a" : "#F0EEFF";
  const userBg = colors.primary;
  const TAB_BAR_HEIGHT = 62 + insets.bottom;

  return (
    <>
      {/* Floating Action Button */}
      <Animated.View
        style={[
          styles.fab,
          {
            bottom: TAB_BAR_HEIGHT + 16,
            backgroundColor: colors.primary,
            transform: [{ scale: fabScale }],
          },
        ]}
        pointerEvents={open ? "none" : "auto"}
      >
        <TouchableOpacity onPress={openChat} style={styles.fabInner} activeOpacity={0.85}>
          <Ionicons name="sparkles" size={24} color="#fff" />
        </TouchableOpacity>
      </Animated.View>

      {/* Chat Panel (Modal) */}
      <Modal visible={open} transparent animationType="none" onRequestClose={closeChat}>
        <TouchableWithoutFeedback onPress={closeChat}>
          <View style={[styles.backdrop, { backgroundColor: colors.overlay }]} />
        </TouchableWithoutFeedback>

        <Animated.View
          style={[
            styles.panel,
            {
              backgroundColor: colors.background,
              paddingBottom: insets.bottom,
              transform: [{ translateY: panelTranslateY }],
            },
          ]}
        >
          {/* Header */}
          <View style={[styles.panelHeader, { borderBottomColor: colors.border }]}>
            <View style={styles.headerLeft}>
              <View style={[styles.botAvatar, { backgroundColor: colors.primary }]}>
                <Ionicons name="sparkles" size={16} color="#fff" />
              </View>
              <View>
                <Text style={[styles.botName, { color: colors.text }]}>Sharely Assistant</Text>
                <Text style={[styles.botStatus, { color: colors.textSecondary }]}>
                  {typing ? "Typing…" : "Online"}
                </Text>
              </View>
            </View>
            <TouchableOpacity onPress={closeChat} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons name="close" size={24} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Messages */}
          <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            keyboardVerticalOffset={Platform.OS === "ios" ? 20 : 0}
          >
            <FlatList
              ref={listRef}
              data={messages}
              keyExtractor={(m) => m.id}
              contentContainerStyle={styles.messageList}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => (
                <View
                  style={[
                    styles.bubbleWrap,
                    item.role === "user" ? styles.bubbleRight : styles.bubbleLeft,
                  ]}
                >
                  {item.role === "bot" && (
                    <View style={[styles.botAvatarSm, { backgroundColor: colors.primary }]}>
                      <Ionicons name="sparkles" size={10} color="#fff" />
                    </View>
                  )}
                  <View
                    style={[
                      styles.bubble,
                      { backgroundColor: item.role === "user" ? userBg : botBg },
                      item.role === "user" ? styles.bubbleUserRadius : styles.bubbleBotRadius,
                    ]}
                  >
                    <Text
                      style={[
                        styles.bubbleText,
                        { color: item.role === "user" ? "#fff" : colors.text },
                      ]}
                    >
                      {item.text}
                    </Text>
                  </View>
                </View>
              )}
              ListFooterComponent={
                typing ? (
                  <View style={[styles.bubbleWrap, styles.bubbleLeft]}>
                    <View style={[styles.botAvatarSm, { backgroundColor: colors.primary }]}>
                      <Ionicons name="sparkles" size={10} color="#fff" />
                    </View>
                    <View style={[styles.bubble, { backgroundColor: botBg }, styles.bubbleBotRadius]}>
                      <TypingDots color={colors.textSecondary} />
                    </View>
                  </View>
                ) : null
              }
            />

            {/* Input */}
            <View style={[styles.inputRow, { borderTopColor: colors.border, backgroundColor: colors.background }]}>
              <TextInput
                style={[styles.input, { backgroundColor: colors.inputBg, color: colors.text }]}
                placeholder="Ask me anything…"
                placeholderTextColor={colors.textSecondary}
                value={draft}
                onChangeText={setDraft}
                onSubmitEditing={sendMessage}
                returnKeyType="send"
                multiline={false}
              />
              <TouchableOpacity
                style={[styles.sendBtn, { backgroundColor: draft.trim() ? colors.primary : colors.surface }]}
                onPress={sendMessage}
                disabled={!draft.trim()}
              >
                <Ionicons name="send" size={18} color={draft.trim() ? "#fff" : colors.textSecondary} />
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </Animated.View>
      </Modal>
    </>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  fab: {
    position: "absolute",
    right: 18,
    width: 56,
    height: 56,
    borderRadius: 28,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 999,
  },
  fabInner: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  panel: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: "72%",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 20,
  },
  panelHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  botAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
  },
  botName: {
    fontSize: 15,
    fontWeight: "600",
  },
  botStatus: {
    fontSize: 12,
    marginTop: 1,
  },
  messageList: {
    padding: 16,
    gap: 10,
  },
  bubbleWrap: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 6,
    marginBottom: 6,
  },
  bubbleLeft: {
    justifyContent: "flex-start",
  },
  bubbleRight: {
    justifyContent: "flex-end",
  },
  botAvatarSm: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  bubble: {
    maxWidth: "78%",
    paddingVertical: 9,
    paddingHorizontal: 13,
  },
  bubbleBotRadius: {
    borderRadius: 16,
    borderBottomLeftRadius: 4,
  },
  bubbleUserRadius: {
    borderRadius: 16,
    borderBottomRightRadius: 4,
  },
  bubbleText: {
    fontSize: 14.5,
    lineHeight: 20,
  },
  typingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 2,
    paddingHorizontal: 2,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  input: {
    flex: 1,
    height: 40,
    borderRadius: 20,
    paddingHorizontal: 14,
    fontSize: 14.5,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
});
