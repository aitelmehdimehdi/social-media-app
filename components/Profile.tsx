import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";

import {
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

const { width: W } = Dimensions.get("window");
const GRID_SIZE = W / 3 - 1;

const USER = {
  username: "mehdi.dev",
  name: "Mehdi",
  bio: "📱 Mobile developer\n🚀 Building cool stuff\n📍 Fes, Morocco",
  avatar: "https://i.pravatar.cc/150?img=11",
  posts: 86,
  followers: 4821,
  following: 312,
};

const HIGHLIGHTS = [
  { id: "1", label: "Travel", cover: "https://picsum.photos/seed/h1/100/100" },
  { id: "2", label: "Code", cover: "https://picsum.photos/seed/h2/100/100" },
  { id: "3", label: "Food", cover: "https://picsum.photos/seed/h3/100/100" },
  { id: "4", label: "Design", cover: "https://picsum.photos/seed/h4/100/100" },
  { id: "5", label: "Friends", cover: "https://picsum.photos/seed/h5/100/100" },
];

const GRID_POSTS = Array.from({ length: 18 }, (_, i) => ({
  id: String(i),
  image: `https://picsum.photos/seed/prof${i + 1}/300/300`,
  isVideo: i % 4 === 0,
}));

// ─── Bottom Sheet ─────────────────────────────────────────────────────────────

function BottomMenu({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
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
            Alert.alert(
              "Déconnexion",
              "Êtes-vous sûr de vouloir vous déconnecter ?",
              [
                {
                  text: "Annuler",
                  style: "cancel",
                  onPress: () => resolve(false),
                },
                {
                  text: "Déconnecter",
                  style: "destructive",
                  onPress: () => resolve(true),
                },
              ],
            );
          });

    if (confirmed) {
      await logout();
      // ✅ Plus de router.replace() ici non plus
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable
        style={[styles.backdrop, { backgroundColor: colors.overlay }]}
        onPress={onClose}
      />
      <View style={[styles.sheet, { backgroundColor: colors.card }]}>
        <View
          style={[styles.sheetHandle, { backgroundColor: colors.border }]}
        />

        {/* Paramètres */}
        <TouchableOpacity
          style={styles.menuItem}
          activeOpacity={0.7}
          onPress={onClose}
        >
          <Ionicons
            name="settings-outline"
            size={22}
            color={colors.text}
            style={styles.menuIcon}
          />
          <Text style={[styles.menuLabel, { color: colors.text }]}>
            Paramètres
          </Text>
        </TouchableOpacity>
        <View
          style={[styles.menuDivider, { backgroundColor: colors.border }]}
        />

        {/* Sauvegardés */}
        <TouchableOpacity
          style={styles.menuItem}
          activeOpacity={0.7}
          onPress={onClose}
        >
          <Ionicons
            name="bookmark-outline"
            size={22}
            color={colors.text}
            style={styles.menuIcon}
          />
          <Text style={[styles.menuLabel, { color: colors.text }]}>
            Éléments sauvegardés
          </Text>
        </TouchableOpacity>
        <View
          style={[styles.menuDivider, { backgroundColor: colors.border }]}
        />

        {/* QR Code */}
        <TouchableOpacity
          style={styles.menuItem}
          activeOpacity={0.7}
          onPress={onClose}
        >
          <Ionicons
            name="qr-code-outline"
            size={22}
            color={colors.text}
            style={styles.menuIcon}
          />
          <Text style={[styles.menuLabel, { color: colors.text }]}>
            QR Code
          </Text>
        </TouchableOpacity>
        <View
          style={[styles.menuDivider, { backgroundColor: colors.border }]}
        />

        {/* Mode sombre */}
        <View style={styles.menuItem}>
          <Ionicons
            name="moon-outline"
            size={22}
            color={colors.text}
            style={styles.menuIcon}
          />
          <Text style={[styles.menuLabel, { color: colors.text, flex: 1 }]}>
            Mode sombre
          </Text>
          <Switch
            value={isDark}
            onValueChange={toggleTheme}
            trackColor={{ false: "#dbdbdb", true: "#0095f6" }}
            thumbColor="#ffffff"
          />
        </View>
        <View
          style={[styles.menuDivider, { backgroundColor: colors.border }]}
        />

        {/* Déconnexion */}
        <TouchableOpacity
          style={styles.menuItem}
          activeOpacity={0.7}
          onPress={handleLogout}
        >
          <Ionicons
            name="log-out-outline"
            size={22}
            color="#e74c3c"
            style={styles.menuIcon}
          />
          <Text style={[styles.menuLabel, { color: "#e74c3c" }]}>
            Se déconnecter
          </Text>
        </TouchableOpacity>

        {/* Annuler */}
        <TouchableOpacity
          style={[styles.cancelBtn, { backgroundColor: colors.surface }]}
          onPress={onClose}
          activeOpacity={0.8}
        >
          <Text style={[styles.cancelText, { color: colors.text }]}>
            Annuler
          </Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

// ─── StatBox ──────────────────────────────────────────────────────────────────

function StatBox({ value, label }: { value: number; label: string }) {
  const { colors } = useTheme();
  return (
    <View style={styles.statBox}>
      <Text style={[styles.statValue, { color: colors.text }]}>
        {value.toLocaleString()}
      </Text>
      <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
        {label}
      </Text>
    </View>
  );
}

// ─── HighlightItem ────────────────────────────────────────────────────────────

function HighlightItem({ item }: { item: (typeof HIGHLIGHTS)[0] }) {
  const { colors } = useTheme();
  return (
    <TouchableOpacity style={styles.hlItem} activeOpacity={0.8}>
      <View style={[styles.hlRing, { borderColor: colors.border }]}>
        <Image source={{ uri: item.cover }} style={styles.hlCover} />
      </View>
      <Text style={[styles.hlLabel, { color: colors.text }]} numberOfLines={1}>
        {item.label}
      </Text>
    </TouchableOpacity>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout } = useAuth(); // ✅ logout ajouté
  const { colors } = useTheme();
  const [activeTab, setActiveTab] = useState<"grid" | "tagged">("grid");
  const [followed, setFollowed] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  // ✅ Handler logout direct depuis le header
  const handleDirectLogout = async () => {
    const confirmed =
      Platform.OS === "web"
        ? window.confirm("Êtes-vous sûr de vouloir vous déconnecter ?")
        : await new Promise<boolean>((resolve) => {
            Alert.alert(
              "Déconnexion",
              "Êtes-vous sûr de vouloir vous déconnecter ?",
              [
                {
                  text: "Annuler",
                  style: "cancel",
                  onPress: () => resolve(false),
                },
                {
                  text: "Déconnecter",
                  style: "destructive",
                  onPress: () => resolve(true),
                },
              ],
            );
          });

    if (confirmed) {
      await logout();
      // ✅ Plus de router.replace() — AuthGuard redirige automatiquement
    }
  };

  return (
    <SafeAreaView
      style={[styles.screen, { backgroundColor: colors.background }]}
    >
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={26} color={colors.text} />
        </TouchableOpacity>

        <Text style={[styles.headerUsername, { color: colors.text }]}>
          {user?.username ?? USER.username}
        </Text>

        {/* Boutons droite : logout + 3 points */}
        <View style={styles.headerRight}>
          {/* ✅ Bouton déconnexion direct */}
          <TouchableOpacity
            onPress={handleDirectLogout}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            style={styles.logoutBtn}
          >
            <Ionicons name="log-out-outline" size={24} color="#e74c3c" />
          </TouchableOpacity>

          {/* 3 points → menu */}
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
            <Image
              source={{ uri: user?.avatar ?? USER.avatar }}
              style={styles.avatar}
            />
          </View>
          <View style={styles.statsRow}>
            <StatBox value={USER.posts} label="Posts" />
            <StatBox value={USER.followers} label="Followers" />
            <StatBox value={USER.following} label="Following" />
          </View>
        </View>

        {/* Bio */}
        <View style={styles.bioSection}>
          <Text style={[styles.bioName, { color: colors.text }]}>
            {user?.fullName ?? USER.name}
          </Text>
          <Text style={[styles.bioText, { color: colors.text }]}>
            {USER.bio}
          </Text>
        </View>

        {/* Actions */}
        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={[
              styles.actionBtn,
              { backgroundColor: followed ? colors.surface : colors.primary },
            ]}
            onPress={() => setFollowed(!followed)}
          >
            <Text
              style={[
                styles.actionBtnText,
                { color: followed ? colors.text : "#fff" },
              ]}
            >
              {followed ? "Following" : "Follow"}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.actionBtnOutline,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <Text style={[styles.actionBtnOutlineText, { color: colors.text }]}>
              Message
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.actionBtnIcon,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <Ionicons name="person-add-outline" size={18} color={colors.text} />
          </TouchableOpacity>
        </View>

        {/* Highlights */}
        <FlatList
          data={HIGHLIGHTS}
          keyExtractor={(item) => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.hlList}
          renderItem={({ item }) => <HighlightItem item={item} />}
        />

        {/* Tabs */}
        <View style={[styles.tabBar, { borderTopColor: colors.border }]}>
          {(["grid", "tagged"] as const).map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[
                styles.tab,
                activeTab === tab && { borderBottomColor: colors.text },
              ]}
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

        {/* Grid */}
        <View style={styles.grid}>
          {GRID_POSTS.map((post) => (
            <TouchableOpacity
              key={post.id}
              style={styles.gridItem}
              activeOpacity={0.85}
            >
              <Image source={{ uri: post.image }} style={styles.gridImage} />
              {post.isVideo && (
                <View style={styles.videoOverlay}>
                  <Ionicons name="play" size={12} color="#fff" />
                </View>
              )}
            </TouchableOpacity>
          ))}
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
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 0.5,
  },
  headerUsername: { fontSize: 16, fontWeight: "700" },

  // ✅ Nouveau : wrapper des boutons droite
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  logoutBtn: {
    padding: 2,
  },

  profileRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 10,
  },
  avatarWrap: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 2.5,
    padding: 2,
    marginRight: 24,
  },
  avatar: { width: 82, height: 82, borderRadius: 41 },
  statsRow: { flex: 1, flexDirection: "row", justifyContent: "space-around" },
  statBox: { alignItems: "center" },
  statValue: { fontSize: 17, fontWeight: "700" },
  statLabel: { fontSize: 12, marginTop: 2 },

  bioSection: { paddingHorizontal: 18, paddingBottom: 12 },
  bioName: { fontSize: 14, fontWeight: "700", marginBottom: 3 },
  bioText: { fontSize: 13.5, lineHeight: 19 },

  actionsRow: {
    flexDirection: "row",
    paddingHorizontal: 14,
    gap: 8,
    marginBottom: 14,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: "center",
  },
  actionBtnText: { fontWeight: "700", fontSize: 14 },
  actionBtnOutline: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: "center",
  },
  actionBtnOutlineText: { fontWeight: "600", fontSize: 14 },
  actionBtnIcon: {
    width: 38,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: "center",
  },

  hlList: { paddingHorizontal: 12, paddingBottom: 14 },
  hlItem: { alignItems: "center", marginHorizontal: 8, width: 66 },
  hlRing: {
    width: 66,
    height: 66,
    borderRadius: 33,
    borderWidth: 2,
    padding: 2,
  },
  hlCover: { width: 58, height: 58, borderRadius: 29 },
  hlLabel: { fontSize: 11, marginTop: 5, textAlign: "center" },

  tabBar: { flexDirection: "row", borderTopWidth: 0.5 },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderBottomWidth: 1.5,
    borderBottomColor: "transparent",
  },

  grid: { flexDirection: "row", flexWrap: "wrap", gap: 1.5 },
  gridItem: { width: GRID_SIZE, height: GRID_SIZE },
  gridImage: { width: "100%", height: "100%" },
  videoOverlay: {
    position: "absolute",
    top: 6,
    right: 6,
    backgroundColor: "rgba(0,0,0,0.45)",
    borderRadius: 4,
    padding: 4,
  },

  backdrop: { flex: 1 },
  sheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 34,
    paddingTop: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 20,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 16,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  menuIcon: { marginRight: 16 },
  menuLabel: { fontSize: 15, fontWeight: "500" },
  menuDivider: { height: 0.5, marginHorizontal: 24 },
  cancelBtn: {
    marginTop: 8,
    marginHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  cancelText: { fontSize: 15, fontWeight: "600" },
});
