import { Ionicons } from "@expo/vector-icons";
import { ResizeMode, Video } from "expo-av";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import CommentsSheet from "./CommentsSheet";
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Image,
  Share,
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
  videoUrl?: string;
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

const PLACEHOLDER_REEL: Reel = {
  id: "", username: "", avatar: "", caption: "", audio: "",
  thumbnail: "", likes: 0, comments: 0, shares: 0, isLiked: false, isSaved: false,
};

// ─── Single Reel Item ─────────────────────────────────────────────────────────

function ReelItem({
  item,
  isActive,
  onCommentPress,
}: {
  item: Reel;
  isActive: boolean;
  onCommentPress: (reelId: string, onAdded: () => void) => void;
}) {
  const router = useRouter();
  const videoRef = useRef<Video>(null);
  const [liked, setLiked] = useState(item.isLiked);
  const [saved, setSaved] = useState(item.isSaved);
  const [likes, setLikes] = useState(item.likes);
  const [commentsCount, setCommentsCount] = useState(item.comments);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (!isActive) {
      videoRef.current?.pauseAsync().catch(() => {});
    } else if (!paused) {
      videoRef.current?.playAsync().catch(() => {});
    }
  }, [isActive, paused]);

  const handleLike = async () => {
    if (!item.id) return;
    const next = !liked;
    setLiked(next);
    setLikes((prev) => (next ? prev + 1 : prev - 1));
    try {
      await apiPost(`/posts/reels/${item.id}/like`);
    } catch (_) {
      setLiked(!next);
      setLikes((prev) => (next ? prev - 1 : prev + 1));
    }
  };

  const handleShare = async () => {
    try {
      await Share.share({ message: `Check out this reel by @${item.username}!` });
    } catch {}
  };

  const handleSave = async () => {
    if (!item.id) return;
    const next = !saved;
    setSaved(next);
    try {
      await apiPost(`/posts/reels/${item.id}/save`);
    } catch (_) {
      setSaved(!next);
    }
  };

  return (
    <View style={styles.reelContainer}>
      <TouchableOpacity
        style={StyleSheet.absoluteFill}
        activeOpacity={1}
        onPress={() => setPaused(!paused)}
      >
        {item.videoUrl ? (
          <Video
            ref={videoRef}
            source={{ uri: item.videoUrl }}
            style={StyleSheet.absoluteFill}
            resizeMode={ResizeMode.COVER}
            shouldPlay={isActive && !paused}
            isLooping
            isMuted={false}
          />
        ) : null}
        <View style={styles.gradient} />
        {paused && (
          <View style={styles.pauseOverlay}>
            <Text style={styles.pauseIcon}>⏸</Text>
          </View>
        )}
      </TouchableOpacity>

      <SafeAreaView style={styles.topBar}>
        <Text style={styles.topTitle}>Reels</Text>
        <TouchableOpacity onPress={() => router.push("/CreateReel")} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="camera-outline" size={26} color="#fff" />
        </TouchableOpacity>
      </SafeAreaView>

      <View style={styles.sideBar}>
        <TouchableOpacity style={styles.sideAction} onPress={handleLike}>
          <Ionicons name={liked ? "heart" : "heart-outline"} size={28} color={liked ? "#e74c3c" : "#fff"} />
          <Text style={styles.sideCount}>{fmt(likes)}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.sideAction}
          onPress={() => item.id ? onCommentPress(item.id, () => setCommentsCount((c) => c + 1)) : undefined}
        >
          <Ionicons name="chatbubble-outline" size={26} color="#fff" />
          <Text style={styles.sideCount}>{fmt(commentsCount)}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.sideAction} onPress={handleShare}>
          <Ionicons name="paper-plane-outline" size={26} color="#fff" />
          <Text style={styles.sideCount}>{fmt(item.shares)}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.sideAction} onPress={handleSave}>
          <Ionicons name={saved ? "bookmark" : "bookmark-outline"} size={26} color="#fff" />
        </TouchableOpacity>
        <View style={styles.discWrap}>
          {item.avatar ? (
            <Image source={{ uri: item.avatar }} style={styles.disc} />
          ) : null}
          <View style={styles.discCenter} />
        </View>
      </View>

      <View style={styles.bottomInfo}>
        {item.username ? (
          <View style={styles.userRow}>
            {item.avatar ? (
              <Image source={{ uri: item.avatar }} style={styles.avatar} />
            ) : null}
            <Text style={styles.username}>{item.username}</Text>
            <TouchableOpacity style={styles.followBtn}>
              <Text style={styles.followText}>Follow</Text>
            </TouchableOpacity>
          </View>
        ) : null}
        {item.caption ? (
          <Text style={styles.caption} numberOfLines={2}>{item.caption}</Text>
        ) : null}
        {item.audio ? (
          <View style={styles.audioRow}>
            <Text style={styles.audioText}>{item.audio}</Text>
          </View>
        ) : null}
      </View>
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function ReelsScreen() {
  const [reels, setReels] = useState<Reel[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);
  const [activeReel, setActiveReel] = useState<{ id: string; onAdded: () => void } | null>(null);
  const [screenFocused, setScreenFocused] = useState(true);

  useFocusEffect(
    useCallback(() => {
      setScreenFocused(true);
      return () => setScreenFocused(false);
    }, []),
  );

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

  const displayReels = reels.length > 0 ? reels : [PLACEHOLDER_REEL];

  return (
    <View style={styles.screen}>
      <FlatList
        data={displayReels}
        keyExtractor={(item, index) => item.id || String(index)}
        renderItem={({ item, index }) => (
          <ReelItem
            item={item}
            key={index === activeIndex ? "active" : item.id}
            isActive={index === activeIndex && screenFocused}
            onCommentPress={(reelId, onAdded) => setActiveReel({ id: reelId, onAdded })}
          />
        )}
        pagingEnabled
        showsVerticalScrollIndicator={false}
        snapToInterval={H}
        decelerationRate="fast"
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        getItemLayout={(_, index) => ({ length: H, offset: H * index, index })}
      />
      <CommentsSheet
        reelId={activeReel?.id}
        visible={!!activeReel}
        onClose={() => setActiveReel(null)}
        onCommentAdded={activeReel?.onAdded}
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
