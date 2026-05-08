import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { API_URL } from "../config/env";
import { getToken } from "../utils/api";

const { width } = Dimensions.get("window");
const ITEM_SIZE = width / 3 - 2;

type FeedPost = {
  id: string;
  image: string;
  username: string;
  avatar: string | null;
  caption: string;
  likes: number;
};

type FeedResponse = {
  posts: FeedPost[];
  nextCursor: string | null;
  feedType: "following" | "discover";
};

type SearchUser = {
  id: string;
  username: string;
  fullName: string | null;
  avatar: string | null;
  followersCount: number;
  isFollowing: boolean;
};

type Status = "idle" | "loading" | "success" | "error";

export default function ExploreScreen() {
  const { colors } = useTheme();
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  // ── Posts grid state ────────────────────────────────────────────────────────
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [postStatus, setPostStatus] = useState<Status>("idle");
  const [postError, setPostError] = useState("");

  // ── Search state ────────────────────────────────────────────────────────────
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchUser[]>([]);
  const [searchStatus, setSearchStatus] = useState<Status>("idle");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/Auth");
    }
  }, [authLoading, user, router]);

  // ── Fetch posts ─────────────────────────────────────────────────────────────
  const fetchPosts = useCallback(async () => {
    setPostStatus("loading");
    setPostError("");
    try {
      const token = await getToken();
      const res = await fetch(`${API_URL}/posts/feed?limit=60`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.status === 401) {
        router.replace("/Auth");
        return;
      }
      if (!res.ok) {
        const text = await res.text().catch(() => res.statusText);
        throw new Error(`HTTP ${res.status}: ${text}`);
      }
      const data = (await res.json()) as FeedResponse;
      if (!Array.isArray(data.posts)) {
        throw new Error("Unexpected response shape");
      }
      setPosts(data.posts.filter((p) => !!p.image));
      setPostStatus("success");
    } catch (err) {
      setPostError(err instanceof Error ? err.message : String(err));
      setPostStatus("error");
    }
  }, [router]);

  useEffect(() => {
    if (!authLoading && user) fetchPosts();
  }, [authLoading, user, fetchPosts]);

  // ── Search users (debounced) ─────────────────────────────────────────────────
  const runSearch = useCallback(
    async (q: string) => {
      if (!q.trim()) {
        setSearchResults([]);
        setSearchStatus("idle");
        return;
      }
      setSearchStatus("loading");
      try {
        const token = await getToken();
        const res = await fetch(
          `${API_URL}/users/search?q=${encodeURIComponent(q.trim())}`,
          { headers: token ? { Authorization: `Bearer ${token}` } : {} },
        );
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = (await res.json()) as SearchUser[];
        setSearchResults(data);
        setSearchStatus("success");
      } catch {
        setSearchResults([]);
        setSearchStatus("error");
      }
    },
    [],
  );

  const handleQueryChange = (text: string) => {
    setQuery(text);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => runSearch(text), 400);
  };

  // ── Follow / Unfollow ────────────────────────────────────────────────────────
  const toggleFollow = async (target: SearchUser) => {
    const token = await getToken();
    const method = target.isFollowing ? "DELETE" : "POST";
    await fetch(`${API_URL}/users/${target.id}/follow`, {
      method,
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    setSearchResults((prev) =>
      prev.map((u) =>
        u.id === target.id
          ? {
              ...u,
              isFollowing: !u.isFollowing,
              followersCount: u.isFollowing
                ? u.followersCount - 1
                : u.followersCount + 1,
            }
          : u,
      ),
    );
  };

  // ── Auth loading ─────────────────────────────────────────────────────────────
  if (authLoading) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  const showSearch = query.length > 0;

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: colors.background }]}>
      {/* Search bar */}
      <View style={[styles.searchBar, { backgroundColor: colors.surface }]}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={[styles.searchInput, { color: colors.text }]}
          placeholder="Search users..."
          placeholderTextColor={colors.textSecondary}
          value={query}
          onChangeText={handleQueryChange}
          returnKeyType="search"
          autoCapitalize="none"
          autoCorrect={false}
        />
        {query.length > 0 && (
          <TouchableOpacity
            onPress={() => {
              setQuery("");
              setSearchResults([]);
              setSearchStatus("idle");
            }}
          >
            <Text style={[styles.clearBtn, { color: colors.textSecondary }]}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Search results */}
      {showSearch ? (
        searchStatus === "loading" ? (
          <View style={styles.centered}>
            <ActivityIndicator color={colors.primary} />
          </View>
        ) : (
          <FlatList
            key="list-1col"
            data={searchResults}
            keyExtractor={(item) => item.id}
            keyboardShouldPersistTaps="handled"
            ListEmptyComponent={
              searchStatus === "success" ? (
                <View style={styles.centered}>
                  <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                    No users found for "{query}"
                  </Text>
                </View>
              ) : null
            }
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[styles.userRow, { borderBottomColor: colors.surface }]}
                activeOpacity={0.7}
                onPress={() =>
                  router.push({
                    pathname: "/user/[username]",
                    params: { username: item.username },
                  })
                }
              >
                {item.avatar ? (
                  <Image source={{ uri: item.avatar }} style={styles.avatar} />
                ) : (
                  <View style={[styles.avatar, styles.avatarFallback, { backgroundColor: colors.surface }]}>
                    <Text style={styles.avatarInitial}>
                      {(item.fullName ?? item.username).charAt(0).toUpperCase()}
                    </Text>
                  </View>
                )}
                <View style={styles.userInfo}>
                  <Text style={[styles.username, { color: colors.text }]}>
                    {item.username}
                  </Text>
                  {item.fullName ? (
                    <Text style={[styles.fullName, { color: colors.textSecondary }]}>
                      {item.fullName}
                    </Text>
                  ) : null}
                  <Text style={[styles.followers, { color: colors.textSecondary }]}>
                    {item.followersCount.toLocaleString()} followers
                  </Text>
                </View>
                <TouchableOpacity
                  style={[
                    styles.followBtn,
                    item.isFollowing
                      ? { backgroundColor: colors.surface }
                      : { backgroundColor: "#8B5CF6" },
                  ]}
                  onPress={() => toggleFollow(item)}
                >
                  <Text
                    style={[
                      styles.followBtnText,
                      { color: item.isFollowing ? colors.text : "#fff" },
                    ]}
                  >
                    {item.isFollowing ? "Following" : "Follow"}
                  </Text>
                </TouchableOpacity>
              </TouchableOpacity>
            )}
          />
        )
      ) : /* Posts grid */ postStatus === "loading" ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : postStatus === "error" ? (
        <View style={styles.centered}>
          <Text style={styles.emptyIcon}>⚠️</Text>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            {postError || "Could not load posts."}
          </Text>
          <TouchableOpacity
            style={[styles.retryBtn, { backgroundColor: colors.primary }]}
            onPress={fetchPosts}
          >
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : postStatus === "success" && posts.length === 0 ? (
        <View style={styles.centered}>
          <Text style={styles.emptyIcon}>🔍</Text>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            No posts to explore yet.
          </Text>
        </View>
      ) : (
        <FlatList
          key="grid-3col"
          data={posts}
          keyExtractor={(item) => item.id}
          numColumns={3}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.gridItem}
              activeOpacity={0.85}
              onPress={() =>
                router.push({ pathname: "/post/[id]", params: { id: item.id } })
              }
            >
              <Image source={{ uri: item.image }} style={styles.gridImage} />
            </TouchableOpacity>
          )}
          ItemSeparatorComponent={() => <View style={{ height: 2 }} />}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    margin: 10,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  searchIcon: { fontSize: 14, marginRight: 6 },
  searchInput: { flex: 1, fontSize: 14, paddingVertical: 0 },
  clearBtn: { fontSize: 14, paddingHorizontal: 4 },
  // User row
  userRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  avatar: { width: 48, height: 48, borderRadius: 24 },
  avatarFallback: { alignItems: "center", justifyContent: "center" },
  avatarInitial: { fontSize: 18, fontWeight: "700", color: "#8B5CF6" },
  userInfo: { flex: 1, marginLeft: 12 },
  username: { fontWeight: "700", fontSize: 14 },
  fullName: { fontSize: 13, marginTop: 1 },
  followers: { fontSize: 12, marginTop: 2 },
  followBtn: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 8,
    minWidth: 90,
    alignItems: "center",
  },
  followBtnText: { fontWeight: "700", fontSize: 13 },
  // Grid
  gridItem: {
    width: ITEM_SIZE,
    height: ITEM_SIZE,
    marginHorizontal: 1,
  },
  gridImage: { width: "100%", height: "100%" },
  emptyIcon: { fontSize: 48 },
  emptyText: { fontSize: 15, textAlign: "center", paddingHorizontal: 32 },
  retryBtn: {
    paddingHorizontal: 28,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 4,
  },
  retryText: { color: "#fff", fontWeight: "700", fontSize: 15 },
});
