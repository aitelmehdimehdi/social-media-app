import React from "react";
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

const { width } = Dimensions.get("window");
const ITEM_SIZE = width / 3 - 2;

const EXPLORE_ITEMS = Array.from({ length: 18 }, (_, i) => ({
  id: String(i),
  image: `https://picsum.photos/seed/${i + 10}/300/300`,
  isVideo: i % 5 === 0,
}));

export default function ExploreScreen() {
  return (
    <SafeAreaView style={styles.screen}>
      {/* Search Bar */}
      <View style={styles.searchBar}>
        <Text style={styles.searchIcon}>🔍</Text>
        <Text style={styles.searchPlaceholder}>Search</Text>
      </View>

      {/* Grid */}
      <FlatList
        data={EXPLORE_ITEMS}
        keyExtractor={(item) => item.id}
        numColumns={3}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.gridItem}>
            <Image source={{ uri: item.image }} style={styles.gridImage} />
            {item.isVideo && <Text style={styles.videoIcon}>▶</Text>}
          </TouchableOpacity>
        )}
        ItemSeparatorComponent={() => <View style={{ height: 2 }} />}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#fff" },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#efefef",
    margin: 10,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  searchIcon: { fontSize: 14, marginRight: 6 },
  searchPlaceholder: { fontSize: 14, color: "#8e8e8e" },
  gridItem: {
    width: ITEM_SIZE,
    height: ITEM_SIZE,
    marginHorizontal: 1,
  },
  gridImage: { width: "100%", height: "100%" },
  videoIcon: {
    position: "absolute",
    top: 6,
    right: 6,
    color: "#fff",
    fontSize: 14,
  },
});
