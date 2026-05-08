import { useRouter } from "expo-router";
import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../context/ThemeContext";
import { type LatestMessage, useUnread } from "../context/UnreadContext";
import AvatarImage from "./AvatarImage";

function Toast({ msg, onDismiss }: { msg: LatestMessage; onDismiss: () => void }) {
  const router = useRouter();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const translateY = useRef(new Animated.Value(-120)).current;
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    Animated.spring(translateY, {
      toValue: 0,
      useNativeDriver: true,
      tension: 80,
      friction: 10,
    }).start();

    timer.current = setTimeout(() => dismiss(), 4000);
    return () => { if (timer.current) clearTimeout(timer.current); };
  }, []);

  const dismiss = () => {
    Animated.timing(translateY, {
      toValue: -120,
      duration: 250,
      useNativeDriver: true,
    }).start(onDismiss);
  };

  const openConversation = () => {
    dismiss();
    router.push({
      pathname: "/conversation/[id]",
      params: { id: msg.senderId, username: msg.senderUsername, avatar: msg.avatar ?? "" },
    });
  };

  return (
    <Animated.View
      style={[
        styles.toast,
        { backgroundColor: colors.card, top: insets.top + 8 },
        { transform: [{ translateY }] },
      ]}
    >
      <TouchableOpacity style={styles.inner} activeOpacity={0.85} onPress={openConversation}>
        <AvatarImage uri={msg.avatar} size={42} />
        <View style={styles.textWrap}>
          <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>
            {msg.senderUsername}
          </Text>
          <Text style={[styles.preview, { color: colors.textSecondary }]} numberOfLines={1}>
            {msg.content}
          </Text>
        </View>
        <TouchableOpacity onPress={dismiss} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Text style={[styles.close, { color: colors.textSecondary }]}>✕</Text>
        </TouchableOpacity>
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function MessageToast({ activeSenderId }: { activeSenderId?: string }) {
  const { latestMessage, clearLatestMessage } = useUnread();

  // Don't show toast if the user is already in the conversation with this sender
  if (!latestMessage || latestMessage.senderId === activeSenderId) return null;

  return <Toast key={latestMessage.senderId + latestMessage.content} msg={latestMessage} onDismiss={clearLatestMessage} />;
}

const styles = StyleSheet.create({
  toast: {
    position: "absolute",
    left: 12,
    right: 12,
    zIndex: 9999,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 10,
  },
  inner: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    gap: 10,
  },
  textWrap: { flex: 1 },
  name: { fontSize: 14, fontWeight: "700", marginBottom: 2 },
  preview: { fontSize: 13 },
  close: { fontSize: 14, paddingHorizontal: 4 },
});
