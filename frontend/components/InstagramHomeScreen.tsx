import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
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
import { apiGet, apiPost } from "../utils/api";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

// ─── Static mock data (commented out — replaced by API) ───────────────────────
// const STORIES = [ ... ];
// const POSTS = [ ... ];

// ─── Types ────────────────────────────────────────────────────────────────────

type Story = {
  id: string;
  username: string;
  avatar: string;
  isOwn?: boolean;
  hasStory?: boolean;
};

type Post = {
  id: string;
  username: string;
  avatar: string;
  location: string;
  image: string;
  likes: number;
  caption: string;
  comments: number;
  timeAgo: string;
  isLiked: boolean;
  isSaved: boolean;
};

// ─── Static stories (kept as-is — stories feature not implemented yet) ────────
const STORIES: Story[] = [
  { id: "0", username: "Your Story", avatar: "https://i.pravatar.cc/150?img=1", isOwn: true },
  { id: "1", username: "alex.photo", avatar: "https://i.pravatar.cc/150?img=2", hasStory: true },
  { id: "2", username: "maria_art", avatar: "https://i.pravatar.cc/150?img=3", hasStory: true },
  { id: "3", username: "john_travels", avatar: "https://i.pravatar.cc/150?img=4", hasStory: true },
];

// ─── Icons ────────────────────────────────────────────────────────────────────

const Icons = {
  Heart: ({ filled }: { filled: boolean }) => (
    <Text style={styles.actionIcon}>{filled ? "❤️" : "🤍"}</Text>
  ),
  Comment: () => <Text style={styles.actionIcon}>💬</Text>,
  Share: () => <Text style={styles.actionIcon}>📤</Text>,
  Bookmark: ({ filled }: { filled: boolean }) => (
    <Text style={styles.actionIcon}>{filled ? "🔖" : "🏷️"}</Text>
  ),
  Messenger: () => <Text style={[styles.headerIcon, { fontSize: 22 }]}>✈️</Text>,
  Notify: () => <Text style={[styles.headerIcon, { fontSize: 22 }]}>🔔</Text>,
};

// ─── Story Item ───────────────────────────────────────────────────────────────

