import React, { useCallback, useRef, useState } from "react";
import {
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

const { width: W, height: H } = Dimensions.get("window");

// ─── Mock Data ────────────────────────────────────────────────────────────────
// Using static images to simulate reels (no video dependency needed)

const REELS = [
  {
    id: "1",
    username: "alex.photo",
    avatar: "https://i.pravatar.cc/150?img=2",
    caption: "Golden hour vibes in Paris 🌅 #travel #paris #photography",
    audio: "🎵 Lofi Chill — Autumn Breeze",
    thumbnail: "https://picsum.photos/seed/reel1/600/1000",
    likes: 48200,
    comments: 312,
    shares: 98,
    isLiked: false,
    isSaved: false,
  },
  {
    id: "2",
    username: "nina_food",
    avatar: "https://i.pravatar.cc/150?img=7",
    caption: "Homemade pasta in 10 minutes 🍝 Recipe in bio!",
    audio: "🎵 Italian Vibes — Cooking Hour",
    thumbnail: "https://picsum.photos/seed/reel2/600/1000",
    likes: 91800,
    comments: 744,
    shares: 2100,
    isLiked: true,
    isSaved: false,
  },
  {
    id: "3",
    username: "john_travels",
    avatar: "https://i.pravatar.cc/150?img=4",
    caption: "Bali hidden waterfall 🌿 No tourists = pure magic",
    audio: "🎵 Jungle Sounds — Nature Mix",
    thumbnail: "https://picsum.photos/seed/reel3/600/1000",
    likes: 23400,
    comments: 189,
    shares: 560,
    isLiked: false,
    isSaved: true,
  },
  {
    id: "4",
    username: "maria_art",
    avatar: "https://i.pravatar.cc/150?img=3",
    caption: "New digital art piece — 72 hours of work 🎨✨",
    audio: "🎵 Ambient Dreams — Vol.3",
    thumbnail: "https://picsum.photos/seed/reel4/600/1000",
    likes: 67000,
    comments: 430,
    shares: 1200,
    isLiked: false,
    isSaved: false,
  },
  {
    id: "5",
    username: "dev.mike",
    avatar: "https://i.pravatar.cc/150?img=6",
    caption: "Built this in React Native in 2 hours 🚀 #coding #reactnative",
    audio: "🎵 Focus Mode — Deep Work",
    thumbnail: "https://picsum.photos/seed/reel5/600/1000",
    likes: 15600,
    comments: 892,
    shares: 3400,
    isLiked: true,
    isSaved: true,
  },
];

// ─── Format numbers ───────────────────────────────────────────────────────────

function fmt(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return String(n);
}

// ─── Single Reel Item ─────────────────────────────────────────────────────────

function ReelItem({
  item,
  isActive,
}: {
  item: (typeof REELS)[0];
  isActive: boolean;
}) {
  const [liked, setLiked] = useState(item.isLiked);
  const [saved, setSaved] = useState(item.isSaved);
  const [likes, setLikes] = useState(item.likes);
  const [paused, setPaused] = useState(false);

  const handleLike = () => {
    setLiked(!liked);
    setLikes((prev) => (liked ? prev - 1 : prev + 1));
  };

  return (
    <View style={styles.reelContainer}>
      {/* Background thumbnail */}
      <TouchableOpacity
        style={StyleSheet.absoluteFill}
        activeOpacity={1}
        onPress={() => setPaused(!paused)}
      >
        <Image
          source={{ uri: item.thumbnail }}
          style={StyleSheet.absoluteFill}
          resizeMode="cover"
        />
        {/* Dark gradient overlay */}
        <View style={styles.gradient} />

        {/* Pause indicator */}
        {paused && (
          <View style={styles.pauseOverlay}>
            <Text style={styles.pauseIcon}>⏸</Text>
          </View>
        )}
      </TouchableOpacity>

      {/* Top bar */}
      <SafeAreaView style={styles.topBar}>
        <Text style={styles.topTitle}>Reels</Text>
        <TouchableOpacity>
          <Text style={styles.cameraIcon}>📷</Text>
        </TouchableOpacity>
      </SafeAreaView>

      {/* Right action bar */}
      <View style={styles.sideBar}>
        {/* Like */}
        <TouchableOpacity style={styles.sideAction} onPress={handleLike}>
          <Text style={styles.sideIcon}>{liked ? "❤️" : "🤍"}</Text>
          <Text style={styles.sideCount}>{fmt(likes)}</Text>
        </TouchableOpacity>

        {/* Comment */}
        <TouchableOpacity style={styles.sideAction}>
          <Text style={styles.sideIcon}>💬</Text>
          <Text style={styles.sideCount}>{fmt(item.comments)}</Text>
        </TouchableOpacity>

        {/* Share */}
        <TouchableOpacity style={styles.sideAction}>
          <Text style={styles.sideIcon}>📤</Text>
          <Text style={styles.sideCount}>{fmt(item.shares)}</Text>
        </TouchableOpacity>

        {/* Save */}
        <TouchableOpacity
          style={styles.sideAction}
          onPress={() => setSaved(!saved)}
        >
          <Text style={styles.sideIcon}>{saved ? "🔖" : "🏷️"}</Text>
        </TouchableOpacity>

        {/* More */}
        <TouchableOpacity style={styles.sideAction}>
          <Text style={styles.sideIcon}>⋮</Text>
        </TouchableOpacity>

        {/* Audio disc */}
        <View style={styles.discWrap}>
          <Image source={{ uri: item.avatar }} style={styles.disc} />
          <View style={styles.discCenter} />
        </View>
      </View>

      {/* Bottom info */}
      <View style={styles.bottomInfo}>
        {/* User row */}
        <View style={styles.userRow}>
          <Image source={{ uri: item.avatar }} style={styles.avatar} />
          <Text style={styles.username}>{item.username}</Text>
          <TouchableOpacity style={styles.followBtn}>
            <Text style={styles.followText}>Follow</Text>
          </TouchableOpacity>
        </View>

        {/* Caption */}
        <Text style={styles.caption} numberOfLines={2}>
          {item.caption}
        </Text>

        {/* Audio */}
        <View style={styles.audioRow}>
          <Text style={styles.audioText}>{item.audio}</Text>
        </View>
      </View>
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function ReelsScreen() {
  const [activeIndex, setActiveIndex] = useState(0);

  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0) {
        setActiveIndex(viewableItems[0].index ?? 0);
      }
    },
    [],
  );

  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 60 }).current;

  return (
    <View style={styles.screen}>
      <FlatList
        data={REELS}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => (
          <ReelItem item={item} isActive={index === activeIndex} />
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

  reelContainer: {
    width: W,
    height: H,
    backgroundColor: "#000",
  },

  gradient: {
    ...StyleSheet.absoluteFillObject,
    backgroundBlendMode: "transparent",
    // Simulated bottom gradient via a semi-transparent overlay
    backgroundColor: "rgba(0,0,0,0.18)",
  },

  pauseOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
  pauseIcon: { fontSize: 64, opacity: 0.8 },

  // Top bar
  topBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 18,
    paddingTop: 4,
    zIndex: 10,
  },
  topTitle: { color: "#fff", fontSize: 18, fontWeight: "700" },
  cameraIcon: { fontSize: 24, color: "#fff" },

  // Side bar
  sideBar: {
    position: "absolute",
    right: 12,
    bottom: 120,
    alignItems: "center",
    gap: 18,
  },
  sideAction: { alignItems: "center", gap: 4 },
  sideIcon: { fontSize: 28 },
  sideCount: { color: "#fff", fontSize: 12, fontWeight: "600" },

  discWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: "#fff",
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 6,
  },
  disc: { width: 44, height: 44, borderRadius: 22 },
  discCenter: {
    position: "absolute",
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#262626",
    borderWidth: 1,
    borderColor: "#555",
  },

  // Bottom info
  bottomInfo: {
    position: "absolute",
    bottom: 70,
    left: 0,
    right: 80,
    paddingHorizontal: 16,
    gap: 8,
  },
  userRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1.5,
    borderColor: "#fff",
  },
  username: { color: "#fff", fontWeight: "700", fontSize: 14 },
  followBtn: {
    borderWidth: 1.5,
    borderColor: "#fff",
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 3,
  },
  followText: { color: "#fff", fontSize: 12, fontWeight: "600" },
  caption: { color: "#fff", fontSize: 13.5, lineHeight: 19 },
  audioRow: { flexDirection: "row", alignItems: "center" },
  audioText: { color: "#fff", fontSize: 12, opacity: 0.85 },
});
