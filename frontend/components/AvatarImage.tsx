import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Image, StyleProp, StyleSheet, View, ViewStyle } from "react-native";

interface AvatarImageProps {
  uri?: string | null;
  size: number;
  style?: StyleProp<ViewStyle>;
}

export default function AvatarImage({ uri, size, style }: AvatarImageProps) {
  const radius = size / 2;
  const iconSize = Math.round(size * 0.55);

  if (uri) {
    return (
      <Image
        source={{ uri }}
        style={[{ width: size, height: size, borderRadius: radius }, style]}
      />
    );
  }

  return (
    <View
      style={[
        styles.placeholder,
        { width: size, height: size, borderRadius: radius },
        style,
      ]}
    >
      <Ionicons name="person" size={iconSize} color="#fff" />
    </View>
  );
}

const styles = StyleSheet.create({
  placeholder: {
    backgroundColor: "#b0b0b0",
    alignItems: "center",
    justifyContent: "center",
  },
});
