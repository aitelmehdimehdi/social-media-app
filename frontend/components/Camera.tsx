import { useFocusEffect } from "@react-navigation/native"; // ✅ import ajouté
import {
    CameraType,
    CameraView,
    FlashMode,
    useCameraPermissions,
} from "expo-camera";
import * as MediaLibrary from "expo-media-library";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    Image,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

export default function CameraScreen() {
  const router = useRouter();
  const cameraRef = useRef<CameraView>(null);

  const [facing, setFacing] = useState<CameraType>("back");
  const [flash, setFlash] = useState<FlashMode>("off");
  const [zoom, setZoom] = useState(0);
  const [preview, setPreview] = useState<string | null>(null);
  const [isTaking, setIsTaking] = useState(false);

  // ✅ Contrôle si CameraView est monté ou non
  const [isCameraActive, setIsCameraActive] = useState(false);

  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [mediaPermission, requestMediaPermission] =
    MediaLibrary.usePermissions();

  // ── Ask permissions on mount ─────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      if (!cameraPermission?.granted) await requestCameraPermission();
      if (!mediaPermission?.granted) await requestMediaPermission();
    })();
  }, []);

  // ✅ Active la caméra quand l'écran est focus, la libère quand il perd le focus
  useFocusEffect(
    useCallback(() => {
      setIsCameraActive(true); // écran visible  → monter CameraView
      setPreview(null); // reset preview à chaque ouverture

      return () => {
        setIsCameraActive(false); // écran quitté → démonter CameraView = libère le hardware
      };
    }, []),
  );

  // ── Permission gates ──────────────────────────────────────────────────────
  if (!cameraPermission) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  if (!cameraPermission.granted) {
    return (
      <View style={styles.centered}>
        <Text style={styles.permText}>📷 Camera access required</Text>
        <TouchableOpacity
          style={styles.permBtn}
          onPress={requestCameraPermission}
        >
          <Text style={styles.permBtnText}>Grant Permission</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => router.back()}
          style={{ marginTop: 16 }}
        >
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ── Actions ───────────────────────────────────────────────────────────────

  const toggleFacing = () =>
    setFacing((f) => (f === "back" ? "front" : "back"));

  const cycleFlash = () =>
    setFlash((f) => {
      if (f === "off") return "on";
      if (f === "on") return "auto";
      return "off";
    });

  const flashIcon = flash === "on" ? "⚡" : flash === "auto" ? "⚡A" : "🚫";

  const takePicture = async () => {
    if (!cameraRef.current || isTaking) return;
    setIsTaking(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.85 });
      if (photo?.uri) setPreview(photo.uri);
    } catch (e) {
      Alert.alert("Error", "Could not take photo.");
    } finally {
      setIsTaking(false);
    }
  };

  const saveToGallery = async () => {
    if (!preview) return;
    try {
      await MediaLibrary.saveToLibraryAsync(preview);
      Alert.alert("Saved!", "Photo saved to your gallery.", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch {
      Alert.alert("Error", "Could not save photo.");
    }
  };

  const discardPreview = () => setPreview(null);

  // ── Preview screen ────────────────────────────────────────────────────────
  if (preview) {
    return (
      <View style={styles.screen}>
        <Image source={{ uri: preview }} style={styles.previewImage} />

        {/* Top actions */}
        <SafeAreaView style={styles.previewTopBar}>
          <TouchableOpacity onPress={discardPreview} style={styles.iconBtn}>
            <Text style={styles.iconText}>✕</Text>
          </TouchableOpacity>
        </SafeAreaView>

        {/* Bottom actions */}
        <View style={styles.previewBottomBar}>
          <TouchableOpacity style={styles.discardBtn} onPress={discardPreview}>
            <Text style={styles.discardText}>Retake</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.addStoryBtn} onPress={saveToGallery}>
            <Text style={styles.addStoryText}>Add to Story</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ── Camera screen ─────────────────────────────────────────────────────────
  return (
    <View style={styles.screen}>
      {/* ✅ CameraView monté UNIQUEMENT si l'écran est actif */}
      {isCameraActive && (
        <CameraView
          ref={cameraRef}
          style={StyleSheet.absoluteFill}
          facing={facing}
          flash={flash}
          zoom={zoom}
        />
      )}

      {/* Top bar */}
      <SafeAreaView style={styles.topBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
          <Text style={styles.iconText}>✕</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={cycleFlash} style={styles.iconBtn}>
          <Text style={styles.iconText}>{flashIcon}</Text>
        </TouchableOpacity>
      </SafeAreaView>

      {/* Zoom slider (simple touch buttons) */}
      <View style={styles.zoomRow}>
        {[0, 0.25, 0.5].map((z) => (
          <TouchableOpacity
            key={z}
            style={[styles.zoomBtn, zoom === z && styles.zoomBtnActive]}
            onPress={() => setZoom(z)}
          >
            <Text
              style={[styles.zoomText, zoom === z && styles.zoomTextActive]}
            >
              {z === 0 ? "1×" : z === 0.25 ? "2×" : "3×"}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Bottom bar */}
      <View style={styles.bottomBar}>
        {/* Gallery placeholder */}
        <TouchableOpacity style={styles.galleryBtn}>
          <Text style={styles.iconText}>🖼️</Text>
        </TouchableOpacity>

        {/* Shutter */}
        <TouchableOpacity
          style={[styles.shutter, isTaking && styles.shutterActive]}
          onPress={takePicture}
          activeOpacity={0.8}
        >
          <View style={styles.shutterInner} />
        </TouchableOpacity>

        {/* Flip camera */}
        <TouchableOpacity style={styles.flipBtn} onPress={toggleFacing}>
          <Text style={styles.iconText}>🔄</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#000",
  },
  centered: {
    flex: 1,
    backgroundColor: "#000",
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
  },
  permText: { color: "#fff", fontSize: 18, fontWeight: "600" },
  permBtn: {
    backgroundColor: "#0095f6",
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 8,
  },
  permBtnText: { color: "#fff", fontWeight: "700", fontSize: 15 },
  cancelText: { color: "#aaa", fontSize: 14 },

  // Top bar
  topBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 8,
    zIndex: 10,
  },
  iconBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "rgba(0,0,0,0.45)",
    alignItems: "center",
    justifyContent: "center",
  },
  iconText: { fontSize: 20, color: "#fff" },

  // Zoom
  zoomRow: {
    position: "absolute",
    bottom: 130,
    alignSelf: "center",
    flexDirection: "row",
    gap: 10,
    backgroundColor: "rgba(0,0,0,0.35)",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  zoomBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  zoomBtnActive: { backgroundColor: "rgba(255,255,255,0.25)" },
  zoomText: { color: "rgba(255,255,255,0.6)", fontSize: 13, fontWeight: "600" },
  zoomTextActive: { color: "#fff" },

  // Bottom bar
  bottomBar: {
    position: "absolute",
    bottom: 40,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    paddingHorizontal: 30,
  },
  galleryBtn: {
    width: 48,
    height: 48,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  shutter: {
    width: 78,
    height: 78,
    borderRadius: 39,
    borderWidth: 4,
    borderColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  shutterActive: { opacity: 0.6 },
  shutterInner: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: "#fff",
  },
  flipBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },

  // Preview
  previewImage: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    resizeMode: "cover",
  },
  previewTopBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  previewBottomBar: {
    position: "absolute",
    bottom: 40,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    gap: 16,
  },
  discardBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: "#fff",
    alignItems: "center",
  },
  discardText: { color: "#fff", fontWeight: "600", fontSize: 15 },
  addStoryBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: "#0095f6",
    alignItems: "center",
  },
  addStoryText: { color: "#fff", fontWeight: "700", fontSize: 15 },
});
