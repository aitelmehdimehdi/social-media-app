import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Dimensions,
  FlatList,
  Image,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

// ─── Mock Data ────────────────────────────────────────────────────────────────

const STORIES = [
  {
    id: "0",
    username: "Your Story",
    avatar: "https://i.pravatar.cc/150?img=1",
    isOwn: true,
  },
  {
    id: "1",
    username: "alex.photo",
    avatar: "https://i.pravatar.cc/150?img=2",
    hasStory: true,
  },
  {
    id: "2",
    username: "maria_art",
    avatar: "https://i.pravatar.cc/150?img=3",
    hasStory: true,
  },
  {
    id: "3",
    username: "john_travels",
    avatar: "https://i.pravatar.cc/150?img=4",
    hasStory: true,
  },
  {
    id: "4",
    username: "sophie.k",
    avatar: "https://i.pravatar.cc/150?img=5",
    hasStory: true,
  },
  {
    id: "5",
    username: "dev.mike",
    avatar: "https://i.pravatar.cc/150?img=6",
    hasStory: true,
  },
  {
    id: "6",
    username: "nina_food",
    avatar: "https://i.pravatar.cc/150?img=7",
    hasStory: true,
  },
];

const POSTS = [
  {
    id: "1",
    username: "alex.photo",
    avatar: "https://i.pravatar.cc/150?img=2",
    location: "Paris, France",
    image: "https://picsum.photos/seed/paris/600/600",
    likes: 1284,
    caption: "Golden hour in the city of lights ✨",
    comments: 42,
    timeAgo: "2 hours ago",
    isLiked: false,
    isSaved: false,
  },
  {
    id: "2",
    username: "maria_art",
    avatar: "https://i.pravatar.cc/150?img=3",
    location: "New York, USA",
    image: "https://picsum.photos/seed/art/600/600",
    likes: 3401,
    caption: "New piece just dropped 🎨 Let me know what you think!",
    comments: 118,
    timeAgo: "4 hours ago",
    isLiked: true,
    isSaved: false,
  },
  {
    id: "3",
    username: "john_travels",
    avatar: "https://i.pravatar.cc/150?img=4",
    location: "Bali, Indonesia",
    image: "https://picsum.photos/seed/bali/600/600",
    likes: 892,
    caption: "Every sunrise is a new beginning 🌅 #travel #bali",
    comments: 27,
    timeAgo: "6 hours ago",
    isLiked: false,
    isSaved: true,
  },
];

// ─── SVG Icons (inline via Text for zero dependencies) ───────────────────────
// Using unicode / emoji substitutes for real icons

const Icons = {
  Home: () => <Text style={styles.tabIcon}>🏠</Text>,
  Search: () => <Text style={styles.tabIcon}>🔍</Text>,
  Reels: () => <Text style={styles.tabIcon}>▶️</Text>,
  Shop: () => <Text style={styles.tabIcon}>🛍️</Text>,
  Profile: () => <Text style={styles.tabIcon}>👤</Text>,
  Heart: ({ filled }: { filled: any }) => (
    <Text style={styles.actionIcon}>{filled ? "❤️" : "🤍"}</Text>
  ),
  Comment: () => <Text style={styles.actionIcon}>💬</Text>,
  Share: () => <Text style={styles.actionIcon}>📤</Text>,
  Bookmark: ({ filled }: { filled: any }) => (
    <Text style={styles.actionIcon}>{filled ? "🔖" : "🏷️"}</Text>
  ),
  Messenger: () => (
    <Text style={[styles.headerIcon, { fontSize: 22 }]}>✈️</Text>
  ),
  Notify: () => <Text style={[styles.headerIcon, { fontSize: 22 }]}>🔔</Text>,
  Plus: () => <Text style={{ fontSize: 22, color: "#000" }}>＋</Text>,
};

// ─── Story Item ───────────────────────────────────────────────────────────────

