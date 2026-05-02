import { Ionicons } from "@expo/vector-icons";
import { Tabs, useRouter, useSegments } from "expo-router";
import { useEffect } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { AuthProvider, useAuth } from "../context/AuthContext";
import { ThemeProvider, useTheme } from "../context/ThemeContext";

type IoniconsName = React.ComponentProps<typeof Ionicons>["name"];

function TabIcon({
  name,
  focused,
  unread,
}: {
  name: { active: IoniconsName; inactive: IoniconsName };
  focused: boolean;
  unread?: number;
}) {
  const { colors } = useTheme();
  return (
    <View style={styles.iconWrap}>
      <Ionicons
        name={focused ? name.active : name.inactive}
        size={26}
        color={focused ? colors.iconActive : colors.iconInactive}
      />
      {unread && unread > 0 ? <View style={styles.badge} /> : null}
    </View>
  );
}

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const { colors } = useTheme();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    if (isLoading) return;
    const onAuthScreen = segments[0] === "Auth";
    if (!user && !onAuthScreen) router.replace("/Auth");
    else if (user && onAuthScreen) router.replace("/");
  }, [user, isLoading, segments]);

  if (isLoading) {
    return (
      <View style={[styles.splash, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return <>{children}</>;
}

function TabsLayout() {
  const { colors } = useTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: {
          borderTopWidth: 0.5,
          borderTopColor: colors.border,
          backgroundColor: colors.tabBar,
          height: 58,
          paddingBottom: 6,
          paddingTop: 4,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon
              focused={focused}
              name={{ active: "home", inactive: "home-outline" }}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon
              focused={focused}
              name={{ active: "search", inactive: "search-outline" }}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="Reels"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon
              focused={focused}
              name={{ active: "film", inactive: "film-outline" }}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="DirectMessages"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon
              focused={focused}
              name={{ active: "send", inactive: "send-outline" }}
              unread={4}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="Profile"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon
              focused={focused}
              name={{ active: "person", inactive: "person-outline" }}
            />
          ),
        }}
      />
      <Tabs.Screen name="Camera" options={{ href: null }} />
      <Tabs.Screen name="Auth" options={{ href: null }} />
    </Tabs>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AuthGuard>
          <TabsLayout />
        </AuthGuard>
      </AuthProvider>
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  iconWrap: { alignItems: "center", justifyContent: "center" },
  badge: {
    position: "absolute",
    top: -1,
    right: -5,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#e74c3c",
  },
  splash: { flex: 1, alignItems: "center", justifyContent: "center" },
});
