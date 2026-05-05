import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../context/ThemeContext";
import { apiGet } from "../utils/api";

const { width: W } = Dimensions.get("window");
const GRID_SIZE = W / 3 - 1;

type GridItem = {
  id: string;
  image: string;
  type: "post" | "reel";
  date: string;
};

export default function SavedPostsScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const [items, setItems] = useState<GridItem[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      apiGet<GridItem[]>("/posts/saved")
        .then(setItems)
        .catch((err) => { console.warn("[SavedPosts] fetch failed:", err); })
        .finally(() => setLoading(false));
    }, [])
  );

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="chevron-back" size={26} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Saved</Text>
        <View style={{ width: 26 }} />
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 60 }} color={colors.primary} size="large" />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          numColumns={3}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.grid}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.gridItem}
              activeOpacity={0.85}
              onPress={() =>
                router.push({ pathname: "/post/[id]", params: { id: item.id, type: item.type } })
              }
            >
              <Image source={{ uri: item.image }} style={styles.gridImage} />
              {item.type === "reel" && (
                <View style={styles.mediaTypeBadge}>
                  <Ionicons name="play-circle" size={16} color="#fff" />
                </View>
              )}
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="bookmark-outline" size={52} color={colors.textSecondary} />
              <Text style={[styles.emptyTitle, { color: colors.text }]}>No saved posts yet</Text>
              <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
                Tap the bookmark icon on any post to save it here.
              </Text>
            </View>
          }
        />
      )}
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
    paddingVertical: 10,
    borderBottomWidth: 0.5,
  },
  headerTitle: { fontSize: 16, fontWeight: "700" },
  grid: { paddingBottom: 24 },
  row: { gap: 1.5 },
  gridItem: { width: GRID_SIZE, height: GRID_SIZE, marginBottom: 1.5 },
  gridImage: { width: "100%", height: "100%" },
  mediaTypeBadge: { position: "absolute", top: 6, right: 6 },
  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 100,
    paddingHorizontal: 40,
    gap: 12,
  },
  emptyTitle: { fontSize: 18, fontWeight: "700", textAlign: "center" },
  emptySubtitle: { fontSize: 14, textAlign: "center", lineHeight: 20 },
});
