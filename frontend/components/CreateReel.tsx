import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { API_URL } from "../config/env";
import { useTheme } from "../context/ThemeContext";
import { apiPost, getToken } from "../utils/api";

function fmtDuration(ms: number): string {
  const total = Math.floor(ms / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function CreateReelScreen() {
  const router = useRouter();
  const { colors } = useTheme();

  const [videoUri, setVideoUri] = useState<string | null>(null);
  const [videoMime, setVideoMime] = useState<string>("video/mp4");
  const [videoName, setVideoName] = useState<string>("reel.mp4");
  const [duration, setDuration] = useState<number>(0);
  const [caption, setCaption] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const pickVideo = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission required", "Allow access to your gallery to share reels.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: "videos" as ImagePicker.MediaType,
      allowsEditing: true,
      quality: 1,
    });
    if (result.canceled) return;

    const asset = result.assets[0];
    const durationMs = asset.duration ?? 0;

    if (durationMs > 60000) {
      Alert.alert("Video too long", "Please choose a video that is 1 minute or less.");
      return;
    }

    setVideoUri(asset.uri);
    setDuration(durationMs);
    setVideoMime(asset.mimeType ?? "video/mp4");
    setVideoName(asset.fileName ?? (asset.mimeType === "video/quicktime" ? "reel.mov" : "reel.mp4"));
  };

  const handleShare = async () => {
    if (!videoUri) {
      Alert.alert("No video selected", "Please choose a video before sharing.");
      return;
    }
    setSubmitting(true);
    try {
      const formData = new FormData();
      if (Platform.OS === "web") {
        // On web, expo-image-picker returns a blob: URI — fetch it and wrap in a File
        const blobRes = await fetch(videoUri);
        const blob = await blobRes.blob();
        formData.append("file", new File([blob], videoName, { type: videoMime }));
      } else {
        // On native (iOS/Android), use React Native's FormData { uri, type, name } pattern
        formData.append("file", { uri: videoUri, type: videoMime, name: videoName } as any);
      }

      const token = await getToken();
      const uploadRes = await fetch(`${API_URL}/media/reel`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });
      if (!uploadRes.ok) throw new Error("Video upload failed");
      const { url: videoUrl } = await uploadRes.json();

      await apiPost("/posts/reels", {
        videoUrl,
        caption: caption.trim() || undefined,
      });

      router.replace("/Reels");
    } catch {
      Alert.alert("Error", "Failed to share reel. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity
          onPress={() => router.replace("/Reels")}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="close" size={26} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>New Reel</Text>
        <TouchableOpacity onPress={handleShare} disabled={submitting}>
          <Text style={[styles.shareBtn, { color: submitting ? colors.textSecondary : colors.primary }]}>
            {submitting ? "Sharing..." : "Share"}
          </Text>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Video picker area */}
          <TouchableOpacity onPress={pickVideo} activeOpacity={0.85} style={styles.videoWrap}>
            {videoUri ? (
              <View style={styles.videoPreview}>
                <Ionicons name="play-circle" size={64} color="rgba(255,255,255,0.9)" />
                <View style={styles.durationBadge}>
                  <Ionicons name="videocam" size={13} color="#fff" />
                  <Text style={styles.durationText}>{fmtDuration(duration)}</Text>
                </View>
                <View style={styles.changeVideoOverlay}>
                  <Ionicons name="videocam-outline" size={18} color="#fff" />
                  <Text style={styles.changeVideoText}>Change video</Text>
                </View>
              </View>
            ) : (
              <View
                style={[
                  styles.videoPlaceholder,
                  { backgroundColor: colors.surface, borderColor: colors.border },
                ]}
              >
                <View style={[styles.plusCircle, { borderColor: colors.textSecondary }]}>
                  <Ionicons name="videocam-outline" size={36} color={colors.textSecondary} />
                </View>
                <Text style={[styles.placeholderLabel, { color: colors.text }]}>Choose a video</Text>
                <Text style={[styles.placeholderSub, { color: colors.textSecondary }]}>
                  Videos up to 1 minute · Gallery only
                </Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Caption */}
          <View
            style={[
              styles.formCard,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <TextInput
              style={[styles.captionInput, { color: colors.text }]}
              placeholder="Write a caption..."
              placeholderTextColor={colors.textSecondary}
              multiline
              maxLength={2200}
              value={caption}
              onChangeText={setCaption}
            />
            <Text style={[styles.charCount, { color: colors.textSecondary }]}>
              {caption.length}/2200
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
  },
  headerTitle: { fontSize: 16, fontWeight: "700" },
  shareBtn: { fontSize: 16, fontWeight: "700" },
  scrollContent: { paddingBottom: 48 },
  videoWrap: { width: "100%", aspectRatio: 1 },
  videoPreview: {
    flex: 1,
    backgroundColor: "#111",
    alignItems: "center",
    justifyContent: "center",
  },
  durationBadge: {
    position: "absolute",
    bottom: 14,
    left: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  durationText: { color: "#fff", fontSize: 13, fontWeight: "600" },
  changeVideoOverlay: {
    position: "absolute",
    bottom: 14,
    right: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(0,0,0,0.55)",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
  },
  changeVideoText: { color: "#fff", fontSize: 13, fontWeight: "600" },
  videoPlaceholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    borderBottomWidth: 0.5,
  },
  plusCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  placeholderLabel: { fontSize: 16, fontWeight: "600" },
  placeholderSub: { fontSize: 13 },
  formCard: {
    marginTop: 10,
    marginHorizontal: 14,
    borderRadius: 12,
    borderWidth: 0.5,
    overflow: "hidden",
  },
  captionInput: {
    padding: 14,
    fontSize: 14,
    minHeight: 90,
    textAlignVertical: "top",
  },
  charCount: { fontSize: 11, textAlign: "right", paddingHorizontal: 14, paddingBottom: 8 },
});
