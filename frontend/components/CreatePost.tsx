import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  Image,
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
import { useTheme } from "../context/ThemeContext";
import { API_URL } from "../config/env";
import { apiPost, getToken } from "../utils/api";

export default function CreatePostScreen() {
  const router = useRouter();
  const { colors } = useTheme();

  const [imageUri, setImageUri] = useState<string | null>(null);
  const [caption, setCaption] = useState("");
  const [location, setLocation] = useState("");
  const [tags, setTags] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission required",
        "Allow access to your photo library to share posts.",
      );
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.85,
    });
    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
    }
  };

  const handleShare = async () => {
    if (!imageUri) {
      Alert.alert("No photo selected", "Please choose a photo before sharing.");
      return;
    }
    setSubmitting(true);
    try {
      const blob = await (await fetch(imageUri)).blob();
      const formData = new FormData();
      formData.append("file", blob, "post.jpg");

      const token = await getToken();
      const uploadRes = await fetch(`${API_URL}/media/post`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });
      if (!uploadRes.ok) throw new Error("Upload failed");
      const { url: imageUrl } = await uploadRes.json();

      await apiPost("/posts", { imageUrl, caption: caption.trim() || undefined, location: location.trim() || undefined });
      router.back();
    } catch {
      Alert.alert("Error", "Failed to share post. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="close" size={26} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>New Post</Text>
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
          {/* Image picker area */}
          <TouchableOpacity onPress={pickImage} activeOpacity={0.85} style={styles.imageWrap}>
            {imageUri ? (
              <>
                <Image source={{ uri: imageUri }} style={styles.image} />
                <View style={styles.changePhotoOverlay}>
                  <Ionicons name="camera-outline" size={18} color="#fff" />
                  <Text style={styles.changePhotoText}>Change photo</Text>
                </View>
              </>
            ) : (
              <View
                style={[
                  styles.imagePlaceholder,
                  { backgroundColor: colors.surface, borderColor: colors.border },
                ]}
              >
                <View style={[styles.plusCircle, { borderColor: colors.textSecondary }]}>
                  <Ionicons name="add" size={36} color={colors.textSecondary} />
                </View>
                <Text style={[styles.placeholderLabel, { color: colors.text }]}>
                  Choose a photo
                </Text>
                <Text style={[styles.placeholderSub, { color: colors.textSecondary }]}>
                  Tap to open your gallery
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

          {/* Location & Tags */}
          <View
            style={[
              styles.formCard,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <View style={styles.fieldRow}>
              <Ionicons
                name="location-outline"
                size={20}
                color={colors.textSecondary}
                style={styles.fieldIcon}
              />
              <TextInput
                style={[styles.fieldInput, { color: colors.text }]}
                placeholder="Add location"
                placeholderTextColor={colors.textSecondary}
                value={location}
                onChangeText={setLocation}
              />
            </View>
            <View style={[styles.fieldDivider, { backgroundColor: colors.border }]} />
            <View style={styles.fieldRow}>
              <Ionicons
                name="pricetag-outline"
                size={20}
                color={colors.textSecondary}
                style={styles.fieldIcon}
              />
              <TextInput
                style={[styles.fieldInput, { color: colors.text }]}
                placeholder="Tag people  (e.g. @alex, @maria)"
                placeholderTextColor={colors.textSecondary}
                value={tags}
                onChangeText={setTags}
              />
            </View>
          </View>

          {/* Advanced options (collapsed, no-op for now) */}
          <View
            style={[
              styles.formCard,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            {[
              { icon: "settings-outline" as const, label: "Advanced settings" },
              { icon: "accessibility-outline" as const, label: "Accessibility" },
            ].map((item, i, arr) => (
              <View key={item.label}>
                <TouchableOpacity style={styles.fieldRow} activeOpacity={0.7}>
                  <Ionicons
                    name={item.icon}
                    size={20}
                    color={colors.textSecondary}
                    style={styles.fieldIcon}
                  />
                  <Text style={[styles.fieldInput, { color: colors.text }]}>{item.label}</Text>
                  <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
                </TouchableOpacity>
                {i < arr.length - 1 && (
                  <View style={[styles.fieldDivider, { backgroundColor: colors.border }]} />
                )}
              </View>
            ))}
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
  imageWrap: { width: "100%", aspectRatio: 1 },
  image: { width: "100%", height: "100%" },
  imagePlaceholder: {
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
  changePhotoOverlay: {
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
  changePhotoText: { color: "#fff", fontSize: 13, fontWeight: "600" },
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
  fieldRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
  fieldIcon: { marginRight: 12 },
  fieldInput: { flex: 1, fontSize: 14 },
  fieldDivider: { height: 0.5, marginHorizontal: 14 },
});
