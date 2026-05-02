import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { apiGet } from "../utils/api";

// ─── Static mock data (commented out — replaced by API) ───────────────────────
// const CONVERSATIONS = [ { id: "1", username: "alex.photo", ... }, ... ];

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

// ─── Conversation Item ────────────────────────────────────────────────────────

function ConversationRow({ item }: { item: Conversation }) {
  return (
    <TouchableOpacity style={styles.convRow} activeOpacity={0.7}>
      <View style={styles.avatarWrap}>
        <Image source={{ uri: item.avatar ?? "https://i.pravatar.cc/150" }} style={styles.avatar} />
        {item.online && <View style={styles.onlineDot} />}
      </View>
      <View style={styles.convInfo}>
        <Text style={[styles.convName, item.unread > 0 && styles.bold]}>{item.username}</Text>
        <Text style={[styles.lastMsg, item.unread > 0 && styles.bold]} numberOfLines={1}>
          {item.lastMessage}
        </Text>
      </View>
      <View style={styles.convRight}>
        <Text style={styles.timeText}>{item.time}</Text>
        {item.unread > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{item.unread}</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function DMScreen() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

  useEffect(() => {
    apiGet<Conversation[]>("/chat/conversations")
      .then(setConversations)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filtered = conversations.filter((c) =>
    c.username.toLowerCase().includes(query.toLowerCase()),
  );

  const online = conversations.filter((c) => c.online);

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Direct messages</Text>
        <TouchableOpacity>
          <Text style={styles.composeIcon}>✏️</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.searchBar}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search"
          placeholderTextColor="#8e8e8e"
          value={query}
          onChangeText={setQuery}
        />
      </View>

      {online.length > 0 && (
        <>
          <Text style={styles.sectionLabel}>Active now</Text>
          <FlatList
            data={online}
            keyExtractor={(item) => "active-" + item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.activeList}
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.activeItem}>
                <View style={styles.avatarWrap}>
                  <Image source={{ uri: item.avatar }} style={styles.activeAvatar} />
                  <View style={styles.onlineDot} />
                </View>
                <Text style={styles.activeUsername} numberOfLines={1}>
                  {item.username.split(".")[0]}
                </Text>
              </TouchableOpacity>
            )}
          />
          <View style={styles.divider} />
        </>
      )}

      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color="#0095f6" />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <ConversationRow item={item} />}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <Text style={styles.emptyText}>
              {conversations.length === 0
                ? "No conversations yet. Run the seed script!"
                : "No conversations found"}
            </Text>
          }
        />
      )}
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#fff" },
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 0.5, borderBottomColor: "#dbdbdb",
  },
  headerTitle: { fontSize: 20, fontWeight: "700", color: "#000" },
  composeIcon: { fontSize: 22 },
  searchBar: {
    flexDirection: "row", alignItems: "center", backgroundColor: "#efefef",
    margin: 12, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8,
  },
  searchIcon: { fontSize: 14, marginRight: 6 },
  searchInput: { flex: 1, fontSize: 14, color: "#262626", padding: 0 },
  sectionLabel: { fontSize: 14, fontWeight: "600", color: "#262626", paddingHorizontal: 16, marginBottom: 8 },
  activeList: { paddingHorizontal: 12, paddingBottom: 12 },
  activeItem: { alignItems: "center", marginHorizontal: 8, width: 60 },
  activeAvatar: { width: 56, height: 56, borderRadius: 28 },
  activeUsername: { fontSize: 11, color: "#262626", marginTop: 4 },
  divider: { height: 0.5, backgroundColor: "#dbdbdb", marginVertical: 4 },
  convRow: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 12 },
  avatarWrap: { position: "relative", marginRight: 14 },
  avatar: { width: 56, height: 56, borderRadius: 28 },
  onlineDot: {
    position: "absolute", bottom: 2, right: 2, width: 13, height: 13,
    borderRadius: 6.5, backgroundColor: "#2ecc71", borderWidth: 2, borderColor: "#fff",
  },
  convInfo: { flex: 1 },
  convName: { fontSize: 14, color: "#262626", marginBottom: 3 },
  lastMsg: { fontSize: 13, color: "#8e8e8e" },
  bold: { fontWeight: "700", color: "#262626" },
  convRight: { alignItems: "flex-end", gap: 6 },
  timeText: { fontSize: 12, color: "#8e8e8e" },
  badge: {
    backgroundColor: "#0095f6", borderRadius: 10, minWidth: 20,
    height: 20, alignItems: "center", justifyContent: "center", paddingHorizontal: 5,
  },
  badgeText: { color: "#fff", fontSize: 11, fontWeight: "700" },
  emptyText: { textAlign: "center", color: "#8e8e8e", marginTop: 40, fontSize: 14 },
});
