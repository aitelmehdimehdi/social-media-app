import { useFocusEffect } from "@react-navigation/native";
import {
  CameraType,
  CameraView,
  FlashMode,
  useCameraPermissions,
} from "expo-camera";
import * as Location from "expo-location";
import * as MediaLibrary from "expo-media-library";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { getToken } from "../utils/api";
import { API_URL } from "../config/env";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  FlatList,
  Image,
  KeyboardAvoidingView,
  PanResponder,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const { width: W, height: H } = Dimensions.get("window");

// ── Types ─────────────────────────────────────────────────────────────────────

type OverlayItem = {
  id: string;
  type: "emoji" | "text" | "location";
  content: string;
  x: number;
  y: number;
  color?: string;
};

type FilterPreset = { name: string; color: string | null };
type MusicTrack = { id: string; title: string; artist: string; url: string };

// ── Constants ─────────────────────────────────────────────────────────────────

const FILTERS: FilterPreset[] = [
  { name: "Normal", color: null },
  { name: "Warm",   color: "rgba(255,120,0,0.22)" },
  { name: "Cool",   color: "rgba(30,100,255,0.22)" },
  { name: "Noir",   color: "rgba(10,10,40,0.55)" },
  { name: "Fade",   color: "rgba(240,240,255,0.28)" },
  { name: "Vivid",  color: "rgba(200,0,80,0.18)" },
];

const MUSIC_TRACKS: MusicTrack[] = [
  { id: "1", title: "Summer Vibes",    artist: "Bensound", url: "https://www.bensound.com/bensound-music/bensound-summertimeblues.mp3" },
  { id: "2", title: "Ukelele",         artist: "Bensound", url: "https://www.bensound.com/bensound-music/bensound-ukelele.mp3" },
  { id: "3", title: "Cute",            artist: "Bensound", url: "https://www.bensound.com/bensound-music/bensound-cute.mp3" },
  { id: "4", title: "Acoustic Breeze", artist: "Bensound", url: "https://www.bensound.com/bensound-music/bensound-acousticbreeze.mp3" },
  { id: "5", title: "Hey!",            artist: "Bensound", url: "https://www.bensound.com/bensound-music/bensound-hey.mp3" },
];

const EMOJIS = [
  "😀","😂","🥰","😎","🤩","😜","🥳","🤔",
  "❤️","🔥","✨","🌟","💯","🎉","👏","🙌",
  "🌈","🦋","🌸","🌺","🍀","🌙","☀️","⭐",
  "🎵","🎶","🎸","🎤","💃","🕺","🎭","🎪",
  "🍕","🍔","🍦","☕","🍹","🎂","🍰","🧁",
  "🐶","🐱","🦊","🐻","🐼","🦁","🐯","🦄",
  "🚀","✈️","🌍","🏖️","🏔️","🌊","🌅","🎠",
  "💪","👊","🤝","🙏","✌️","🤞","👍","❤️‍🔥",
];

const TEXT_COLORS = ["#ffffff", "#000000", "#FFD700", "#8B5CF6", "#FF3040", "#00FF88"];

// ── DraggableOverlay ──────────────────────────────────────────────────────────