function StoryItem({ item }: { item: (typeof STORIES)[0] }) {
  const router = useRouter();

  const handlePress = () => {
    if (item.isOwn) {
      // ✅ Ouvre la caméra pour "Your Story"
      router.push("/Camera");
    } else {
      // Voir la story d'un autre utilisateur (à implémenter)
      console.log("View story of", item.username);
    }
  };

  return (
    <TouchableOpacity
      style={styles.storyContainer}
      activeOpacity={0.7}
      onPress={handlePress} // ← handlePress ici
    >
      <View style={[styles.storyRing, item.isOwn && styles.storyRingNone]}>
        <Image source={{ uri: item.avatar }} style={styles.storyAvatar} />
        {item.isOwn && (
          <View style={styles.storyAddBadge}>
            <Text style={{ color: "#fff", fontSize: 14, fontWeight: "700" }}>
              +
            </Text>
          </View>
        )}
      </View>
      <Text style={styles.storyUsername} numberOfLines={1}>
        {item.isOwn ? "Your Story" : item.username}
      </Text>
    </TouchableOpacity>
  );
}

// ─── Post Card ────────────────────────────────────────────────────────────────

function PostCard({ post }: { post: any }) {
  const [liked, setLiked] = useState(post.isLiked);
  const [saved, setSaved] = useState(post.isSaved);
  const [likes, setLikes] = useState(post.likes);

  const handleLike = () => {
    setLiked(!liked);
    setLikes(({ prev }: { prev: any }) => (liked ? prev - 1 : prev + 1));
  };

  return (
    <View style={styles.postCard}>
      {/* Post Header */}
      <View style={styles.postHeader}>
        <TouchableOpacity style={styles.postHeaderLeft} activeOpacity={0.8}>
          <View style={styles.postAvatarRing}>
            <Image source={{ uri: post.avatar }} style={styles.postAvatar} />
          </View>
          <View>
            <Text style={styles.postUsername}>{post.username}</Text>
            {post.location && (
              <Text style={styles.postLocation}>{post.location}</Text>
            )}
          </View>
        </TouchableOpacity>
        <TouchableOpacity
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={styles.moreIcon}>•••</Text>
        </TouchableOpacity>
      </View>

      {/* Post Image */}
      <TouchableOpacity activeOpacity={0.95} onPress={handleLike}>
        <Image
          source={{ uri: post.image }}
          style={styles.postImage}
          resizeMode="cover"
        />
      </TouchableOpacity>

      {/* Action Bar */}
      <View style={styles.actionBar}>
        <View style={styles.actionLeft}>
          <TouchableOpacity onPress={handleLike} style={styles.actionBtn}>
            <Icons.Heart filled={liked} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn}>
            <Icons.Comment />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn}>
            <Icons.Share />
          </TouchableOpacity>
        </View>
        <TouchableOpacity
          onPress={() => setSaved(!saved)}
          style={styles.actionBtn}
        >
          <Icons.Bookmark filled={saved} />
        </TouchableOpacity>
      </View>

      {/* Likes */}
      <View style={styles.postMeta}>
        <Text style={styles.likesText}>{likes.toLocaleString()} likes</Text>

        {/* Caption */}
        <Text style={styles.captionText}>
          <Text style={styles.postUsername}>{post.username} </Text>
          {post.caption}
        </Text>

        {/* Comments */}
        <TouchableOpacity>
          <Text style={styles.commentsLink}>
            View all {post.comments} comments
          </Text>
        </TouchableOpacity>

        {/* Time */}
        <Text style={styles.timeAgo}>{post.timeAgo}</Text>
      </View>
    </View>
  );
}

// ─── Header ───────────────────────────────────────────────────────────────────

