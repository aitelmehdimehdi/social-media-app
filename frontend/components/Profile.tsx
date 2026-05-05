import { Ionicons } from "@expo/vector-icons";
import { useRouter, useFocusEffect } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
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
import * as ImagePicker from "expo-image-picker";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { API_URL } from "../config/env";
import { apiDelete, apiGet, getToken } from "../utils/api";
import AvatarImage from "./AvatarImage";

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
  avatar: string | null;
  bio: string;
  postsCount: number;
  followersCount: number;
  followingCount: number;
  isFollowing: boolean;
};

type MediaItem = {
  id: string;
  image: string;
  type: "post" | "reel";
  date: string;
  likes: number;
  commentsCount: number;
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

function StatBox({ value, label, onPress }: { value: number; label: string; onPress?: () => void }) {
  const { colors } = useTheme();
  const inner = (
    <>
      <Text style={[styles.statValue, { color: colors.text }]}>{value.toLocaleString()}</Text>
      <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{label}</Text>
    </>
  );
  if (onPress) {
    return (
      <TouchableOpacity style={styles.statBox} onPress={onPress} activeOpacity={0.7}>
        {inner}
      </TouchableOpacity>
    );
  }
  return <View style={styles.statBox}>{inner}</View>;
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout, refreshUser } = useAuth();
  const { colors } = useTheme();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [gridPosts, setGridPosts] = useState<MediaItem[]>([]);
  const [activeTab, setActiveTab] = useState<"grid" | "tagged">("grid");
  const [menuOpen, setMenuOpen] = useState(false);
  const [avatarMenuOpen, setAvatarMenuOpen] = useState(false);
  const [hasStories, setHasStories] = useState(false);
  const [myStoryImageUrl, setMyStoryImageUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    apiGet<UserProfile>(`/users/${user.id}/profile`)
      .then((data) => {
        setProfile(data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));

    apiGet<MediaItem[]>(`/posts/user/${user.id}`)
      .then(setGridPosts)
      .catch(() => setGridPosts([]));

  }, [user]);

  useFocusEffect(
    useCallback(() => {
      if (!user) return;
      apiGet<{ id: string; imageUrl: string; user: { id: string } }[]>("/stories")
        .then((stories) => {
          const mine = stories.find((s) => s.user.id === user.id);
          setHasStories(!!mine);
          setMyStoryImageUrl(mine?.imageUrl ?? null);
        })
        .catch(() => { setHasStories(false); setMyStoryImageUrl(null); });
    }, [user])
  );

  const handleChangePicture = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status === "denied") {
      Alert.alert("Permission required", "Go to Settings → Sharely → Photos and allow access.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images' as ImagePicker.MediaType,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.85,
    });
    setAvatarMenuOpen(false);
    if (result.canceled) return;

    const uri = result.assets[0].uri;
    const formData = new FormData();
    formData.append("file", { uri, type: "image/jpeg", name: "avatar.jpg" } as any);

    try {
      const token = await getToken();
      const res = await fetch(`${API_URL}/users/me/avatar`, {
        method: "PATCH",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });
      if (res.ok) {
        const updated = await res.json();
        setProfile((prev) => prev ? { ...prev, avatar: updated.avatar } : prev);
        await refreshUser();
      } else {
        Alert.alert("Error", "Failed to update profile picture.");
      }
    } catch {
      Alert.alert("Error", "Failed to update profile picture.");
    }
  };

  const handleRemovePicture = async () => {
    setAvatarMenuOpen(false);
    try {
      await apiDelete("/users/me/avatar");
      setProfile((prev) => prev ? { ...prev, avatar: null } : prev);
      await refreshUser();
    } catch {
      Alert.alert("Error", "Failed to remove profile picture.");
    }
  };

  const handleSeeStories = () => {
    setAvatarMenuOpen(false);
    if (!user || !myStoryImageUrl) return;
    router.push({
      pathname: "/story/[userId]",
      params: { userId: user.id, imageUrl: myStoryImageUrl, username: displayName, avatar: displayAvatar ?? "" },
    });
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
  const displayAvatar = profile?.avatar ?? user?.avatar ?? null;
  const displayFullName = profile?.fullName ?? user?.fullName ?? "";
  const displayEmail = user?.email ?? "";
  const displayBio = profile?.bio ?? "";

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
          <TouchableOpacity onPress={() => setAvatarMenuOpen(true)} activeOpacity={0.85}>
            <View style={[styles.avatarWrap, { borderColor: colors.storyRing }]}>
              <AvatarImage uri={displayAvatar} size={82} />
            </View>
          </TouchableOpacity>
          <View style={styles.statsRow}>
            <StatBox value={gridPosts.length} label="Posts" />
            <StatBox
              value={profile?.followersCount ?? 0}
              label="Followers"
              onPress={() => router.push({
                pathname: "/FollowList",
                params: { userId: profile?.id ?? user?.id ?? "", type: "followers" },
              })}
            />
            <StatBox
              value={profile?.followingCount ?? 0}
              label="Following"
              onPress={() => router.push({
                pathname: "/FollowList",
                params: { userId: profile?.id ?? user?.id ?? "", type: "following" },
              })}
            />
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
            style={[styles.actionBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
            activeOpacity={0.8}
            onPress={() =>
              router.push({
                pathname: "/EditProfile",
                params: { fullName: displayFullName, username: displayName, email: displayEmail, bio: displayBio },
              })
            }
          >
            <Text style={[styles.actionBtnText, { color: colors.text }]}>Edit Profile</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
            activeOpacity={0.8}
          >
            <Text style={[styles.actionBtnText, { color: colors.text }]}>Share Profile</Text>
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

        {/* Grid — mixed posts & reels sorted by date */}
        <View style={styles.grid}>
          {/* New post button — always first */}
          <TouchableOpacity
            style={[styles.gridItem, styles.newPostBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
            activeOpacity={0.75}
            onPress={() => router.push("/CreatePost")}
          >
            <Ionicons name="add" size={32} color={colors.textSecondary} />
          </TouchableOpacity>

          {gridPosts.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.gridItem}
              activeOpacity={0.85}
              onPress={() => router.push({ pathname: "/post/[id]", params: { id: item.id, type: item.type } })}
            >
              <Image source={{ uri: item.image }} style={styles.gridImage} />
              {item.type === "reel" && (
                <View style={styles.mediaTypeBadge}>
                  <Ionicons name="play-circle" size={16} color="#fff" />
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      <BottomMenu visible={menuOpen} onClose={() => setMenuOpen(false)} />

      {/* Avatar action modal */}
      <Modal visible={avatarMenuOpen} transparent animationType="fade" onRequestClose={() => setAvatarMenuOpen(false)}>
        <Pressable style={styles.avatarMenuBackdrop} onPress={() => setAvatarMenuOpen(false)}>
          <Pressable style={[styles.avatarMenuCard, { backgroundColor: colors.card }]}>
            <Text style={[styles.avatarMenuTitle, { color: colors.text }]}>Profile photo</Text>
            <View style={[styles.avatarMenuDivider, { backgroundColor: colors.border }]} />

            <TouchableOpacity style={styles.avatarMenuItem} activeOpacity={0.7} onPress={handleChangePicture}>
              <Ionicons name="camera-outline" size={21} color={colors.primary} />
              <Text style={[styles.avatarMenuItemText, { color: colors.primary }]}>Change profile picture</Text>
            </TouchableOpacity>

            <View style={[styles.avatarMenuDivider, { backgroundColor: colors.border }]} />

            <TouchableOpacity
              style={styles.avatarMenuItem}
              activeOpacity={hasStories ? 0.7 : 1}
              onPress={hasStories ? handleSeeStories : undefined}
              disabled={!hasStories}
            >
              <Ionicons name="play-circle-outline" size={21} color={hasStories ? colors.text : colors.textSecondary} style={{ opacity: hasStories ? 1 : 0.4 }} />
              <Text style={[styles.avatarMenuItemText, { color: hasStories ? colors.text : colors.textSecondary, opacity: hasStories ? 1 : 0.35 }]}>
                See my stories
              </Text>
            </TouchableOpacity>

            {displayAvatar && (
              <>
                <View style={[styles.avatarMenuDivider, { backgroundColor: colors.border }]} />
                <TouchableOpacity style={styles.avatarMenuItem} activeOpacity={0.7} onPress={handleRemovePicture}>
                  <Ionicons name="trash-outline" size={21} color="#e74c3c" />
                  <Text style={[styles.avatarMenuItemText, { color: "#e74c3c" }]}>Remove profile picture</Text>
                </TouchableOpacity>
              </>
            )}
          </Pressable>
        </Pressable>
      </Modal>
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
  actionBtn: { flex: 1, paddingVertical: 9, borderRadius: 50, borderWidth: 1, alignItems: "center" },
  actionBtnText: { fontWeight: "700", fontSize: 14 },
  actionBtnOutline: { flex: 1, paddingVertical: 9, borderRadius: 50, borderWidth: 1, alignItems: "center" },
  actionBtnOutlineText: { fontWeight: "600", fontSize: 14 },
  actionBtnIcon: { width: 40, paddingVertical: 9, borderRadius: 50, borderWidth: 1, alignItems: "center" },
  tabBar: { flexDirection: "row", borderTopWidth: 0.5 },
  tab: { flex: 1, paddingVertical: 10, alignItems: "center", borderBottomWidth: 1.5, borderBottomColor: "transparent" },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 1.5 },
  gridItem: { width: GRID_SIZE, height: GRID_SIZE },
  gridImage: { width: "100%", height: "100%" },
  videoOverlay: { position: "absolute", top: 6, right: 6, backgroundColor: "rgba(0,0,0,0.45)", borderRadius: 4, padding: 4 },
  mediaTypeBadge: { position: "absolute", top: 6, right: 6 },
  newPostBtn: { alignItems: "center", justifyContent: "center", borderWidth: 1 },
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
  avatarMenuBackdrop: {
    flex: 1, backgroundColor: "rgba(0,0,0,0.45)",
    alignItems: "center", justifyContent: "center",
  },
  avatarMenuCard: {
    width: 260, borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000", shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18, shadowRadius: 12, elevation: 12,
  },
  avatarMenuTitle: {
    fontSize: 15, fontWeight: "700",
    textAlign: "center", paddingVertical: 16,
  },
  avatarMenuDivider: { height: 0.5 },
  avatarMenuItem: {
    flexDirection: "row", alignItems: "center",
    gap: 12, paddingHorizontal: 20, paddingVertical: 16,
  },
  avatarMenuItemText: { fontSize: 15, fontWeight: "500" },
});
