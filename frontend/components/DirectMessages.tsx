import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { useUnread } from "../context/UnreadContext";
import { apiGet } from "../utils/api";
import { getSocket } from "../utils/socket";
import AvatarImage from "./AvatarImage";

// ─── Types ────────────────────────────────────────────────────────────────────

type Conversation = {
  id: string;
  username: string;
  avatar: string;
  lastMessage: string;
  time: string;
  unread: number;
  online: boolean;
};

type FollowingUser = {
  id: string;
  username: string;
  fullName: string;
  avatar: string | null;
};

// ─── Conversation Row ─────────────────────────────────────────────────────────

function ConversationRow({ item }: { item: Conversation }) {
  const router = useRouter();
  const { colors } = useTheme();
  return (
    <TouchableOpacity
      style={styles.convRow}
      activeOpacity={0.7}
      onPress={() =>
        router.push({
          pathname: "/conversation/[id]",
          params: { id: item.id, username: item.username, avatar: item.avatar ?? "" },
        })
      }
    >
      <View style={styles.avatarWrap}>
        <AvatarImage uri={item.avatar} size={56} />
        {item.online && <View style={[styles.onlineDot, { borderColor: colors.background }]} />}
      </View>
      <View style={styles.convInfo}>
        <Text style={[styles.convName, { color: colors.text }, item.unread > 0 && styles.bold]}>
          {item.username}
        </Text>
        <Text
          style={[styles.lastMsg, { color: colors.textSecondary }, item.unread > 0 && { color: colors.text }]}
          numberOfLines={1}
        >
          {item.lastMessage}
        </Text>
      </View>
      <View style={styles.convRight}>
        <Text style={[styles.timeText, { color: colors.textSecondary }]}>{item.time}</Text>
        {item.unread > 0 && (
          <View style={[styles.unreadDot, { backgroundColor: colors.primary }]} />
        )}
      </View>
    </TouchableOpacity>
  );
}

// ─── Compose Modal ────────────────────────────────────────────────────────────