function Header() {
  return (
    <View style={styles.header}>
      {/* Instagram wordmark (styled text as substitute) */}
      <Text style={styles.logoText}>Instagram</Text>
      <View style={styles.headerRight}>
        <TouchableOpacity style={styles.headerIconBtn}>
          <Icons.Notify />
        </TouchableOpacity>
        <TouchableOpacity style={styles.headerIconBtn}>
          <Icons.Messenger />
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── Bottom Tab Bar ───────────────────────────────────────────────────────────

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function InstagramHomeScreen() {
  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      <Header />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 20 }}
      >
        {/* Stories */}
        <View style={styles.storiesWrapper}>
          <FlatList
            data={STORIES}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => <StoryItem item={item} />}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.storiesList}
          />
        </View>

        {/* Divider */}
        <View style={styles.divider} />

        {/* Posts */}
        {POSTS.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#fff",
  },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: "#dbdbdb",
    backgroundColor: "#fff",
  },
  logoText: {
    fontFamily: "serif", // Replace with Billabong / Grand Hotel via expo-font
    fontSize: 28,
    fontWeight: "600",
    color: "#000",
    letterSpacing: -0.5,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  headerIconBtn: {
    padding: 6,
  },
  headerIcon: {
    fontSize: 24,
    color: "#000",
  },

  // Stories
  storiesWrapper: {
    backgroundColor: "#fff",
  },
  storiesList: {
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  storyContainer: {
    alignItems: "center",
    marginHorizontal: 6,
    width: 66,
  },
  storyRing: {
    width: 66,
    height: 66,
    borderRadius: 33,
    padding: 2,
    backgroundBlendMode: "transparent",
    borderWidth: 2.5,
    borderColor: "transparent",
    // Instagram gradient ring — achieved via a wrapper trick in RN:
    // For a real gradient ring, use react-native-linear-gradient
    borderStyle: "solid",
    // Simulate gradient with a solid color for this demo:
    borderBlockColor: "#c13584",
  },
  storyRingNone: {
    borderColor: "#dbdbdb",
  },
  storyAvatar: {
    width: 57,
    height: 57,
    borderRadius: 28.5,
    borderWidth: 2,
    borderColor: "#fff",
  },
  storyAddBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#0095f6",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "#fff",
  },
  storyUsername: {
    fontSize: 11,
    color: "#262626",
    marginTop: 5,
    textAlign: "center",
    maxWidth: 66,
  },

  divider: {
    height: 0.5,
    backgroundColor: "#dbdbdb",
  },

  // Post
  postCard: {
    backgroundColor: "#fff",
    marginBottom: 4,
  },
  postHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  postHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  postAvatarRing: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1.5,
    borderColor: "#c13584",
    padding: 1,
  },
  postAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  postUsername: {
    fontSize: 13.5,
    fontWeight: "600",
    color: "#262626",
  },
  postLocation: {
    fontSize: 11,
    color: "#262626",
    marginTop: 1,
  },
  moreIcon: {
    fontSize: 16,
    fontWeight: "700",
    color: "#262626",
    letterSpacing: 1,
  },
  postImage: {
    width: SCREEN_WIDTH,
    height: SCREEN_WIDTH,
    backgroundColor: "#f0f0f0",
  },

  // Actions
  actionBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 4,
  },
  actionLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  actionBtn: {
    padding: 4,
    marginRight: 4,
  },
  actionIcon: {
    fontSize: 24,
  },
  tabIcon: {
    fontSize: 24,
  },

  // Post Meta
  postMeta: {
    paddingHorizontal: 14,
    paddingBottom: 14,
    gap: 2,
  },
  likesText: {
    fontSize: 13.5,
    fontWeight: "600",
    color: "#262626",
    marginBottom: 2,
  },
  captionText: {
    fontSize: 13.5,
    color: "#262626",
    lineHeight: 18,
    marginBottom: 3,
  },
  commentsLink: {
    fontSize: 13,
    color: "#8e8e8e",
    marginBottom: 3,
  },
  timeAgo: {
    fontSize: 11,
    color: "#8e8e8e",
    textTransform: "uppercase",
    letterSpacing: 0.3,
    marginTop: 2,
  },

  // Tab Bar
  tabBar: {
    flexDirection: "row",
    borderTopWidth: 0.5,
    borderTopColor: "#dbdbdb",
    backgroundColor: "#fff",
    paddingBottom: 4,
  },
  tabItem: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 10,
  },
  tabIconWrap: {
    padding: 4,
    borderRadius: 8,
  },
  tabIconActive: {
    // Slightly scale up active icon
    transform: [{ scale: 1.1 }],
  },
});
