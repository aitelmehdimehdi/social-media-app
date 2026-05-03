import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useRef } from "react";
import {
  Animated,
  Dimensions,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const { width: W, height: H } = Dimensions.get("window");
const STORY_DURATION = 5000;

export default function StoryViewer() {
  const router = useRouter();
  const { imageUrl, username, avatar } = useLocalSearchParams<{
    imageUrl: string;
    username: string;
    avatar: string;
  }>();

  const progress = useRef(new Animated.Value(0)).current;
  const animRef = useRef<Animated.CompositeAnimation | null>(null);

  const safeBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace("/");
  };

  useEffect(() => {
    progress.setValue(0);
    const anim = Animated.timing(progress, {
      toValue: 1,
      duration: STORY_DURATION,
      useNativeDriver: false,
    });
    animRef.current = anim;
    anim.start(({ finished }) => {
      if (finished) safeBack();
    });
    return () => anim.stop();
  }, []);

  useEffect(() => {
    if (!imageUrl) safeBack();
  }, [imageUrl]);

  if (!imageUrl) return null;

  return (
    <View style={styles.container}>
      <Image
        source={{ uri: imageUrl }}
        style={StyleSheet.absoluteFill}
        resizeMode="cover"
      />

      <View style={styles.overlay} />

      <SafeAreaView style={styles.topArea} edges={["top"]}>
        {/* Progress bar */}
        <View style={styles.progressBars}>
          <View style={styles.progressTrack}>
            <Animated.View
              style={[
                styles.progressFill,
                {
                  width: progress.interpolate({
                    inputRange: [0, 1],
                    outputRange: ["0%", "100%"],
                  }),
                },
              ]}
            />
          </View>
        </View>

        {/* User row */}
        <View style={styles.header}>
          {avatar ? (
            <Image source={{ uri: avatar }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, { backgroundColor: "#7C3AED" }]} />
          )}
          <Text style={styles.username}>{username ?? "Unknown"}</Text>
          <TouchableOpacity
            onPress={safeBack}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={styles.closeIcon}>✕</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      {/* Tap zones */}
      <View style={styles.tapZones} pointerEvents="box-none">
        <TouchableWithoutFeedback onPress={safeBack}>
          <View style={styles.tapLeft} />
        </TouchableWithoutFeedback>
        <TouchableWithoutFeedback onPress={safeBack}>
          <View style={styles.tapRight} />
        </TouchableWithoutFeedback>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, width: W, height: H, backgroundColor: "#000" },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.18)",
  },
  topArea: {
    position: "absolute", top: 0, left: 0, right: 0, zIndex: 10,
  },
  progressBars: {
    flexDirection: "row",
    paddingHorizontal: 10,
    paddingTop: 8,
  },
  progressTrack: {
    flex: 1, height: 2.5,
    backgroundColor: "rgba(255,255,255,0.4)",
    borderRadius: 2, overflow: "hidden",
  },
  progressFill: {
    height: "100%", backgroundColor: "#fff", borderRadius: 2,
  },
  header: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 12, paddingTop: 10, paddingBottom: 6,
  },
  avatar: {
    width: 34, height: 34, borderRadius: 17,
    borderWidth: 2, borderColor: "#fff", marginRight: 10,
  },
  username: { color: "#fff", fontWeight: "700", fontSize: 14, flex: 1 },
  closeIcon: { color: "#fff", fontSize: 20, fontWeight: "600" },
  tapZones: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: "row",
    top: 100,
  },
  tapLeft: { flex: 1 },
  tapRight: { flex: 2 },
});
