import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
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
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
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
  imageUrl?: string;
  isOwn?: boolean;
  hasStory?: boolean;
};

type ApiStory = {
  id: string;
  imageUrl: string;
  user: { id: string; username: string; avatar: string };
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
  const { colors } = useTheme();
  return (
    <TouchableOpacity
      style={styles.storyContainer}
      activeOpacity={0.7}
      onPress={() => {
        if (item.isOwn) router.push("/Camera");
        else router.push({
          pathname: "/story/[userId]",
          params: {
            userId: item.id,
            imageUrl: item.imageUrl ?? "",
            username: item.username,
            avatar: item.avatar,
          },
        });
      }}
    >
      <View style={[styles.storyRing, { borderColor: colors.storyRing }, item.isOwn && { borderColor: colors.border }]}>
        <Image source={{ uri: item.avatar }} style={[styles.storyAvatar, { borderColor: colors.background }]} />
        {item.isOwn && (
          <View style={[styles.storyAddBadge, { backgroundColor: colors.primary, borderColor: colors.background }]}>
            <Text style={{ color: "#fff", fontSize: 14, fontWeight: "700" }}>+</Text>
          </View>
        )}
      </View>
      <Text style={[styles.storyUsername, { color: colors.text }]} numberOfLines={1}>
        {item.isOwn ? "Your Story" : item.username}
      </Text>
    </TouchableOpacity>
  );
}

// ─── Post Card ────────────────────────────────────────────────────────────────

function PostCard({ post }: { post: Post }) {
  const router = useRouter();
  const { colors } = useTheme();
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
    <View style={[styles.postCard, { backgroundColor: colors.card }]}>
      <View style={styles.postHeader}>
        <TouchableOpacity
          style={styles.postHeaderLeft}
          activeOpacity={0.8}
          onPress={() => router.push({ pathname: "/user/[username]", params: { username: post.username } })}
        >
          <View style={[styles.postAvatarRing, { borderColor: colors.storyRing }]}>
            <Image source={{ uri: post.avatar }} style={styles.postAvatar} />
          </View>
          <View>
            <Text style={[styles.postUsername, { color: colors.text }]}>{post.username}</Text>
            {post.location && <Text style={[styles.postLocation, { color: colors.textSecondary }]}>{post.location}</Text>}
          </View>
        </TouchableOpacity>
        <TouchableOpacity hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Text style={[styles.moreIcon, { color: colors.text }]}>•••</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity activeOpacity={0.95} onPress={handleLike}>
        <Image source={{ uri: post.image }} style={[styles.postImage, { backgroundColor: colors.surface }]} resizeMode="cover" />
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
        <Text style={[styles.likesText, { color: colors.text }]}>{likes.toLocaleString()} likes</Text>
        <Text style={[styles.captionText, { color: colors.text }]}>
          <Text style={[styles.postUsername, { color: colors.text }]}>{post.username} </Text>
          {post.caption}
        </Text>
        <TouchableOpacity>
          <Text style={[styles.commentsLink, { color: colors.textSecondary }]}>View all {post.comments} comments</Text>
        </TouchableOpacity>
        <Text style={[styles.timeAgo, { color: colors.textSecondary }]}>{post.timeAgo}</Text>
      </View>
    </View>
  );
}

// ─── Header ───────────────────────────────────────────────────────────────────

function Header() {
  const { colors } = useTheme();
  return (
    <View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
      <Text style={[styles.logoText, { color: colors.primary }]}>Sharely</Text>
      <View style={styles.headerRight}>
        <TouchableOpacity style={styles.headerIconBtn}><Icons.Notify /></TouchableOpacity>
        <TouchableOpacity style={styles.headerIconBtn}><Icons.Messenger /></TouchableOpacity>
      </View>
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function InstagramHomeScreen() {
  const { colors, isDark } = useTheme();
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiGet<Post[]>("/posts/feed")
      .then(setPosts)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const fetchStories = useCallback(() => {
    const ownEntry: Story = {
      id: "own",
      username: "Your Story",
      avatar: user?.avatar ?? "https://i.pravatar.cc/150?img=1",
      isOwn: true,
    };
    apiGet<ApiStory[]>("/stories")
      .then((data) => {
        const mapped: Story[] = data.map((s) => ({
          id: s.id,
          username: s.user.username,
          avatar: s.user.avatar,
          imageUrl: s.imageUrl,
          hasStory: true,
        }));
        setStories([ownEntry, ...mapped]);
      })
      .catch(() => setStories([ownEntry]));
  }, [user]);

  useFocusEffect(useCallback(() => {
    fetchStories();
  }, [fetchStories]));

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={colors.background} />
      <Header />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
        {/* Stories */}
        <View style={[styles.storiesWrapper, { backgroundColor: colors.background }]}>
          <FlatList
            data={stories}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => <StoryItem item={item} />}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.storiesList}
          />
        </View>

        <View style={[styles.divider, { backgroundColor: colors.border }]} />

        {/* Posts from API */}
        {loading ? (
          <ActivityIndicator style={{ marginTop: 40 }} color={colors.primary} />
        ) : posts.length === 0 ? (
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No posts yet. Run the seed script!</Text>
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
  logoText: { fontSize: 26, fontWeight: "800", letterSpacing: 1.5 },
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