function ComposeModal({
  visible,
  onClose,
  currentUserId,
}: {
  visible: boolean;
  onClose: () => void;
  currentUserId: string;
}) {
  const router = useRouter();
  const { colors } = useTheme();
  const [following, setFollowing] = useState<FollowingUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!visible || !currentUserId) return;
    setLoading(true);
    setSearch("");
    apiGet<FollowingUser[]>(`/users/${currentUserId}/following`)
      .then(setFollowing)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [visible, currentUserId]);

  const filtered = following.filter(
    (u) =>
      u.username.toLowerCase().includes(search.toLowerCase()) ||
      u.fullName.toLowerCase().includes(search.toLowerCase()),
  );

  const openConversation = (u: FollowingUser) => {
    onClose();
    router.push({
      pathname: "/conversation/[id]",
      params: { id: u.id, username: u.username, avatar: u.avatar ?? "" },
    });
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={[styles.modalScreen, { backgroundColor: colors.background }]}>
        {/* Modal header */}
        <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Ionicons name="close" size={26} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.modalTitle, { color: colors.text }]}>New message</Text>
          <View style={{ width: 26 }} />
        </View>

        {/* Search */}
        <View style={[styles.modalSearch, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Ionicons name="search-outline" size={16} color={colors.textSecondary} />
          <TextInput
            style={[styles.modalSearchInput, { color: colors.text }]}
            placeholder="Search following..."
            placeholderTextColor={colors.textSecondary}
            value={search}
            onChangeText={setSearch}
            autoFocus
          />
        </View>

        {/* Following list */}
        {loading ? (
          <ActivityIndicator style={{ marginTop: 40 }} color={colors.primary} />
        ) : (
          <FlatList
            data={filtered}
            keyExtractor={(u) => u.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.followRow}
                activeOpacity={0.7}
                onPress={() => openConversation(item)}
              >
                <AvatarImage uri={item.avatar} size={46} />
                <View style={styles.followInfo}>
                  <Text style={[styles.followUsername, { color: colors.text }]}>{item.username}</Text>
                  {!!item.fullName && (
                    <Text style={[styles.followName, { color: colors.textSecondary }]}>{item.fullName}</Text>
                  )}
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
              </TouchableOpacity>
            )}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                {following.length === 0 ? "You're not following anyone yet." : "No results found."}
              </Text>
            }
          />
        )}
      </SafeAreaView>
    </Modal>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function DMScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const { resetUnreadDMs } = useUnread();
  const router = useRouter();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [showCompose, setShowCompose] = useState(false);
  const initialLoad = useRef(true);

  const loadConversations = useCallback(() => {
    apiGet<Conversation[]>("/chat/conversations")
      .then(setConversations)
      .catch(console.error)
      .finally(() => { initialLoad.current = false; setLoading(false); });
  }, []);

  useFocusEffect(useCallback(() => {
    loadConversations();
    resetUnreadDMs();
  }, [loadConversations, resetUnreadDMs]));

  useEffect(() => {
    if (!user?.id) return;
    const sock = getSocket(user.id);
    sock.on("newMessage", loadConversations);
    return () => { sock.off("newMessage", loadConversations); };
  }, [user?.id, loadConversations]);

  const filtered = conversations.filter((c) =>
    c.username.toLowerCase().includes(query.toLowerCase()),
  );

  const online = conversations.filter((c) => c.online);

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Direct messages</Text>
        <TouchableOpacity onPress={() => setShowCompose(true)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="create-outline" size={24} color={colors.text} />
        </TouchableOpacity>
      </View>

      {/* Search bar */}
      <View style={[styles.searchBar, { backgroundColor: colors.surface }]}>
        <Ionicons name="search-outline" size={14} color={colors.textSecondary} style={{ marginRight: 6 }} />
        <TextInput
          style={[styles.searchInput, { color: colors.text }]}
          placeholder="Search"
          placeholderTextColor={colors.textSecondary}
          value={query}
          onChangeText={setQuery}
        />
      </View>

      {online.length > 0 && (
        <>
          <Text style={[styles.sectionLabel, { color: colors.text }]}>Active now</Text>
          <FlatList
            data={online}
            keyExtractor={(item) => "active-" + item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.activeList}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.activeItem}
                onPress={() =>
                  router.push({
                    pathname: "/conversation/[id]",
                    params: { id: item.id, username: item.username, avatar: item.avatar ?? "" },
                  })
                }
              >
                <View style={styles.avatarWrap}>
                  <AvatarImage uri={item.avatar} size={56} />
                  <View style={[styles.onlineDot, { borderColor: colors.background }]} />
                </View>
                <Text style={[styles.activeUsername, { color: colors.text }]} numberOfLines={1}>
                  {item.username.split(".")[0]}
                </Text>
              </TouchableOpacity>
            )}
          />
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
        </>
      )}

      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={colors.primary} />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <ConversationRow item={item} />}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              {conversations.length === 0
                ? "No conversations yet."
                : "No conversations found"}
            </Text>
          }
        />
      )}

      <ComposeModal
        visible={showCompose}
        onClose={() => setShowCompose(false)}
        currentUserId={user?.id ?? ""}
      />
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 0.5,
  },
  headerTitle: { fontSize: 20, fontWeight: "700" },
  searchBar: {
    flexDirection: "row", alignItems: "center",
    margin: 12, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8,
  },
  searchInput: { flex: 1, fontSize: 14, padding: 0 },
  sectionLabel: { fontSize: 14, fontWeight: "600", paddingHorizontal: 16, marginBottom: 8 },
  activeList: { paddingHorizontal: 12, paddingBottom: 12 },
  activeItem: { alignItems: "center", marginHorizontal: 8, width: 60 },
  activeUsername: { fontSize: 11, marginTop: 4 },
  divider: { height: 0.5, marginVertical: 4 },
  convRow: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 12 },
  avatarWrap: { position: "relative", marginRight: 14 },
  onlineDot: {
    position: "absolute", bottom: 2, right: 2, width: 13, height: 13,
    borderRadius: 6.5, backgroundColor: "#2ecc71", borderWidth: 2,
  },
  convInfo: { flex: 1 },
  convName: { fontSize: 14, marginBottom: 3 },
  lastMsg: { fontSize: 13 },
  bold: { fontWeight: "700" },
  convRight: { alignItems: "flex-end", gap: 6 },
  timeText: { fontSize: 12 },
  unreadDot: { width: 10, height: 10, borderRadius: 5 },
  emptyText: { textAlign: "center", marginTop: 40, fontSize: 14 },

  // Compose modal
  modalScreen: { flex: 1 },
  modalHeader: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 0.5,
  },
  modalTitle: { fontSize: 16, fontWeight: "700" },
  modalSearch: {
    flexDirection: "row", alignItems: "center", gap: 8,
    margin: 12, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 9,
    borderWidth: 0.5,
  },
  modalSearchInput: { flex: 1, fontSize: 14, padding: 0 },
  followRow: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 16, paddingVertical: 10, gap: 12,
  },
  followInfo: { flex: 1 },
  followUsername: { fontSize: 14, fontWeight: "600" },
  followName: { fontSize: 13, marginTop: 1 },
});
