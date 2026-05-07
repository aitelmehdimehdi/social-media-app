import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { ResizeMode, Video } from "expo-av";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { API_URL } from "../config/env";
import { apiDelete, apiGet, apiPost, getToken } from "../utils/api";
import AvatarImage from "./AvatarImage";

const { width: W, height: H } = Dimensions.get("window");

type PostData = {
  id: string;
  username: string;
  avatar: string | null;
  userId: string;
  location?: string;
  image: string;
  videoUrl?: string | null;
  likes: number;
  caption: string;
  comments: number;
  timeAgo: string;
  isLiked: boolean;
  audio?: string;
  shares?: number;
};

type CommentData = {
  id: string;
  username: string;
  avatar: string | null;
  content: string;
  likes: number;
  isLiked: boolean;
  timeAgo: string;
  parentId: string | null;
  replies: CommentData[];
};

// ─── Post layout ──────────────────────────────────────────────────────────────

function PostLayout({ post, comments, liked, likes, onLike, onComment, commentText, setCommentText, submitting, inputRef, colors }: {
  post: PostData;
  comments: CommentData[];
  liked: boolean;
  likes: number;
  onLike: () => void;
  onComment: () => void;
  commentText: string;
  setCommentText: (v: string) => void;
  submitting: boolean;
  inputRef: React.RefObject<TextInput>;
  colors: ReturnType<typeof import("../context/ThemeContext").useTheme>["colors"];
}) {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const header = (
    <View>
      {/* Post header */}
      <View style={[styles.postHeader, { borderBottomColor: colors.border }]}>
        <TouchableOpacity
          style={styles.userRow}
          activeOpacity={0.7}
          onPress={() => router.push({ pathname: "/user/[username]", params: { username: post.username } })}
        >
          <AvatarImage uri={post.avatar} size={36} />
          <View style={styles.userMeta}>
            <Text style={[styles.username, { color: colors.text }]}>{post.username}</Text>
            {!!post.location && (
              <Text style={[styles.location, { color: colors.textSecondary }]}>{post.location}</Text>
            )}
          </View>
        </TouchableOpacity>
        <Ionicons name="ellipsis-horizontal" size={20} color={colors.text} />
      </View>

      {/* Image */}
      <Image source={{ uri: post.image }} style={styles.postImage} resizeMode="cover" />

      {/* Action bar */}
      <View style={[styles.actionBar, { borderBottomColor: colors.border }]}>
        <View style={styles.actionLeft}>
          <TouchableOpacity onPress={onLike} activeOpacity={0.7} style={styles.actionBtn}>
            <Ionicons
              name={liked ? "heart" : "heart-outline"}
              size={26}
              color={liked ? "#e74c3c" : colors.text}
            />
          </TouchableOpacity>
          <TouchableOpacity
            activeOpacity={0.7}
            style={styles.actionBtn}
            onPress={() => inputRef.current?.focus()}
          >
            <Ionicons name="chatbubble-outline" size={24} color={colors.text} />
          </TouchableOpacity>
          <TouchableOpacity activeOpacity={0.7} style={styles.actionBtn}>
            <Ionicons name="paper-plane-outline" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>
        <TouchableOpacity activeOpacity={0.7}>
          <Ionicons name="bookmark-outline" size={24} color={colors.text} />
        </TouchableOpacity>
      </View>

      {/* Meta */}
      <View style={styles.meta}>
        <Text style={[styles.likesCount, { color: colors.text }]}>
          {likes.toLocaleString()} likes
        </Text>
        {!!post.caption && (
          <Text style={[styles.caption, { color: colors.text }]}>
            <Text style={styles.captionUser}>{post.username} </Text>
            {post.caption}
          </Text>
        )}
        <Text style={[styles.timeAgo, { color: colors.textSecondary }]}>{post.timeAgo}</Text>
      </View>

      {/* Comments header */}
      {comments.length > 0 && (
        <View style={[styles.commentsHeader, { borderTopColor: colors.border }]}>
          <Text style={[styles.commentsLabel, { color: colors.textSecondary }]}>
            {comments.length} comment{comments.length !== 1 ? "s" : ""}
          </Text>
        </View>
      )}
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={insets.bottom}
    >
      <FlatList
        data={comments}
        keyExtractor={(c) => c.id}
        ListHeaderComponent={header}
        renderItem={({ item }) => (
          <View style={[styles.commentRow, { borderBottomColor: colors.border }]}>
            <AvatarImage uri={item.avatar} size={32} />
            <View style={styles.commentBody}>
              <Text style={[styles.commentText, { color: colors.text }]}>
                <Text style={styles.captionUser}>{item.username} </Text>
                {item.content}
              </Text>
              <Text style={[styles.commentTime, { color: colors.textSecondary }]}>
                {item.timeAgo}
              </Text>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <Text style={[styles.noComments, { color: colors.textSecondary }]}>
            No comments yet. Be the first!
          </Text>
        }
        contentContainerStyle={{ paddingBottom: 16 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      />

      {/* Comment input */}
      <View style={[styles.inputBar, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
        <TextInput
          ref={inputRef}
          style={[styles.commentInput, { color: colors.text, backgroundColor: colors.inputBg }]}
          placeholder="Add a comment..."
          placeholderTextColor={colors.textSecondary}
          value={commentText}
          onChangeText={setCommentText}
          returnKeyType="send"
          onSubmitEditing={onComment}
          multiline
        />
        <TouchableOpacity
          onPress={onComment}
          disabled={submitting || !commentText.trim()}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          {submitting ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <Text style={[styles.postBtn, { color: commentText.trim() ? colors.primary : colors.textSecondary }]}>
              Post
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

// ─── Reel layout ──────────────────────────────────────────────────────────────

function ReelLayout({ post, liked, likes, onLike, onComment, commentText, setCommentText, submitting, showComments, setShowComments, comments, inputRef, colors, videoRef }: {
  post: PostData;
  liked: boolean;
  likes: number;
  onLike: () => void;
  onComment: () => void;
  commentText: string;
  setCommentText: (v: string) => void;
  submitting: boolean;
  showComments: boolean;
  setShowComments: (v: boolean) => void;
  comments: CommentData[];
  inputRef: React.RefObject<TextInput>;
  colors: ReturnType<typeof import("../context/ThemeContext").useTheme>["colors"];
  videoRef: React.RefObject<Video>;
}) {
  const router = useRouter();

  return (
    <View style={styles.reelContainer}>
      {post.videoUrl ? (
        <Video
          ref={videoRef}
          source={{ uri: post.videoUrl }}
          style={StyleSheet.absoluteFill}
          resizeMode={ResizeMode.COVER}
          shouldPlay
          isLooping
          isMuted={false}
        />
      ) : (
        <Image source={{ uri: post.image }} style={StyleSheet.absoluteFill} resizeMode="cover" />
      )}
      <View style={[StyleSheet.absoluteFill, styles.reelOverlay]} />

      {/* Side bar */}
      <View style={styles.reelSidebar}>
        <TouchableOpacity style={styles.reelSideBtn} onPress={onLike} activeOpacity={0.7}>
          <Ionicons name={liked ? "heart" : "heart-outline"} size={28} color={liked ? "#e74c3c" : "#fff"} />
          <Text style={styles.reelSideCount}>{likes.toLocaleString()}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.reelSideBtn} onPress={() => setShowComments(true)} activeOpacity={0.7}>
          <Ionicons name="chatbubble-outline" size={26} color="#fff" />
          <Text style={styles.reelSideCount}>{post.comments}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.reelSideBtn} activeOpacity={0.7}>
          <Ionicons name="paper-plane-outline" size={26} color="#fff" />
          <Text style={styles.reelSideCount}>{post.shares ?? 0}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.reelSideBtn} activeOpacity={0.7}>
          <Ionicons name="bookmark-outline" size={26} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Bottom info */}
      <View style={styles.reelBottom}>
        <TouchableOpacity
          style={styles.reelUserRow}
          activeOpacity={0.7}
          onPress={() => router.push({ pathname: "/user/[username]", params: { username: post.username } })}
        >
          <AvatarImage uri={post.avatar} size={32} />
          <Text style={styles.reelUsername}>{post.username}</Text>
        </TouchableOpacity>
        {!!post.caption && (
          <Text style={styles.reelCaption} numberOfLines={2}>{post.caption}</Text>
        )}
        {!!post.audio && (
          <Text style={styles.reelAudio}>{post.audio}</Text>
        )}
        <Text style={styles.reelTime}>{post.timeAgo}</Text>
      </View>

      {/* Comments panel */}
      {showComments && (
        <KeyboardAvoidingView
          style={styles.commentsPanel}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <View style={[styles.commentsPanelInner, { backgroundColor: colors.card }]}>
            <View style={[styles.commentsPanelHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.commentsLabel, { color: colors.text }]}>Comments</Text>
              <TouchableOpacity onPress={() => setShowComments(false)}>
                <Ionicons name="close" size={22} color={colors.text} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={comments}
              keyExtractor={(c) => c.id}
              style={{ maxHeight: H * 0.4 }}
              renderItem={({ item }) => (
                <View style={[styles.commentRow, { borderBottomColor: colors.border }]}>
                  <AvatarImage uri={item.avatar} size={30} />
                  <View style={styles.commentBody}>
                    <Text style={[styles.commentText, { color: colors.text }]}>
                      <Text style={styles.captionUser}>{item.username} </Text>
                      {item.content}
                    </Text>
                    <Text style={[styles.commentTime, { color: colors.textSecondary }]}>
                      {item.timeAgo}
                    </Text>
                  </View>
                </View>
              )}
              ListEmptyComponent={
                <Text style={[styles.noComments, { color: colors.textSecondary }]}>
                  No comments yet.
                </Text>
              }
              keyboardShouldPersistTaps="handled"
            />
            <View style={[styles.inputBar, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
              <TextInput
                ref={inputRef}
                style={[styles.commentInput, { color: colors.text, backgroundColor: colors.inputBg }]}
                placeholder="Add a comment..."
                placeholderTextColor={colors.textSecondary}
                value={commentText}
                onChangeText={setCommentText}
                returnKeyType="send"
                onSubmitEditing={onComment}
              />
              <TouchableOpacity
                onPress={onComment}
                disabled={submitting || !commentText.trim()}
              >
                {submitting ? (
                  <ActivityIndicator size="small" color={colors.primary} />
                ) : (
                  <Text style={[styles.postBtn, { color: commentText.trim() ? colors.primary : colors.textSecondary }]}>
                    Post
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      )}
    </View>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function PostDetailScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { user } = useAuth();

  const { id, type } = useLocalSearchParams<{ id: string; type?: string }>();
  const isReel = type === "reel";

  const [post, setPost] = useState<PostData | null>(null);
  const [comments, setComments] = useState<CommentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [liked, setLiked] = useState(false);
  const [likes, setLikes] = useState(0);
  const [commentText, setCommentText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const inputRef = useRef<TextInput>(null);
  const videoRef = useRef<Video>(null);

  useFocusEffect(
    useCallback(() => {
      return () => {
        videoRef.current?.pauseAsync().catch(() => {});
      };
    }, []),
  );

  useEffect(() => {
    if (!id) return;
    const endpoint = isReel ? `/posts/reels/${id}` : `/posts/${id}`;
    Promise.all([
      apiGet<PostData>(endpoint),
      isReel ? Promise.resolve([]) : apiGet<CommentData[]>(`/posts/${id}/comments`),
    ])
      .then(([postData, commentsData]) => {
        setPost(postData);
        setLiked(postData.isLiked);
        setLikes(postData.likes);
        setComments(commentsData as CommentData[]);
      })
      .catch(() => Alert.alert("Error", "Failed to load."))
      .finally(() => setLoading(false));
  }, [id]);

  const handleLike = async () => {
    if (!id || isReel) return;
    const next = !liked;
    setLiked(next);
    setLikes((c) => c + (next ? 1 : -1));
    try {
      await apiPost(`/posts/${id}/like`, {});
    } catch {
      setLiked(!next);
      setLikes((c) => c + (next ? -1 : 1));
    }
  };

  const handleComment = async () => {
    if (!commentText.trim() || !id || isReel) return;
    setSubmitting(true);
    try {
      const saved = await apiPost<{ id: string }>(`/posts/${id}/comments`, { content: commentText.trim() });
      const newComment: CommentData = {
        id: saved.id,
        username: user?.username ?? "",
        avatar: user?.avatar ?? null,
        content: commentText.trim(),
        likes: 0,
        isLiked: false,
        timeAgo: 'just now',
        parentId: null,
        replies: [],
      };
      setComments((prev) => [...prev, newComment]);
      setPost((p) => p ? { ...p, comments: p.comments + 1 } : p);
      setCommentText("");
    } catch {
      Alert.alert("Error", "Failed to post comment.");
    } finally {
      setSubmitting(false);
    }
  };

  const goBack = () => router.replace("/Profile");

  const handleDelete = () => {
    const label = isReel ? "reel" : "post";
    Alert.alert(
      `Delete ${label}`,
      `Are you sure you want to delete this ${label}? This cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              const endpoint = isReel ? `/posts/reels/${id}` : `/posts/${id}`;
              await apiDelete(endpoint);
              router.replace("/Profile");
            } catch (err) {
              const msg = err instanceof Error ? err.message : "Unknown error";
              console.error("[PostDetail] delete failed:", msg);
              Alert.alert("Error", `Failed to delete: ${msg}`);
            }
          },
        },
      ],
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.screen, { backgroundColor: colors.background }]}>
        <View style={[styles.navBar, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={goBack} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Ionicons name="chevron-back" size={26} color={colors.text} />
          </TouchableOpacity>
        </View>
        <View style={styles.centered}>
          <ActivityIndicator color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (!post) {
    return (
      <SafeAreaView style={[styles.screen, { backgroundColor: colors.background }]}>
        <View style={[styles.navBar, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={goBack} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Ionicons name="chevron-back" size={26} color={colors.text} />
          </TouchableOpacity>
        </View>
        <View style={styles.centered}>
          <Text style={{ color: colors.textSecondary }}>Post not found.</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (isReel) {
    return (
      <SafeAreaView style={[styles.screen, { backgroundColor: "#000" }]} edges={["top"]}>
        <ReelLayout
          post={post}
          liked={liked}
          likes={likes}
          onLike={handleLike}
          onComment={handleComment}
          commentText={commentText}
          setCommentText={setCommentText}
          submitting={submitting}
          showComments={showComments}
          setShowComments={setShowComments}
          comments={comments}
          inputRef={inputRef}
          colors={colors}
          videoRef={videoRef}
        />
        {/* Back and delete buttons rendered last so iOS hit-testing puts them on top */}
        <TouchableOpacity style={styles.reelBack} onPress={goBack} hitSlop={{ top: 16, bottom: 16, left: 16, right: 16 }}>
          <Ionicons name="chevron-back" size={28} color="#fff" />
        </TouchableOpacity>
        {post.userId === user?.id && (
          <TouchableOpacity style={styles.reelDelete} onPress={handleDelete} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
            <Ionicons name="trash-outline" size={22} color="#fff" />
          </TouchableOpacity>
        )}
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.navBar, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={goBack} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="chevron-back" size={26} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.navTitle, { color: colors.text }]}>Post</Text>
        {post.userId === user?.id ? (
          <TouchableOpacity onPress={handleDelete} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Ionicons name="trash-outline" size={22} color="#e74c3c" />
          </TouchableOpacity>
        ) : (
          <View style={{ width: 26 }} />
        )}
      </View>
      <PostLayout
        post={post}
        comments={comments}
        liked={liked}
        likes={likes}
        onLike={handleLike}
        onComment={handleComment}
        commentText={commentText}
        setCommentText={setCommentText}
        submitting={submitting}
        inputRef={inputRef}
        colors={colors}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  centered: { flex: 1, alignItems: "center", justifyContent: "center" },
  navBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 0.5,
  },
  navTitle: { fontSize: 16, fontWeight: "700" },

  // Post layout
  postHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 0.5,
  },
  userRow: { flexDirection: "row", alignItems: "center", gap: 10, flex: 1 },
  userMeta: { flex: 1 },
  username: { fontSize: 14, fontWeight: "700" },
  location: { fontSize: 11, marginTop: 1 },
  postImage: { width: W, height: W },
  actionBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderBottomWidth: 0.5,
  },
  actionLeft: { flexDirection: "row", alignItems: "center" },
  actionBtn: { marginRight: 14 },
  meta: { paddingHorizontal: 14, paddingVertical: 10 },
  likesCount: { fontSize: 14, fontWeight: "700", marginBottom: 5 },
  caption: { fontSize: 14, lineHeight: 20, marginBottom: 5 },
  captionUser: { fontWeight: "700" },
  timeAgo: { fontSize: 11, marginTop: 2 },
  commentsHeader: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderTopWidth: 0.5,
  },
  commentsLabel: { fontSize: 13, fontWeight: "600" },
  commentRow: {
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 0.5,
  },
  commentBody: { flex: 1 },
  commentText: { fontSize: 14, lineHeight: 19 },
  commentTime: { fontSize: 11, marginTop: 3 },
  noComments: { textAlign: "center", paddingVertical: 24, fontSize: 14 },
  inputBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderTopWidth: 0.5,
    gap: 10,
  },
  commentInput: {
    flex: 1,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    fontSize: 14,
    maxHeight: 80,
  },
  postBtn: { fontSize: 14, fontWeight: "700" },

  // Reel layout
  reelContainer: { flex: 1 },
  reelOverlay: { backgroundColor: "rgba(0,0,0,0.25)" },
  reelBack: { position: "absolute", top: 12, left: 16, zIndex: 20 },
  reelDelete: { position: "absolute", top: 12, right: 16, zIndex: 20 },
  reelSidebar: {
    position: "absolute",
    right: 14,
    bottom: 120,
    alignItems: "center",
    gap: 20,
    zIndex: 10,
  },
  reelSideBtn: { alignItems: "center", gap: 3 },
  reelSideCount: { color: "#fff", fontSize: 12, fontWeight: "600" },
  reelBottom: {
    position: "absolute",
    bottom: 32,
    left: 14,
    right: 70,
    zIndex: 10,
  },
  reelUserRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 8 },
  reelUsername: { color: "#fff", fontWeight: "700", fontSize: 15 },
  reelCaption: { color: "#fff", fontSize: 14, lineHeight: 20, marginBottom: 6 },
  reelAudio: { color: "rgba(255,255,255,0.85)", fontSize: 13, marginBottom: 4 },
  reelTime: { color: "rgba(255,255,255,0.6)", fontSize: 12 },
  commentsPanel: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 30,
  },
  commentsPanelInner: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: "hidden",
  },
  commentsPanelHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
  },
});
