import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../context/ThemeContext";
import { API_URL } from "../config/env";
import { getToken } from "../utils/api";

type Colors = ReturnType<typeof useTheme>["colors"];

function PasswordField({
  label,
  value,
  onChangeText,
  placeholder,
  colors,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder: string;
  colors: Colors;
}) {
  const [visible, setVisible] = useState(false);
  return (
    <View style={fieldStyles.group}>
      <Text style={[fieldStyles.label, { color: colors.textSecondary }]}>{label}</Text>
      <View style={[fieldStyles.row, { backgroundColor: colors.inputBg }]}>
        <TextInput
          style={[fieldStyles.input, { color: colors.text }]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.textSecondary}
          secureTextEntry={!visible}
          autoCapitalize="none"
          autoCorrect={false}
        />
        <TouchableOpacity
          onPress={() => setVisible((v) => !v)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons
            name={visible ? "eye-off-outline" : "eye-outline"}
            size={20}
            color={colors.textSecondary}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const fieldStyles = StyleSheet.create({
  group: { paddingHorizontal: 16, paddingVertical: 12 },
  label: { fontSize: 12, fontWeight: "600", marginBottom: 6 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  input: { flex: 1, fontSize: 15 },
});

export default function ChangePasswordScreen() {
  const router = useRouter();
  const { colors } = useTheme();

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [saving, setSaving] = useState(false);

  const goBack = () => router.replace("/EditProfile");

  const handleUpdate = async () => {
    if (newPassword.length < 6) {
      Alert.alert("Validation", "New password must be at least 6 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert("Validation", "Passwords do not match.");
      return;
    }
    if (!currentPassword) {
      Alert.alert("Validation", "Please enter your current password.");
      return;
    }

    setSaving(true);
    try {
      const token = await getToken();
      const res = await fetch(`${API_URL}/users/me/password`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ newPassword, currentPassword }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({ message: "Update failed" }));
        const message =
          typeof errData.message === "string"
            ? errData.message
            : Array.isArray(errData.message)
              ? errData.message.join("\n")
              : "Update failed";
        Alert.alert("Error", message);
        return;
      }

      Alert.alert("Success", "Password updated successfully.", [
        { text: "OK", onPress: goBack },
      ]);
    } catch {
      Alert.alert("Error", "Something went wrong. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity
          onPress={goBack}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="chevron-back" size={26} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Change Password</Text>
        <View style={{ width: 26 }} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.scrollContent}
        >
          {/* New password card */}
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <PasswordField
              label="New password"
              value={newPassword}
              onChangeText={setNewPassword}
              placeholder="At least 6 characters"
              colors={colors}
            />
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <PasswordField
              label="Confirm new password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Repeat new password"
              colors={colors}
            />
          </View>

          {/* Current password confirmation */}
          <Text style={[styles.sectionHeader, { color: colors.textSecondary }]}>
            CONFIRM WITH CURRENT PASSWORD
          </Text>
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <PasswordField
              label="Current password"
              value={currentPassword}
              onChangeText={setCurrentPassword}
              placeholder="Your current password"
              colors={colors}
            />
          </View>

          {/* Submit */}
          <TouchableOpacity
            style={[
              styles.updateBtn,
              { backgroundColor: colors.primary, opacity: saving ? 0.7 : 1 },
            ]}
            onPress={handleUpdate}
            disabled={saving}
            activeOpacity={0.85}
          >
            {saving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.updateBtnText}>Update Password</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
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
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    minHeight: 52,
  },
  headerTitle: { fontSize: 16, fontWeight: "700" },
  scrollContent: { paddingBottom: 48, paddingTop: 16 },
  sectionHeader: {
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 0.8,
    marginHorizontal: 20,
    marginTop: 24,
    marginBottom: 6,
  },
  card: {
    marginHorizontal: 14,
    borderRadius: 14,
    borderWidth: 0.5,
    overflow: "hidden",
  },
  divider: { height: 0.5, marginHorizontal: 16 },
  updateBtn: {
    marginHorizontal: 14,
    marginTop: 32,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
  },
  updateBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});