function StoryItem({ item }: { item: Story }) {
  const router = useRouter();
  return (
    <TouchableOpacity
      style={styles.storyContainer}
      activeOpacity={0.7}
      onPress={() => item.isOwn && router.push("/Camera")}
    >
      <View style={[styles.storyRing, item.isOwn && styles.storyRingNone]}>
        <Image source={{ uri: item.avatar }} style={styles.storyAvatar} />
        {item.isOwn && (
          <View style={styles.storyAddBadge}>
            <Text style={{ color: "#fff", fontSize: 14, fontWeight: "700" }}>+</Text>
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

function PostCard({ post }: { post: Post }) {
  const [liked, setLiked] = useState(post.isLiked);
  const [saved, setSaved] = useState(post.isSaved);
  const [likes, setLikes] = useState(post.likes);

  const handleLike = async () => {
    const next = !liked;
    setLiked(next);
    setLikes((prev) => (next ? prev + 1 : prev - 1));
    try {
      await apiPost(`/posts/${post.id}/like`);
    } catch (_) {
      setLiked(!next);
      setLikes((prev) => (next ? prev - 1 : prev + 1));
    }
  };

  return (
    <View style={styles.postCard}>
      <View style={styles.postHeader}>
        <TouchableOpacity style={styles.postHeaderLeft} activeOpacity={0.8}>
          <View style={styles.postAvatarRing}>
            <Image source={{ uri: post.avatar }} style={styles.postAvatar} />
          </View>
          <View>
            <Text style={styles.postUsername}>{post.username}</Text>
            {post.location && <Text style={styles.postLocation}>{post.location}</Text>}
          </View>
        </TouchableOpacity>
        <TouchableOpacity hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Text style={styles.moreIcon}>•••</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity activeOpacity={0.95} onPress={handleLike}>
        <Image source={{ uri: post.image }} style={styles.postImage} resizeMode="cover" />
      </TouchableOpacity>

      <View style={styles.actionBar}>
        <View style={styles.actionLeft}>
          <TouchableOpacity onPress={handleLike} style={styles.actionBtn}>
            <Icons.Heart filled={liked} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn}><Icons.Comment /></TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn}><Icons.Share /></TouchableOpacity>
        </View>
        <TouchableOpacity onPress={() => setSaved(!saved)} style={styles.actionBtn}>
          <Icons.Bookmark filled={saved} />
        </TouchableOpacity>
      </View>

      <View style={styles.postMeta}>
        <Text style={styles.likesText}>{likes.toLocaleString()} likes</Text>
        <Text style={styles.captionText}>
          <Text style={styles.postUsername}>{post.username} </Text>
          {post.caption}
        </Text>
        <TouchableOpacity>
          <Text style={styles.commentsLink}>View all {post.comments} comments</Text>
        </TouchableOpacity>
        <Text style={styles.timeAgo}>{post.timeAgo}</Text>
      </View>
    </View>
  );
}

// ─── Header ───────────────────────────────────────────────────────────────────

function Header() {
  return (
    <View style={styles.header}>
      <Text style={styles.logoText}>Instagram</Text>
      <View style={styles.headerRight}>
        <TouchableOpacity style={styles.headerIconBtn}><Icons.Notify /></TouchableOpacity>
        <TouchableOpacity style={styles.headerIconBtn}><Icons.Messenger /></TouchableOpacity>
      </View>
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function InstagramHomeScreen() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiGet<Post[]>("/posts/feed")
      .then(setPosts)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <Header />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
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

        <View style={styles.divider} />

        {/* Posts from API */}
        {loading ? (
          <ActivityIndicator style={{ marginTop: 40 }} color="#0095f6" />
        ) : posts.length === 0 ? (
          <Text style={styles.emptyText}>No posts yet. Run the seed script!</Text>
        ) : (
          posts.map((post) => <PostCard key={post.id} post={post} />)
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#fff" },
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 0.5,
    borderBottomColor: "#dbdbdb", backgroundColor: "#fff",
  },
  logoText: { fontFamily: "serif", fontSize: 28, fontWeight: "600", color: "#000", letterSpacing: -0.5 },
  headerRight: { flexDirection: "row", alignItems: "center", gap: 6 },
  headerIconBtn: { padding: 6 },
  headerIcon: { fontSize: 24, color: "#000" },
  storiesWrapper: { backgroundColor: "#fff" },
  storiesList: { paddingHorizontal: 12, paddingVertical: 10 },
  storyContainer: { alignItems: "center", marginHorizontal: 6, width: 66 },
  storyRing: {
    width: 66, height: 66, borderRadius: 33, padding: 2, borderWidth: 2.5,
    borderColor: "#c13584", borderStyle: "solid",
  },
  storyRingNone: { borderColor: "#dbdbdb" },
  storyAvatar: { width: 57, height: 57, borderRadius: 28.5, borderWidth: 2, borderColor: "#fff" },
  storyAddBadge: {
    position: "absolute", bottom: 0, right: 0, width: 20, height: 20,
    borderRadius: 10, backgroundColor: "#0095f6", alignItems: "center",
    justifyContent: "center", borderWidth: 1.5, borderColor: "#fff",
  },
  storyUsername: { fontSize: 11, color: "#262626", marginTop: 5, textAlign: "center", maxWidth: 66 },
  divider: { height: 0.5, backgroundColor: "#dbdbdb" },
  postCard: { backgroundColor: "#fff", marginBottom: 4 },
  postHeader: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 12, paddingVertical: 10,
  },
  postHeaderLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  postAvatarRing: { width: 34, height: 34, borderRadius: 17, borderWidth: 1.5, borderColor: "#c13584", padding: 1 },
  postAvatar: { width: 28, height: 28, borderRadius: 14 },
  postUsername: { fontSize: 13.5, fontWeight: "600", color: "#262626" },
  postLocation: { fontSize: 11, color: "#262626", marginTop: 1 },
  moreIcon: { fontSize: 16, fontWeight: "700", color: "#262626", letterSpacing: 1 },
  postImage: { width: SCREEN_WIDTH, height: SCREEN_WIDTH, backgroundColor: "#f0f0f0" },
  actionBar: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 12, paddingTop: 10, paddingBottom: 4,
  },
  actionLeft: { flexDirection: "row", alignItems: "center", gap: 4 },
  actionBtn: { padding: 4, marginRight: 4 },
  actionIcon: { fontSize: 24 },
  postMeta: { paddingHorizontal: 14, paddingBottom: 14, gap: 2 },
  likesText: { fontSize: 13.5, fontWeight: "600", color: "#262626", marginBottom: 2 },
  captionText: { fontSize: 13.5, color: "#262626", lineHeight: 18, marginBottom: 3 },
  commentsLink: { fontSize: 13, color: "#8e8e8e", marginBottom: 3 },
  timeAgo: { fontSize: 11, color: "#8e8e8e", textTransform: "uppercase", letterSpacing: 0.3, marginTop: 2 },
  emptyText: { textAlign: "center", color: "#8e8e8e", marginTop: 60, fontSize: 14 },
});
