import { Ionicons } from "@expo/vector-icons";
import { Tabs, useRouter, useSegments, useLocalSearchParams } from "expo-router";
import { useEffect } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { AuthProvider, useAuth } from "../context/AuthContext";
import { ThemeProvider, useTheme } from "../context/ThemeContext";
import { UnreadProvider, useUnread } from "../context/UnreadContext";
import { apiPatch } from "../utils/api";
import ChatBotWidget from "../components/ChatBotWidget";
import MessageToast from "../components/MessageToast";
import NotificationToast from "../components/NotificationToast";

// Push notifications — only imported if the package is installed
let Notifications: typeof import("expo-notifications") | null = null;
try {
  Notifications = require("expo-notifications");
} catch {}

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

  // Register push token when user logs in
  useEffect(() => {
    if (!user?.id || !Notifications) return;
    (async () => {
      try {
        const { status } = await Notifications!.requestPermissionsAsync();
        if (status !== "granted") return;
        const { data: token } = await Notifications!.getExpoPushTokenAsync();
        await apiPatch("/users/me/push-token", { token });
      } catch {}
    })();
  }, [user?.id]);

  // Handle notification tap → open conversation
  useEffect(() => {
    if (!Notifications) return;
    const sub = Notifications!.addNotificationResponseReceivedListener((response) => {
      const senderId = response.notification.request.content.data?.senderId as string | undefined;
      if (senderId) {
        router.push({ pathname: "/conversation/[id]", params: { id: senderId } });
      }
    });
    return () => sub.remove();
  }, []);

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
  const { unreadDMs } = useUnread();
  const segments = useSegments();

  // Detect if user is inside a conversation so the toast is suppressed for that sender
  const isInConversation = segments.includes("conversation");
  const params = isInConversation ? useLocalSearchParams<{ id: string }>() : { id: undefined };
  const activeSenderId = isInConversation ? params.id : undefined;

  return (
    <>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarShowLabel: false,
          tabBarStyle: {
            borderTopWidth: 0,
            backgroundColor: colors.tabBar,
            height: 62,
            paddingBottom: 8,
            paddingTop: 6,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: -2 },
            shadowOpacity: 0.06,
            shadowRadius: 8,
            elevation: 12,
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            tabBarIcon: ({ focused }) => (
              <TabIcon focused={focused} name={{ active: "home", inactive: "home-outline" }} />
            ),
          }}
        />
        <Tabs.Screen
          name="explore"
          options={{
            tabBarIcon: ({ focused }) => (
              <TabIcon focused={focused} name={{ active: "search", inactive: "search-outline" }} />
            ),
          }}
        />
        <Tabs.Screen
          name="Reels"
          options={{
            tabBarIcon: ({ focused }) => (
              <TabIcon focused={focused} name={{ active: "film", inactive: "film-outline" }} />
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
                unread={unreadDMs}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="Profile"
          options={{
            tabBarIcon: ({ focused }) => (
              <TabIcon focused={focused} name={{ active: "person", inactive: "person-outline" }} />
            ),
          }}
        />
        <Tabs.Screen name="Camera" options={{ href: null, tabBarStyle: { display: "none" } }} />
        <Tabs.Screen name="CreatePost" options={{ href: null, tabBarStyle: { display: "none" } }} />
        <Tabs.Screen name="CreateReel" options={{ href: null, tabBarStyle: { display: "none" } }} />
        <Tabs.Screen name="FollowList" options={{ href: null, tabBarStyle: { display: "none" } }} />
        <Tabs.Screen name="Auth" options={{ href: null, tabBarStyle: { display: "none" } }} />
        <Tabs.Screen name="user/[username]" options={{ href: null }} />
        <Tabs.Screen name="story/[userId]" options={{ href: null, tabBarStyle: { display: "none" } }} />
        <Tabs.Screen name="post/[id]" options={{ href: null, tabBarStyle: { display: "none" } }} />
        <Tabs.Screen name="EditProfile" options={{ href: null, tabBarStyle: { display: "none" } }} />
        <Tabs.Screen name="ChangePassword" options={{ href: null, tabBarStyle: { display: "none" } }} />
        <Tabs.Screen name="SavedPosts" options={{ href: null, tabBarStyle: { display: "none" } }} />
        <Tabs.Screen name="LikedPosts" options={{ href: null, tabBarStyle: { display: "none" } }} />
        <Tabs.Screen name="conversation/[id]" options={{ href: null, tabBarStyle: { display: "none" } }} />
      </Tabs>

      {/* Global in-app toasts — renders on top of all screens */}
      <MessageToast activeSenderId={activeSenderId} />
      <NotificationToast />
      <ChatBotWidget />
    </>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <UnreadProvider>
          <AuthGuard>
            <TabsLayout />
          </AuthGuard>
        </UnreadProvider>
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
