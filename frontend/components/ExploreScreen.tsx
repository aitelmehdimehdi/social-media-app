import React, { useEffect, useState } from "react";
import {
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

const { width } = Dimensions.get("window");
const ITEM_SIZE = width / 3 - 2;

type ExplorePost = {
  id: string;
  imageUrl: string;
};

export default function ExploreScreen() {
  const { colors } = useTheme();
  const [posts, setPosts] = useState<ExplorePost[]>([]);

  useEffect(() => {
    apiGet<ExplorePost[]>("/posts/feed")
      .then((data) => setPosts(data.filter((p) => !!p.imageUrl)))
      .catch(() => setPosts([]));
  }, []);

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: colors.background }]}>
      <View style={[styles.searchBar, { backgroundColor: colors.surface }]}>
        <Text style={styles.searchIcon}>🔍</Text>
        <Text style={[styles.searchPlaceholder, { color: colors.textSecondary }]}>Search</Text>
      </View>

      {posts.length === 0 ? (
        <View style={styles.empty}>
          <Text style={[styles.emptyIcon]}>🔍</Text>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            No posts to explore yet.
          </Text>
        </View>
      ) : (
        <FlatList
          data={posts}
          keyExtractor={(item) => item.id}
          numColumns={3}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.gridItem}>
              <Image source={{ uri: item.imageUrl }} style={styles.gridImage} />
            </TouchableOpacity>
          )}
          ItemSeparatorComponent={() => <View style={{ height: 2 }} />}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    margin: 10,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  searchIcon: { fontSize: 14, marginRight: 6 },
  searchPlaceholder: { fontSize: 14 },
  gridItem: {
    width: ITEM_SIZE,
    height: ITEM_SIZE,
    marginHorizontal: 1,
  },
  gridImage: { width: "100%", height: "100%" },
  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  emptyIcon: { fontSize: 48 },
  emptyText: { fontSize: 15 },
});
