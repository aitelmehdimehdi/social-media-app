import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  Image,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { apiGet, apiPost, apiDelete } from "../utils/api";

const { width: W } = Dimensions.get("window");
const GRID_SIZE = W / 3 - 1;

// ─── Static mock data (commented out — replaced by API) ───────────────────────
// const USER = { username: "mehdi.dev", name: "Mehdi", bio: "...", ... };
// const HIGHLIGHTS = [ ... ];
// const GRID_POSTS = Array.from({ length: 18 }, ...);

type UserProfile = {
  id: string;
  username: string;
  fullName: string;
  avatar: string;
  bio: string;
  postsCount: number;
  followersCount: number;
  followingCount: number;
  isFollowing: boolean;
};

type GridPost = {
  id: string;
  image: string;
  isVideo: boolean;
};

// ─── Bottom Sheet ─────────────────────────────────────────────────────────────

function BottomMenu({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { logout } = useAuth();
  const { isDark, toggleTheme, colors } = useTheme();
  const router = useRouter();

  const handleLogout = async () => {
    onClose();
    await new Promise((res) => setTimeout(res, 200));
    const confirmed =
      Platform.OS === "web"
        ? window.confirm("Êtes-vous sûr de vouloir vous déconnecter ?")
        : await new Promise<boolean>((resolve) => {
            Alert.alert("Déconnexion", "Êtes-vous sûr de vouloir vous déconnecter ?", [
              { text: "Annuler", style: "cancel", onPress: () => resolve(false) },
              { text: "Déconnecter", style: "destructive", onPress: () => resolve(true) },
            ]);
          });
    if (confirmed) await logout();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={[styles.backdrop, { backgroundColor: colors.overlay }]} onPress={onClose} />
      <View style={[styles.sheet, { backgroundColor: colors.card }]}>
        <View style={[styles.sheetHandle, { backgroundColor: colors.border }]} />

        <TouchableOpacity style={styles.menuItem} activeOpacity={0.7} onPress={onClose}>
          <Ionicons name="settings-outline" size={22} color={colors.text} style={styles.menuIcon} />
          <Text style={[styles.menuLabel, { color: colors.text }]}>Paramètres</Text>
        </TouchableOpacity>
        <View style={[styles.menuDivider, { backgroundColor: colors.border }]} />

        <TouchableOpacity style={styles.menuItem} activeOpacity={0.7} onPress={onClose}>
          <Ionicons name="bookmark-outline" size={22} color={colors.text} style={styles.menuIcon} />
          <Text style={[styles.menuLabel, { color: colors.text }]}>Éléments sauvegardés</Text>
        </TouchableOpacity>
        <View style={[styles.menuDivider, { backgroundColor: colors.border }]} />

        <View style={styles.menuItem}>
          <Ionicons name="moon-outline" size={22} color={colors.text} style={styles.menuIcon} />
          <Text style={[styles.menuLabel, { color: colors.text, flex: 1 }]}>Mode sombre</Text>
          <Switch
            value={isDark}
            onValueChange={toggleTheme}
            trackColor={{ false: "#dbdbdb", true: "#0095f6" }}
            thumbColor="#ffffff"
          />
        </View>
        <View style={[styles.menuDivider, { backgroundColor: colors.border }]} />

        <TouchableOpacity style={styles.menuItem} activeOpacity={0.7} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={22} color="#e74c3c" style={styles.menuIcon} />
          <Text style={[styles.menuLabel, { color: "#e74c3c" }]}>Se déconnecter</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.cancelBtn, { backgroundColor: colors.surface }]}
          onPress={onClose}
          activeOpacity={0.8}
        >
          <Text style={[styles.cancelText, { color: colors.text }]}>Annuler</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

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

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { colors } = useTheme();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [gridPosts, setGridPosts] = useState<GridPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"grid" | "tagged">("grid");
  const [followed, setFollowed] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (!user) return;
    apiGet<UserProfile>(`/users/${user.id}/profile`)
      .then((data) => {
        setProfile(data);
        setFollowed(data.isFollowing);
      })
      .catch(console.error)
      .finally(() => setLoading(false));

    // Load user's posts for the grid
    apiGet<{ id: string; imageUrl: string }[]>(`/posts/feed`)
      .then((posts) =>
        setGridPosts(
          posts.map((p, i) => ({ id: p.id, image: p.imageUrl, isVideo: i % 4 === 0 })),
        ),
      )
      .catch(console.error);
  }, [user]);

  const handleFollowToggle = async () => {
    if (!profile) return;
    const next = !followed;
    setFollowed(next);
    setProfile((prev) =>
      prev
        ? { ...prev, followersCount: prev.followersCount + (next ? 1 : -1) }
        : prev,
    );
    try {
      if (next) await apiPost(`/users/${profile.id}/follow`);
      else await apiDelete(`/users/${profile.id}/follow`);
    } catch (_) {
      setFollowed(!next);
    }
  };

  const handleDirectLogout = async () => {
    const confirmed =
      Platform.OS === "web"
        ? window.confirm("Êtes-vous sûr de vouloir vous déconnecter ?")
        : await new Promise<boolean>((resolve) => {
            Alert.alert("Déconnexion", "Êtes-vous sûr de vouloir vous déconnecter ?", [
              { text: "Annuler", style: "cancel", onPress: () => resolve(false) },
              { text: "Déconnecter", style: "destructive", onPress: () => resolve(true) },
            ]);
          });
    if (confirmed) await logout();
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.screen, { backgroundColor: colors.background, justifyContent: "center" }]}>
        <ActivityIndicator color={colors.primary} />
      </SafeAreaView>
    );
  }

  const displayName = profile?.username ?? user?.username ?? "profile";
  const displayAvatar = profile?.avatar ?? user?.avatar ?? "https://i.pravatar.cc/150";
  const displayFullName = profile?.fullName ?? user?.fullName ?? "";

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={26} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerUsername, { color: colors.text }]}>{displayName}</Text>
        <View style={styles.headerRight}>
          <TouchableOpacity
            onPress={handleDirectLogout}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            style={styles.logoutBtn}
          >
            <Ionicons name="log-out-outline" size={24} color="#e74c3c" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setMenuOpen(true)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="ellipsis-vertical" size={22} color={colors.text} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Profile row */}
        <View style={styles.profileRow}>
          <View style={[styles.avatarWrap, { borderColor: colors.storyRing }]}>
            <Image source={{ uri: displayAvatar }} style={styles.avatar} />
          </View>
          <View style={styles.statsRow}>
            <StatBox value={profile?.postsCount ?? 0} label="Posts" />
            <StatBox value={profile?.followersCount ?? 0} label="Followers" />
            <StatBox value={profile?.followingCount ?? 0} label="Following" />
          </View>
        </View>

        {/* Bio */}
        <View style={styles.bioSection}>
          <Text style={[styles.bioName, { color: colors.text }]}>{displayFullName}</Text>
          {!!profile?.bio && (
            <Text style={[styles.bioText, { color: colors.text }]}>{profile.bio}</Text>
          )}
        </View>

        {/* Actions */}
        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: followed ? colors.surface : colors.primary }]}
            onPress={handleFollowToggle}
          >
            <Text style={[styles.actionBtnText, { color: followed ? colors.text : "#fff" }]}>
              {followed ? "Following" : "Follow"}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtnOutline, { backgroundColor: colors.surface, borderColor: colors.border }]}
          >
            <Text style={[styles.actionBtnOutlineText, { color: colors.text }]}>Message</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtnIcon, { backgroundColor: colors.surface, borderColor: colors.border }]}
          >
            <Ionicons name="person-add-outline" size={18} color={colors.text} />
          </TouchableOpacity>
        </View>

        {/* Tabs */}
        <View style={[styles.tabBar, { borderTopColor: colors.border }]}>
          {(["grid", "tagged"] as const).map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[styles.tab, activeTab === tab && { borderBottomColor: colors.text }]}
              onPress={() => setActiveTab(tab)}
            >
              <Ionicons
                name={tab === "grid" ? "grid-outline" : "pricetag-outline"}
                size={22}
                color={activeTab === tab ? colors.text : colors.textSecondary}
              />
            </TouchableOpacity>
          ))}
        </View>

        {/* Grid — dynamic posts */}
        <View style={styles.grid}>
          {gridPosts.length === 0 ? (
            <Text style={{ color: colors.textSecondary, padding: 20, textAlign: "center" }}>
              No posts yet
            </Text>
          ) : (
            gridPosts.map((post) => (
              <TouchableOpacity key={post.id} style={styles.gridItem} activeOpacity={0.85}>
                <Image source={{ uri: post.image }} style={styles.gridImage} />
                {post.isVideo && (
                  <View style={styles.videoOverlay}>
                    <Ionicons name="play" size={12} color="#fff" />
                  </View>
                )}
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>

      <BottomMenu visible={menuOpen} onClose={() => setMenuOpen(false)} />
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
  headerRight: { flexDirection: "row", alignItems: "center", gap: 10 },
  logoutBtn: { padding: 2 },
  profileRow: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingTop: 16, paddingBottom: 10 },
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
  actionBtn: { flex: 1, paddingVertical: 8, borderRadius: 8, alignItems: "center" },
  actionBtnText: { fontWeight: "700", fontSize: 14 },
  actionBtnOutline: { flex: 1, paddingVertical: 8, borderRadius: 8, borderWidth: 1, alignItems: "center" },
  actionBtnOutlineText: { fontWeight: "600", fontSize: 14 },
  actionBtnIcon: { width: 38, paddingVertical: 8, borderRadius: 8, borderWidth: 1, alignItems: "center" },
  tabBar: { flexDirection: "row", borderTopWidth: 0.5 },
  tab: { flex: 1, paddingVertical: 10, alignItems: "center", borderBottomWidth: 1.5, borderBottomColor: "transparent" },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 1.5 },
  gridItem: { width: GRID_SIZE, height: GRID_SIZE },
  gridImage: { width: "100%", height: "100%" },
  videoOverlay: { position: "absolute", top: 6, right: 6, backgroundColor: "rgba(0,0,0,0.45)", borderRadius: 4, padding: 4 },
  backdrop: { flex: 1 },
  sheet: {
    position: "absolute", bottom: 0, left: 0, right: 0, borderTopLeftRadius: 20,
    borderTopRightRadius: 20, paddingBottom: 34, paddingTop: 10,
    shadowColor: "#000", shadowOffset: { width: 0, height: -3 }, shadowOpacity: 0.15, shadowRadius: 10, elevation: 20,
  },
  sheetHandle: { width: 40, height: 4, borderRadius: 2, alignSelf: "center", marginBottom: 16 },
  menuItem: { flexDirection: "row", alignItems: "center", paddingHorizontal: 24, paddingVertical: 16 },
  menuIcon: { marginRight: 16 },
  menuLabel: { fontSize: 15, fontWeight: "500" },
  menuDivider: { height: 0.5, marginHorizontal: 24 },
  cancelBtn: { marginTop: 8, marginHorizontal: 16, paddingVertical: 14, borderRadius: 12, alignItems: "center" },
  cancelText: { fontSize: 15, fontWeight: "600" },
});
