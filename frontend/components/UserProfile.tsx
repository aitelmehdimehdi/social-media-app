import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
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
import { apiDelete, apiGet, apiPost } from "../utils/api";
import AvatarImage from "./AvatarImage";

const { width: W } = Dimensions.get("window");
const GRID_SIZE = W / 3 - 1;

// ─── Types ────────────────────────────────────────────────────────────────────

type UserProfile = {
  id: string;
  username: string;
  fullName: string;
  avatar: string | null;
  bio: string | null;
  postsCount: number;
  followersCount: number;
  followingCount: number;
  isFollowing: boolean;
};

type PostItem = {
  id: string;
  image: string | null;
  type: "post" | "reel";
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

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [posts, setPosts] = useState<PostItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [following, setFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [followLoading, setFollowLoading] = useState(false);

  useEffect(() => {
    if (!username) return;
    apiGet<UserProfile>(`/users/by-username/${username}`)
      .then(async (profileData) => {
        setProfile(profileData);
        setFollowing(profileData.isFollowing);
        setFollowersCount(profileData.followersCount);
        const postsData = await apiGet<PostItem[]>(`/posts/user/${profileData.id}`).catch(() => [] as PostItem[]);
        setPosts(postsData);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [username]);

  const handleFollow = async () => {
    if (!profile || followLoading) return;
    setFollowLoading(true);
    const next = !following;
    setFollowing(next);
    setFollowersCount((c) => c + (next ? 1 : -1));
    try {
      if (next) {
        await apiPost(`/users/${profile.id}/follow`);
      } else {
        await apiDelete(`/users/${profile.id}/follow`);
      }
    } catch {
      setFollowing(!next);
      setFollowersCount((c) => c + (next ? -1 : 1));
    } finally {
      setFollowLoading(false);
    }
  };

  const handleMessage = () => {
    if (!profile) return;
    router.push({
      pathname: "/conversation/[id]",
      params: {
        id: profile.id,
        username: profile.username,
        avatar: profile.avatar ?? "",
      },
    });
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.screen, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Ionicons name="chevron-back" size={26} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerUsername, { color: colors.text }]}>{username}</Text>
          <View style={{ width: 26 }} />
        </View>
        <View style={styles.centered}>
          <ActivityIndicator color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (!profile) {
    return (
      <SafeAreaView style={[styles.screen, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Ionicons name="chevron-back" size={26} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerUsername, { color: colors.text }]}>{username}</Text>
          <View style={{ width: 26 }} />
        </View>
        <View style={styles.centered}>
          <Text style={{ color: colors.textSecondary }}>User not found.</Text>
        </View>
      </SafeAreaView>
    );
  }

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
        <Text style={[styles.headerUsername, { color: colors.text }]}>{profile.username}</Text>
        <View style={{ width: 26 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Profile row */}
        <View style={styles.profileRow}>
          <View style={[styles.avatarWrap, { borderColor: colors.storyRing }]}>
            <AvatarImage uri={profile.avatar} size={82} />
          </View>
          <View style={styles.statsRow}>
            <StatBox value={profile.postsCount} label="Posts" />
            <StatBox value={followersCount} label="Followers" />
            <StatBox value={profile.followingCount} label="Following" />
          </View>
        </View>

        {/* Bio */}
        <View style={styles.bioSection}>
          <Text style={[styles.bioName, { color: colors.text }]}>{profile.fullName}</Text>
          {!!profile.bio && (
            <Text style={[styles.bioText, { color: colors.text }]}>{profile.bio}</Text>
          )}
        </View>

        {/* Actions */}
        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={[
              styles.actionBtn,
              { backgroundColor: following ? colors.surface : colors.primary },
            ]}
            onPress={handleFollow}
            activeOpacity={0.8}
            disabled={followLoading}
          >
            <Text style={[styles.actionBtnText, { color: following ? colors.text : "#fff" }]}>
              {following ? "Following" : "Follow"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: colors.surface }]}
            onPress={handleMessage}
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

        {/* Tab strip */}
        <View style={[styles.tabBar, { borderTopColor: colors.border }]}>
          <View style={[styles.tab, { borderBottomColor: colors.text }]}>
            <Ionicons name="grid-outline" size={22} color={colors.text} />
          </View>
          <View style={[styles.tab, { borderBottomColor: "transparent" }]}>
            <Ionicons name="pricetag-outline" size={22} color={colors.textSecondary} />
          </View>
        </View>

        {/* Posts grid */}
        {posts.length === 0 ? (
          <View style={styles.emptyPosts}>
            <Ionicons name="camera-outline" size={48} color={colors.textSecondary} />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No posts yet</Text>
          </View>
        ) : (
          <View style={styles.grid}>
            {posts.map((item) => (
              <TouchableOpacity key={item.id} style={styles.gridItem} activeOpacity={0.85}>
                {item.image ? (
                  <Image source={{ uri: item.image }} style={styles.gridImage} />
                ) : (
                  <View style={[styles.gridImage, { backgroundColor: "#222" }]} />
                )}
                {item.type === "reel" && (
                  <View style={styles.videoOverlay}>
                    <Ionicons name="play" size={12} color="#fff" />
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: { flex: 1 },
  centered: { flex: 1, alignItems: "center", justifyContent: "center" },
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
  tab: { flex: 1, paddingVertical: 10, alignItems: "center", borderBottomWidth: 1.5 },
  emptyPosts: { alignItems: "center", paddingVertical: 48, gap: 10 },
  emptyText: { fontSize: 14 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 1.5 },
  gridItem: { width: GRID_SIZE, height: GRID_SIZE },
  gridImage: { width: "100%", height: "100%" },
  videoOverlay: {
    position: "absolute", top: 6, right: 6,
    backgroundColor: "rgba(0,0,0,0.45)", borderRadius: 4, padding: 4,
  },
});