function DraggableOverlay({
  item,
  onPositionChange,
  onRemove,
}: {
  item: OverlayItem;
  onPositionChange: (id: string, x: number, y: number) => void;
  onRemove: (id: string) => void;
}) {
  const pan = useRef(new Animated.ValueXY({ x: item.x, y: item.y })).current;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        pan.setOffset({
          x: (pan.x as any)._value,
          y: (pan.y as any)._value,
        });
        pan.setValue({ x: 0, y: 0 });
      },
      onPanResponderMove: Animated.event(
        [null, { dx: pan.x, dy: pan.y }],
        { useNativeDriver: false },
      ),
      onPanResponderRelease: () => {
        pan.flattenOffset();
        onPositionChange(
          item.id,
          (pan.x as any)._value,
          (pan.y as any)._value,
        );
      },
    }),
  ).current;

  return (
    <Animated.View
      style={[styles.draggable, { transform: pan.getTranslateTransform() }]}
      {...panResponder.panHandlers}
    >
      <TouchableOpacity
        onLongPress={() => onRemove(item.id)}
        delayLongPress={600}
        activeOpacity={0.85}
      >
        <Text style={[styles.overlayContent, item.color ? { color: item.color } : null]}>
          {item.content}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

// ── StoryEditor ───────────────────────────────────────────────────────────────

function StoryEditor({
  imageUri,
  onDiscard,
  onDone,
}: {
  imageUri: string;
  onDiscard: () => void;
  onDone: () => void;
}) {
  const [overlays, setOverlays] = useState<OverlayItem[]>([]);
  const [filter, setFilter] = useState<FilterPreset>(FILTERS[0]);
  const [activePanel, setActivePanel] = useState<"emoji" | "text" | "music" | "filter" | null>(null);
  const [textInput, setTextInput] = useState("");
  const [textColor, setTextColor] = useState(TEXT_COLORS[0]);
  const [selectedMusic, setSelectedMusic] = useState<MusicTrack | null>(null);
  const [uploading, setUploading] = useState(false);

  const addOverlay = (type: OverlayItem["type"], content: string, color?: string) => {
    setOverlays(prev => [
      ...prev,
      { id: Date.now().toString(), type, content, x: W / 2 - 40, y: H / 2 - 40, color },
    ]);
  };

  const updatePosition = (id: string, x: number, y: number) => {
    setOverlays(prev => prev.map(o => (o.id === id ? { ...o, x, y } : o)));
  };

  const removeOverlay = (id: string) => {
    setOverlays(prev => prev.filter(o => o.id !== id));
  };

  const addLocationTag = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission needed", "Allow location access to tag your story.");
      return;
    }
    try {
      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const results = await Location.reverseGeocodeAsync({
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
      });
      const place = results[0];
      const label = place?.city ?? place?.region ?? place?.country ?? "Unknown";
      addOverlay("location", `📍 ${label}`);
    } catch {
      Alert.alert("Location error", "Could not retrieve your location.");
    }
  };

  const handleAddText = () => {
    if (!textInput.trim()) return;
    addOverlay("text", textInput.trim(), textColor);
    setTextInput("");
    setActivePanel(null);
  };

  const togglePanel = (panel: "emoji" | "text" | "music" | "filter") => {
    setActivePanel(prev => (prev === panel ? null : panel));
  };

  const uploadAndPost = async () => {
    if (uploading) return;
    setUploading(true);
    try {
      const token = await getToken();

      const formData = new FormData();
      formData.append("file", {
        uri: imageUri,
        type: "image/jpeg",
        name: "story.jpg",
      } as any);

      const uploadRes = await fetch(`${API_URL}/media/upload`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      if (!uploadRes.ok) throw new Error("Upload failed");
      const { url } = (await uploadRes.json()) as { url: string };

      const overlaysPayload = overlays.map(({ id, type, content, x, y, color }) => ({
        id, type, content, x, y, color,
      }));
      const locationOverlay = overlays.find(o => o.type === "location");

      const storyRes = await fetch(`${API_URL}/stories`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          imageUrl: url,
          overlays: overlaysPayload.length > 0 ? overlaysPayload : null,
          filter: filter.name !== "Normal" ? filter.name : null,
          audioUrl: selectedMusic?.url ?? null,
          location: locationOverlay?.content ?? null,
        }),
      });
      if (!storyRes.ok) throw new Error("Story creation failed");

      Alert.alert("Story posted!", "Your story will be visible for 24 hours.", [
        { text: "OK", onPress: onDone },
      ]);
    } catch (e) {
      Alert.alert("Error", (e as Error).message ?? "Could not post story.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <View style={styles.screen}>
      {/* Background image */}
      <Image source={{ uri: imageUri }} style={StyleSheet.absoluteFill} resizeMode="cover" />

      {/* Filter tint overlay */}
      {filter.color !== null && (
        <View
          pointerEvents="none"
          style={[StyleSheet.absoluteFill, { backgroundColor: filter.color }]}
        />
      )}

      {/* Draggable stickers / text / location */}
      {overlays.map(item => (
        <DraggableOverlay
          key={item.id}
          item={item}
          onPositionChange={updatePosition}
          onRemove={removeOverlay}
        />
      ))}

      {/* Top bar */}
      <SafeAreaView style={styles.editorTopBar}>
        <TouchableOpacity onPress={onDiscard} style={styles.iconBtn}>
          <Text style={styles.iconText}>✕</Text>
        </TouchableOpacity>

        {selectedMusic && !activePanel && (
          <View style={styles.musicBadge}>
            <Text style={styles.musicBadgeText}>🎵 {selectedMusic.title}</Text>
          </View>
        )}

        {activePanel !== null && (
          <TouchableOpacity style={styles.iconBtn} onPress={() => setActivePanel(null)}>
            <Text style={styles.iconText}>✓</Text>
          </TouchableOpacity>
        )}
      </SafeAreaView>

      {/* Right-side toolbar */}
      <View style={styles.rightToolbar}>
        {(
          [
            { id: "emoji"  as const, icon: "😊" },
            { id: "text"   as const, icon: "Aa" },
            { id: "music"  as const, icon: "🎵" },
            { id: "filter" as const, icon: "🎨" },
          ] as const
        ).map(tool => (
          <TouchableOpacity
            key={tool.id}
            style={[styles.toolBtn, activePanel === tool.id && styles.toolBtnActive]}
            onPress={() => togglePanel(tool.id)}
          >
            <Text style={styles.toolBtnText}>{tool.icon}</Text>
          </TouchableOpacity>
        ))}
        <TouchableOpacity style={styles.toolBtn} onPress={addLocationTag}>
          <Text style={styles.toolBtnText}>📍</Text>
        </TouchableOpacity>
      </View>

      {/* ── Emoji picker ── */}
      {activePanel === "emoji" && (
        <View style={styles.panel}>
          <FlatList
            data={EMOJIS}
            numColumns={8}
            keyExtractor={item => item}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.emojiItem}
                onPress={() => {
                  addOverlay("emoji", item);
                  setActivePanel(null);
                }}
              >
                <Text style={styles.emojiText}>{item}</Text>
              </TouchableOpacity>
            )}
          />
        </View>
      )}

      {/* ── Text input ── */}
      {activePanel === "text" && (
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.panel}
        >
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.colorRowContent}
          >
            {TEXT_COLORS.map(c => (
              <TouchableOpacity
                key={c}
                style={[
                  styles.colorDot,
                  { backgroundColor: c },
                  textColor === c && styles.colorDotActive,
                ]}
                onPress={() => setTextColor(c)}
              />
            ))}
          </ScrollView>
          <View style={styles.textInputRow}>
            <TextInput
              style={[styles.textField, { color: textColor }]}
              placeholder="Type something..."
              placeholderTextColor="rgba(255,255,255,0.45)"
              value={textInput}
              onChangeText={setTextInput}
              autoFocus
              returnKeyType="done"
              onSubmitEditing={handleAddText}
            />
            <TouchableOpacity style={styles.textAddBtn} onPress={handleAddText}>
              <Text style={styles.textAddBtnText}>Add</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      )}

      {/* ── Music picker ── */}
      {activePanel === "music" && (
        <View style={styles.panel}>
          <Text style={styles.panelTitle}>Choose a track</Text>
          {MUSIC_TRACKS.map(track => (
            <TouchableOpacity
              key={track.id}
              style={[
                styles.trackRow,
                selectedMusic?.id === track.id && styles.trackRowActive,
              ]}
              onPress={() => {
                setSelectedMusic(prev => (prev?.id === track.id ? null : track));
                setActivePanel(null);
              }}
            >
              <Text style={styles.trackIcon}>🎵</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.trackTitle}>{track.title}</Text>
                <Text style={styles.trackArtist}>{track.artist}</Text>
              </View>
              {selectedMusic?.id === track.id && (
                <Text style={styles.checkmark}>✓</Text>
              )}
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* ── Filter picker ── */}
      {activePanel === "filter" && (
        <View style={[styles.panel, styles.filterPanel]}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterRow}
          >
            {FILTERS.map(f => (
              <TouchableOpacity
                key={f.name}
                style={styles.filterItem}
                onPress={() => {
                  setFilter(f);
                  setActivePanel(null);
                }}
              >
                <View style={styles.filterThumb}>
                  <Image
                    source={{ uri: imageUri }}
                    style={StyleSheet.absoluteFill}
                    resizeMode="cover"
                  />
                  {f.color !== null && (
                    <View
                      pointerEvents="none"
                      style={[StyleSheet.absoluteFill, { backgroundColor: f.color }]}
                    />
                  )}
                  {filter.name === f.name && <View style={styles.filterSelected} />}
                </View>
                <Text style={[styles.filterName, filter.name === f.name && styles.filterNameActive]}>
                  {f.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Bottom bar — hidden while a panel is open */}
      {activePanel === null && (
        <View style={styles.editorBottomBar}>
          <TouchableOpacity
            style={styles.storyBtn}
            onPress={uploadAndPost}
            disabled={uploading}
          >
            {uploading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <Text style={styles.storyBtnIcon}>👤</Text>
                <Text style={styles.storyBtnLabel}>Your Story</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.shareBtn}
            onPress={uploadAndPost}
            disabled={uploading}
          >
            {uploading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <Text style={styles.storyBtnLabel}>Share</Text>
                <Text style={styles.storyBtnArrow}>→</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

// ── CameraScreen ──────────────────────────────────────────────────────────────

export default function CameraScreen() {
  const router = useRouter();
  const cameraRef = useRef<CameraView>(null);

  const [facing, setFacing] = useState<CameraType>("back");
  const [flash, setFlash] = useState<FlashMode>("off");
  const [zoom, setZoom] = useState(0);
  const [preview, setPreview] = useState<string | null>(null);
  const [isTaking, setIsTaking] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);

  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [mediaPermission, requestMediaPermission] = MediaLibrary.usePermissions();

  useEffect(() => {
    (async () => {
      if (!cameraPermission?.granted) await requestCameraPermission();
      if (!mediaPermission?.granted) await requestMediaPermission();
    })();
  }, [cameraPermission?.granted, mediaPermission?.granted]);

  useFocusEffect(
    useCallback(() => {
      setIsCameraActive(true);
      setPreview(null);
      return () => setIsCameraActive(false);
    }, []),
  );

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
        <TouchableOpacity style={styles.permBtn} onPress={requestCameraPermission}>
          <Text style={styles.permBtnText}>Grant Permission</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 16 }}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const toggleFacing = () => setFacing(f => (f === "back" ? "front" : "back"));

  const cycleFlash = () => {
    if (facing === "front") return;
    setFlash(f => (f === "off" ? "on" : f === "on" ? "auto" : "off"));
  };

  const flashLabel = flash === "on" ? "⚡" : flash === "auto" ? "⚡A" : "🚫";

  const takePicture = async () => {
    if (!cameraRef.current || isTaking) return;
    setIsTaking(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.85 });
      if (photo?.uri) setPreview(photo.uri);
    } catch {
      Alert.alert("Error", "Could not take photo.");
    } finally {
      setIsTaking(false);
    }
  };

  if (preview) {
    return (
      <StoryEditor
        imageUri={preview}
        onDiscard={() => setPreview(null)}
        onDone={() => router.back()}
      />
    );
  }

  return (
    <View style={styles.screen}>
      {isCameraActive && (
        <CameraView
          ref={cameraRef}
          style={StyleSheet.absoluteFill}
          facing={facing}
          flash={flash}
          zoom={zoom}
        />
      )}

      <SafeAreaView style={styles.topBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
          <Text style={styles.iconText}>✕</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={cycleFlash} style={styles.iconBtn}>
          <Text style={styles.iconText}>{flashLabel}</Text>
        </TouchableOpacity>
      </SafeAreaView>

      <View style={styles.zoomRow}>
        {[0, 0.25, 0.5].map(z => (
          <TouchableOpacity
            key={z}
            style={[styles.zoomBtn, zoom === z && styles.zoomBtnActive]}
            onPress={() => setZoom(z)}
          >
            <Text style={[styles.zoomText, zoom === z && styles.zoomTextActive]}>
              {z === 0 ? "1×" : z === 0.25 ? "2×" : "3×"}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.galleryBtn}>
          <Text style={styles.iconText}>🖼️</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.shutter, isTaking && styles.shutterActive]}
          onPress={takePicture}
          activeOpacity={0.8}
        >
          <View style={styles.shutterInner} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.flipBtn} onPress={toggleFacing}>
          <Text style={styles.iconText}>🔄</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#000" },
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

  // ── Camera screen ──────────────────────────────────────────────────────────
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
  iconText: { fontSize: 18, color: "#fff" },

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
  zoomBtn: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  zoomBtnActive: { backgroundColor: "rgba(255,255,255,0.25)" },
  zoomText: { color: "rgba(255,255,255,0.6)", fontSize: 13, fontWeight: "600" },
  zoomTextActive: { color: "#fff" },

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
  shutterInner: { width: 62, height: 62, borderRadius: 31, backgroundColor: "#fff" },
  flipBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },

  // ── Story editor ───────────────────────────────────────────────────────────
  editorTopBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 8,
    zIndex: 20,
  },
  musicBadge: {
    flex: 1,
    marginHorizontal: 12,
    backgroundColor: "rgba(0,0,0,0.55)",
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignItems: "center",
  },
  musicBadgeText: { color: "#fff", fontSize: 13, fontWeight: "600" },

  rightToolbar: {
    position: "absolute",
    right: 16,
    top: H * 0.18,
    zIndex: 20,
    gap: 12,
  },
  toolBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(0,0,0,0.50)",
    alignItems: "center",
    justifyContent: "center",
  },
  toolBtnActive: { backgroundColor: "rgba(139,92,246,0.80)" },
  toolBtnText: { fontSize: 20 },

  // Draggable overlays
  draggable: { position: "absolute", zIndex: 15 },
  overlayContent: {
    fontSize: 32,
    color: "#fff",
    textShadowColor: "rgba(0,0,0,0.45)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },

  // Shared panel base
  panel: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(18,18,28,0.93)",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 16,
    paddingBottom: 34,
    maxHeight: H * 0.46,
    zIndex: 25,
  },
  panelTitle: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 12,
    paddingHorizontal: 20,
  },

  // Emoji
  emojiItem: {
    width: W / 8,
    height: 50,
    alignItems: "center",
    justifyContent: "center",
  },
  emojiText: { fontSize: 26 },

  // Text
  colorRowContent: { gap: 10, paddingHorizontal: 20, paddingBottom: 14 },
  colorDot: { width: 30, height: 30, borderRadius: 15 },
  colorDotActive: { borderWidth: 3, borderColor: "#fff" },
  textInputRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    gap: 10,
  },
  textField: {
    flex: 1,
    fontSize: 17,
    backgroundColor: "rgba(255,255,255,0.10)",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  textAddBtn: {
    backgroundColor: "#8B5CF6",
    borderRadius: 10,
    paddingHorizontal: 18,
    paddingVertical: 11,
  },
  textAddBtnText: { color: "#fff", fontWeight: "700", fontSize: 15 },

  // Music
  trackRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 14,
  },
  trackRowActive: { backgroundColor: "rgba(139,92,246,0.20)" },
  trackIcon: { fontSize: 22 },
  trackTitle: { color: "#fff", fontSize: 15, fontWeight: "600" },
  trackArtist: { color: "#999", fontSize: 12, marginTop: 2 },
  checkmark: { color: "#8B5CF6", fontSize: 20, fontWeight: "700" },

  // Filter
  filterPanel: { maxHeight: undefined, paddingBottom: 28 },
  filterRow: { gap: 14, paddingHorizontal: 16, paddingVertical: 8 },
  filterItem: { alignItems: "center", gap: 6 },
  filterThumb: {
    width: 62,
    height: 88,
    borderRadius: 10,
    overflow: "hidden",
    backgroundColor: "#333",
  },
  filterSelected: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: 3,
    borderColor: "#8B5CF6",
    borderRadius: 10,
  },
  filterName: { color: "#bbb", fontSize: 11, fontWeight: "600" },
  filterNameActive: { color: "#8B5CF6" },

  // Bottom action bar
  editorBottomBar: {
    position: "absolute",
    bottom: 36,
    left: 0,
    right: 0,
    flexDirection: "row",
    paddingHorizontal: 20,
    gap: 12,
    zIndex: 20,
  },
  storyBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.16)",
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.38)",
  },
  shareBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: "#8B5CF6",
  },
  storyBtnIcon:  { fontSize: 18 },
  storyBtnLabel: { color: "#fff", fontWeight: "700", fontSize: 15 },
  storyBtnArrow: { color: "#fff", fontSize: 18, fontWeight: "700" },
});
