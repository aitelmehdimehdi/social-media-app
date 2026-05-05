import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../context/ThemeContext";
import { apiDelete, apiGet } from "../utils/api";
import AvatarImage from "./AvatarImage";

type FollowUser = {
  id: string;
  username: string;
  fullName: string;
  avatar: string | null;
};

export default function FollowListScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { userId, type } = useLocalSearchParams<{
    userId: string;
    type: "followers" | "following";
  }>();

  const [users, setUsers] = useState<FollowUser[]>([]);
  const [loading, setLoading] = useState(true);

  const isFollowers = type === "followers";

  useEffect(() => {
    if (!userId || !type) return;
    apiGet<FollowUser[]>(`/users/${userId}/${type}`)
      .then(setUsers)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [userId, type]);

  const handleMinus = (person: FollowUser) => {
    const title = isFollowers ? "Remove follower" : "Unfollow";
    const message = isFollowers
      ? `Remove @${person.username} from your followers?`
      : `Unfollow @${person.username}?`;

    Alert.alert(title, message, [
      { text: "Cancel", style: "cancel" },
      {
        text: isFollowers ? "Remove" : "Unfollow",
        style: "destructive",
        onPress: async () => {
          try {
            if (isFollowers) {
              await apiDelete(`/users/${person.id}/follower`);
            } else {
              await apiDelete(`/users/${person.id}/follow`);
            }
            setUsers((prev) => prev.filter((u) => u.id !== person.id));
          } catch {
            Alert.alert("Error", "Something went wrong. Please try again.");
          }
        },
      },
    ]);
  };

  const renderItem = ({ item }: { item: FollowUser }) => (
    <View style={[styles.row, { borderBottomColor: colors.border }]}>
      <TouchableOpacity
        style={styles.userInfo}
        activeOpacity={0.7}
        onPress={() =>
          router.push({
            pathname: "/user/[username]",
            params: { username: item.username },
          })
        }
      >
        <AvatarImage uri={item.avatar} size={46} />
        <View style={styles.userText}>
          <Text style={[styles.username, { color: colors.text }]}>{item.username}</Text>
          {!!item.fullName && (
            <Text style={[styles.fullName, { color: colors.textSecondary }]}>{item.fullName}</Text>
          )}
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.minusBtn, { borderColor: colors.border, backgroundColor: colors.surface }]}
        onPress={() => handleMinus(item)}
        activeOpacity={0.7}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Ionicons name="remove" size={18} color={colors.text} />
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="chevron-back" size={26} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          {isFollowers ? "Followers" : "Following"}
        </Text>
        <View style={{ width: 26 }} />
      </View>

      <FlatList
        data={users}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={users.length === 0 ? styles.emptyContainer : undefined}
        ListEmptyComponent={
          !loading ? (
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              {isFollowers ? "No followers yet." : "Not following anyone yet."}
            </Text>
          ) : null
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 0.5,
  },
  headerTitle: { fontSize: 16, fontWeight: "700" },
  row: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 16, paddingVertical: 11, borderBottomWidth: 0.5,
  },
  userInfo: { flex: 1, flexDirection: "row", alignItems: "center", gap: 12 },
  userText: { flex: 1 },
  username: { fontSize: 14, fontWeight: "600" },
  fullName: { fontSize: 13, marginTop: 2 },
  minusBtn: {
    width: 32, height: 32, borderRadius: 16,
    borderWidth: 1, alignItems: "center", justifyContent: "center",
  },
  emptyContainer: { flex: 1, justifyContent: "center" },
  emptyText: { textAlign: "center", fontSize: 14 },
});
