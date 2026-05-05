import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Dimensions,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../context/ThemeContext";
import AvatarImage from "./AvatarImage";

const { width: W } = Dimensions.get("window");
const GRID_SIZE = W / 3 - 1;

// ─── Static mock data (no backend yet) ───────────────────────────────────────

const MOCK_USERS: Record<string, {
  fullName: string;
  avatar: null;
  bio: string;
  posts: number;
  followers: number;
  following: number;
}> = {
  "alex.photo": {
    fullName: "Alex Photography",
    avatar: null,
    bio: "📷 Photographer | Paris lover",
    posts: 48,
    followers: 1240,
    following: 312,
  },
  "maria_art": {
    fullName: "Maria Art",
    avatar: null,
    bio: "🎨 Digital artist | New York",
    posts: 67,
    followers: 3820,
    following: 180,
  },
  "john_travels": {
    fullName: "John Travels",
    avatar: null,
    bio: "✈️ Wanderer | 42 countries",
    posts: 134,
    followers: 8900,
    following: 450,
  },
  "mehdi.dev": {
    fullName: "Mehdi",
    avatar: null,
    bio: "📱 Mobile developer\n🚀 Building cool stuff\n📍 Fes, Morocco",
    posts: 23,
    followers: 560,
    following: 214,
  },
};

const FALLBACK_USER = {
  fullName: "Instagram User",
  avatar: null,
  bio: "",
  posts: 12,
  followers: 128,
  following: 64,
};

// ─── Stat Box ─────────────────────────────────────────────────────────────────

function StatBox({ value, label }: { value: number; label: string }) {
  const { colors } = useTheme();
  return (
    <View style={styles.statBox}>
      <Text style={[styles.statValue, { color: colors.text }]}>{value.toLocaleString()}</Text>
      <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{label}</Text>
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function UserProfileScreen() {
  const router = useRouter();
  const { username } = useLocalSearchParams<{ username: string }>();
  const { colors } = useTheme();
  const [following, setFollowing] = useState(false);

  const userData = MOCK_USERS[username ?? ""] ?? FALLBACK_USER;

  const gridImages = Array.from({ length: 12 }, (_, i) => ({
    id: String(i),
    uri: `https://picsum.photos/seed/${username}${i}/300/300`,
    isVideo: i % 5 === 0,
  }));

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="chevron-back" size={26} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerUsername, { color: colors.text }]}>{username}</Text>
        <View style={{ width: 26 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Profile row */}
        <View style={styles.profileRow}>
          <View style={[styles.avatarWrap, { borderColor: colors.storyRing }]}>
            <AvatarImage uri={userData.avatar} size={82} />
          </View>
          <View style={styles.statsRow}>
            <StatBox value={userData.posts} label="Posts" />
            <StatBox value={userData.followers + (following ? 1 : 0)} label="Followers" />
            <StatBox value={userData.following} label="Following" />
          </View>
        </View>

        {/* Bio */}
        <View style={styles.bioSection}>
          <Text style={[styles.bioName, { color: colors.text }]}>{userData.fullName}</Text>
          {!!userData.bio && (
            <Text style={[styles.bioText, { color: colors.text }]}>{userData.bio}</Text>
          )}
        </View>

        {/* Actions */}
        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={[
              styles.actionBtn,
              { backgroundColor: following ? colors.surface : colors.primary },
            ]}
            onPress={() => setFollowing((prev) => !prev)}
            activeOpacity={0.8}
          >
            <Text style={[styles.actionBtnText, { color: following ? colors.text : "#fff" }]}>
              {following ? "Following" : "Follow"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: colors.surface }]}
            activeOpacity={0.8}
          >
            <Text style={[styles.actionBtnText, { color: colors.text }]}>Message</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionBtnIcon, { backgroundColor: colors.surface, borderColor: colors.border }]}
            activeOpacity={0.8}
          >
            <Ionicons name="person-add-outline" size={18} color={colors.text} />
          </TouchableOpacity>
        </View>

        {/* Tab strip (grid only for now) */}
        <View style={[styles.tabBar, { borderTopColor: colors.border }]}>
          <View style={[styles.tab, { borderBottomColor: colors.text }]}>
            <Ionicons name="grid-outline" size={22} color={colors.text} />
          </View>
          <View style={[styles.tab, { borderBottomColor: "transparent" }]}>
            <Ionicons name="pricetag-outline" size={22} color={colors.textSecondary} />
          </View>
        </View>

        {/* Posts grid */}
        <View style={styles.grid}>
          {gridImages.map((item) => (
            <TouchableOpacity key={item.id} style={styles.gridItem} activeOpacity={0.85}>
              <Image source={{ uri: item.uri }} style={styles.gridImage} />
              {item.isVideo && (
                <View style={styles.videoOverlay}>
                  <Ionicons name="play" size={12} color="#fff" />
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 0.5,
  },
  headerUsername: { fontSize: 16, fontWeight: "700" },
  profileRow: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 16, paddingTop: 16, paddingBottom: 10,
  },
  avatarWrap: { width: 90, height: 90, borderRadius: 45, borderWidth: 2.5, padding: 2, marginRight: 24 },
  avatar: { width: 82, height: 82, borderRadius: 41 },
  statsRow: { flex: 1, flexDirection: "row", justifyContent: "space-around" },
  statBox: { alignItems: "center" },
  statValue: { fontSize: 17, fontWeight: "700" },
  statLabel: { fontSize: 12, marginTop: 2 },
  bioSection: { paddingHorizontal: 18, paddingBottom: 12 },
  bioName: { fontSize: 14, fontWeight: "700", marginBottom: 3 },
  bioText: { fontSize: 13.5, lineHeight: 19 },
  actionsRow: { flexDirection: "row", paddingHorizontal: 14, gap: 8, marginBottom: 14 },
  actionBtn: { flex: 1, paddingVertical: 9, borderRadius: 50, borderWidth: 1, alignItems: "center" },
  actionBtnText: { fontWeight: "700", fontSize: 14 },
  actionBtnIcon: {
    width: 40, paddingVertical: 9, borderRadius: 50, borderWidth: 1, alignItems: "center",
  },
  tabBar: { flexDirection: "row", borderTopWidth: 0.5 },
  tab: {
    flex: 1, paddingVertical: 10, alignItems: "center",
    borderBottomWidth: 1.5,
  },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 1.5 },
  gridItem: { width: GRID_SIZE, height: GRID_SIZE },
  gridImage: { width: "100%", height: "100%" },
  videoOverlay: {
    position: "absolute", top: 6, right: 6,
    backgroundColor: "rgba(0,0,0,0.45)", borderRadius: 4, padding: 4,
  },
});