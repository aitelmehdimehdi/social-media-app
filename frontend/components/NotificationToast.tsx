import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../context/ThemeContext";
import { type LatestNotification, useUnread } from "../context/UnreadContext";
import AvatarImage from "./AvatarImage";

function notifText(type: LatestNotification["type"]): string {
  if (type === "like") return "liked your post";
  if (type === "comment") return "commented on your post";
  return "started following you";
}

function Toast({ notif, onDismiss }: { notif: LatestNotification; onDismiss: () => void }) {
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

  return (
    <Animated.View
      style={[
        styles.toast,
        { backgroundColor: colors.card, top: insets.top + 8 },
        { transform: [{ translateY }] },
      ]}
    >
      <View style={styles.inner}>
        <AvatarImage uri={notif.senderAvatar} size={42} />
        <View style={styles.textWrap}>
          <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>
            {notif.senderUsername}
          </Text>
          <Text style={[styles.preview, { color: colors.textSecondary }]} numberOfLines={1}>
            {notifText(notif.type)}
          </Text>
        </View>
        <TouchableOpacity onPress={dismiss} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Text style={[styles.close, { color: colors.textSecondary }]}>✕</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

export default function NotificationToast() {
  const { latestNotification, clearLatestNotification } = useUnread();

  if (!latestNotification) return null;

  return (
    <Toast
      key={latestNotification.id}
      notif={latestNotification}
      onDismiss={clearLatestNotification}
    />
  );
}

const styles = StyleSheet.create({
  toast: {
    position: "absolute",
    left: 12,
    right: 12,
    zIndex: 9998,
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
