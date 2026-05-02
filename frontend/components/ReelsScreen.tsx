import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewToken,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { apiGet, apiPost } from "../utils/api";

const { width: W, height: H } = Dimensions.get("window");

// ─── Static mock data (commented out — replaced by API) ───────────────────────
// const REELS = [ { id: "1", username: "alex.photo", ... }, ... ];

// ─── Types ────────────────────────────────────────────────────────────────────

type Reel = {
  id: string;
  username: string;
  avatar: string;
  caption: string;
  audio: string;
  thumbnail: string;
  likes: number;
  comments: number;
  shares: number;
  isLiked: boolean;
  isSaved: boolean;
};

// ─── Format numbers ───────────────────────────────────────────────────────────

function fmt(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return String(n);
}

// ─── Single Reel Item ─────────────────────────────────────────────────────────

function ReelItem({ item }: { item: Reel }) {
  const [liked, setLiked] = useState(item.isLiked);
  const [saved, setSaved] = useState(item.isSaved);
  const [likes, setLikes] = useState(item.likes);
  const [paused, setPaused] = useState(false);

  const handleLike = async () => {
    const next = !liked;
    setLiked(next);
    setLikes((prev) => (next ? prev + 1 : prev - 1));
    try {
      await apiPost(`/posts/${item.id}/like`);
    } catch (_) {
      setLiked(!next);
      setLikes((prev) => (next ? prev - 1 : prev + 1));
    }
  };

  return (
    <View style={styles.reelContainer}>
      <TouchableOpacity
        style={StyleSheet.absoluteFill}
        activeOpacity={1}
        onPress={() => setPaused(!paused)}
      >
        <Image source={{ uri: item.thumbnail }} style={StyleSheet.absoluteFill} resizeMode="cover" />
        <View style={styles.gradient} />
        {paused && (
          <View style={styles.pauseOverlay}>
            <Text style={styles.pauseIcon}>⏸</Text>
          </View>
        )}
      </TouchableOpacity>

      <SafeAreaView style={styles.topBar}>
        <Text style={styles.topTitle}>Reels</Text>
        <TouchableOpacity><Text style={styles.cameraIcon}>📷</Text></TouchableOpacity>
      </SafeAreaView>

      <View style={styles.sideBar}>
        <TouchableOpacity style={styles.sideAction} onPress={handleLike}>
          <Text style={styles.sideIcon}>{liked ? "❤️" : "🤍"}</Text>
          <Text style={styles.sideCount}>{fmt(likes)}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.sideAction}>
          <Text style={styles.sideIcon}>💬</Text>
          <Text style={styles.sideCount}>{fmt(item.comments)}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.sideAction}>
          <Text style={styles.sideIcon}>📤</Text>
          <Text style={styles.sideCount}>{fmt(item.shares)}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.sideAction} onPress={() => setSaved(!saved)}>
          <Text style={styles.sideIcon}>{saved ? "🔖" : "🏷️"}</Text>
        </TouchableOpacity>
        <View style={styles.discWrap}>
          <Image source={{ uri: item.avatar }} style={styles.disc} />
          <View style={styles.discCenter} />
        </View>
      </View>

      <View style={styles.bottomInfo}>
        <View style={styles.userRow}>
          <Image source={{ uri: item.avatar }} style={styles.avatar} />
          <Text style={styles.username}>{item.username}</Text>
          <TouchableOpacity style={styles.followBtn}>
            <Text style={styles.followText}>Follow</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.caption} numberOfLines={2}>{item.caption}</Text>
        <View style={styles.audioRow}>
          <Text style={styles.audioText}>{item.audio}</Text>
        </View>
      </View>
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function ReelsScreen() {
  const [reels, setReels] = useState<Reel[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    apiGet<Reel[]>("/posts/reels")
      .then(setReels)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0) setActiveIndex(viewableItems[0].index ?? 0);
    },
    [],
  );

  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 60 }).current;

  if (loading) {
    return (
      <View style={[styles.screen, { justifyContent: "center" }]}>
        <ActivityIndicator color="#fff" size="large" />
      </View>
    );
  }

  if (reels.length === 0) {
    return (
      <View style={[styles.screen, { justifyContent: "center", alignItems: "center" }]}>
        <Text style={{ color: "#fff", fontSize: 14 }}>No reels yet. Run the seed script!</Text>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <FlatList
        data={reels}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => (
          <ReelItem item={item} key={index === activeIndex ? "active" : item.id} />
        )}
        pagingEnabled
        showsVerticalScrollIndicator={false}
        snapToInterval={H}
        decelerationRate="fast"
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        getItemLayout={(_, index) => ({ length: H, offset: H * index, index })}
      />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#000" },
  reelContainer: { width: W, height: H, backgroundColor: "#000" },
  gradient: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.18)" },
  pauseOverlay: { ...StyleSheet.absoluteFillObject, alignItems: "center", justifyContent: "center" },
  pauseIcon: { fontSize: 64, opacity: 0.8 },
  topBar: {
    position: "absolute", top: 0, left: 0, right: 0, flexDirection: "row",
    justifyContent: "space-between", alignItems: "center", paddingHorizontal: 18, paddingTop: 4, zIndex: 10,
  },
  topTitle: { color: "#fff", fontSize: 18, fontWeight: "700" },
  cameraIcon: { fontSize: 24, color: "#fff" },
  sideBar: { position: "absolute", right: 12, bottom: 120, alignItems: "center", gap: 18 },
  sideAction: { alignItems: "center", gap: 4 },
  sideIcon: { fontSize: 28 },
  sideCount: { color: "#fff", fontSize: 12, fontWeight: "600" },
  discWrap: {
    width: 44, height: 44, borderRadius: 22, borderWidth: 2, borderColor: "#fff",
    overflow: "hidden", alignItems: "center", justifyContent: "center", marginTop: 6,
  },
  disc: { width: 44, height: 44, borderRadius: 22 },
  discCenter: { position: "absolute", width: 12, height: 12, borderRadius: 6, backgroundColor: "#262626", borderWidth: 1, borderColor: "#555" },
  bottomInfo: { position: "absolute", bottom: 70, left: 0, right: 80, paddingHorizontal: 16, gap: 8 },
  userRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  avatar: { width: 34, height: 34, borderRadius: 17, borderWidth: 1.5, borderColor: "#fff" },
  username: { color: "#fff", fontWeight: "700", fontSize: 14 },
  followBtn: { borderWidth: 1.5, borderColor: "#fff", borderRadius: 6, paddingHorizontal: 12, paddingVertical: 3 },
  followText: { color: "#fff", fontSize: 12, fontWeight: "600" },
  caption: { color: "#fff", fontSize: 13.5, lineHeight: 19 },
  audioRow: { flexDirection: "row", alignItems: "center" },
  audioText: { color: "#fff", fontSize: 12, opacity: 0.85 },
});
