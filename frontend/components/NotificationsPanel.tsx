import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../context/ThemeContext";
import { useUnread } from "../context/UnreadContext";
import { apiGet, apiPatch } from "../utils/api";
import AvatarImage from "./AvatarImage";

type NotifItem = {
  id: string;
  type: "like" | "comment" | "follow";
  postId: string | null;
  isRead: boolean;
  createdAt: string;
  sender: {
    id: string;
    username: string;
    avatar: string | null;
  };
};

function timeAgo(isoDate: string): string {
  const diff = (Date.now() - new Date(isoDate).getTime()) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return `${Math.floor(diff / 86400)}d`;
}

function notifText(type: NotifItem["type"]): string {
  if (type === "like") return "liked your post.";
  if (type === "comment") return "commented on your post.";
  return "started following you.";
}

function NotifRow({ item, onPress }: { item: NotifItem; onPress: () => void }) {
  const { colors } = useTheme();
  return (
    <TouchableOpacity
      style={[styles.row, !item.isRead && { backgroundColor: colors.surface }]}
      activeOpacity={0.7}
      onPress={onPress}
    >
      <AvatarImage uri={item.sender.avatar} size={44} />
      <View style={styles.rowText}>
        <Text style={[styles.rowContent, { color: colors.text }]} numberOfLines={2}>
          <Text style={styles.bold}>{item.sender.username}</Text>
          {" "}
          {notifText(item.type)}
        </Text>
        <Text style={[styles.rowTime, { color: colors.textSecondary }]}>
          {timeAgo(item.createdAt)}
        </Text>
      </View>
      {!item.isRead && (
        <View style={[styles.unreadDot, { backgroundColor: colors.primary }]} />
      )}
    </TouchableOpacity>
  );
}

export default function NotificationsPanel({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  const { colors } = useTheme();
  const { resetUnreadNotifs } = useUnread();
  const router = useRouter();
  const [notifs, setNotifs] = useState<NotifItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setLoading(true);
    apiGet<NotifItem[]>("/notifications")
      .then(setNotifs)
      .catch(() => {})
      .finally(() => setLoading(false));

    apiPatch("/notifications/read", {}).catch(() => {});
    resetUnreadNotifs();
  }, [visible]);

  const handlePress = (item: NotifItem) => {
    onClose();
    if (item.type === "follow") {
      router.push({
        pathname: "/user/[username]",
        params: { username: item.sender.username },
      });
    } else if (item.postId) {
      router.push({
        pathname: "/post/[id]",
        params: { id: item.postId },
      });
    }
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaProvider>
      <SafeAreaView style={[styles.screen, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Ionicons name="close" size={26} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.text }]}>Notifications</Text>
          <View style={{ width: 26 }} />
        </View>

        {loading ? (
          <ActivityIndicator style={{ marginTop: 40 }} color={colors.primary} />
        ) : (
          <FlatList
            data={notifs}
            keyExtractor={(n) => n.id}
            renderItem={({ item }) => (
              <NotifRow item={item} onPress={() => handlePress(item)} />
            )}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <Text style={[styles.empty, { color: colors.textSecondary }]}>
                No notifications yet.
              </Text>
            }
          />
        )}
      </SafeAreaView>
      </SafeAreaProvider>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
  },
  title: { fontSize: 16, fontWeight: "700" },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  rowText: { flex: 1 },
  rowContent: { fontSize: 14, lineHeight: 20 },
  rowTime: { fontSize: 12, marginTop: 2 },
  bold: { fontWeight: "700" },
  unreadDot: { width: 8, height: 8, borderRadius: 4 },
  empty: { textAlign: "center", marginTop: 40, fontSize: 14 },
});
