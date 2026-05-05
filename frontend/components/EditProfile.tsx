import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
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
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { API_URL } from "../config/env";
import { getToken } from "../utils/api";

export default function EditProfileScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { refreshUser } = useAuth();

  const params = useLocalSearchParams<{
    fullName: string;
    username: string;
    email: string;
    bio: string;
  }>();

  const [fullName, setFullName] = useState(params.fullName ?? "");
  const [username, setUsername] = useState(params.username ?? "");
  const [email, setEmail] = useState(params.email ?? "");
  const [bio, setBio] = useState(params.bio ?? "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);

  const goBack = () => router.replace("/Profile");

  const handleSave = async () => {
    if (!fullName.trim()) {
      Alert.alert("Validation", "Full name cannot be empty.");
      return;
    }
    if (!username.trim()) {
      Alert.alert("Validation", "Username cannot be empty.");
      return;
    }
    setSaving(true);
    try {
      const token = await getToken();
      const body: Record<string, string> = {
        fullName: fullName.trim(),
        username: username.trim(),
        email: email.trim(),
        bio: bio.trim(),
      };
      if (currentPassword) body.currentPassword = currentPassword;

      const res = await fetch(`${API_URL}/users/me`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(body),
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

      await refreshUser();
      Alert.alert("Success", "Profile updated.", [{ text: "OK", onPress: goBack }]);
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
        <Text style={[styles.headerTitle, { color: colors.text }]}>Edit Profile</Text>
        <TouchableOpacity onPress={handleSave} disabled={saving}>
          {saving ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <Text style={[styles.saveBtn, { color: colors.primary }]}>Save</Text>
          )}
        </TouchableOpacity>
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
          {/* Profile fields */}
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.fieldGroup}>
              <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Full name</Text>
              <TextInput
                style={[styles.fieldInput, { color: colors.text, backgroundColor: colors.inputBg }]}
                value={fullName}
                onChangeText={setFullName}
                placeholder="Your full name"
                placeholderTextColor={colors.textSecondary}
                autoCapitalize="words"
              />
            </View>

            <View style={[styles.divider, { backgroundColor: colors.border }]} />

            <View style={styles.fieldGroup}>
              <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Username</Text>
              <TextInput
                style={[styles.fieldInput, { color: colors.text, backgroundColor: colors.inputBg }]}
                value={username}
                onChangeText={setUsername}
                placeholder="username"
                placeholderTextColor={colors.textSecondary}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View style={[styles.divider, { backgroundColor: colors.border }]} />

            <View style={styles.fieldGroup}>
              <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Email</Text>
              <TextInput
                style={[styles.fieldInput, { color: colors.text, backgroundColor: colors.inputBg }]}
                value={email}
                onChangeText={setEmail}
                placeholder="you@example.com"
                placeholderTextColor={colors.textSecondary}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View style={[styles.divider, { backgroundColor: colors.border }]} />

            <View style={styles.fieldGroup}>
              <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Bio</Text>
              <TextInput
                style={[
                  styles.fieldInput,
                  styles.bioInput,
                  { color: colors.text, backgroundColor: colors.inputBg },
                ]}
                value={bio}
                onChangeText={setBio}
                placeholder="Tell the world about yourself..."
                placeholderTextColor={colors.textSecondary}
                multiline
                maxLength={300}
              />
              <Text style={[styles.charCount, { color: colors.textSecondary }]}>
                {bio.length}/300
              </Text>
            </View>
          </View>

          {/* Confirm changes */}
          <Text style={[styles.sectionHeader, { color: colors.textSecondary }]}>
            CONFIRM CHANGES
          </Text>
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.fieldGroup}>
              <View style={styles.fieldLabelRow}>
                <Ionicons name="lock-closed-outline" size={13} color={colors.textSecondary} />
                <Text style={[styles.fieldLabel, { color: colors.textSecondary, marginLeft: 5, marginBottom: 0 }]}>
                  Current password
                </Text>
              </View>
              <View style={[styles.passwordRow, { backgroundColor: colors.inputBg }]}>
                <TextInput
                  style={[styles.passwordInput, { color: colors.text }]}
                  value={currentPassword}
                  onChangeText={setCurrentPassword}
                  placeholder="Required only if changing username or email"
                  placeholderTextColor={colors.textSecondary}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword((v) => !v)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons
                    name={showPassword ? "eye-off-outline" : "eye-outline"}
                    size={20}
                    color={colors.textSecondary}
                  />
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Change password link */}
          <TouchableOpacity
            style={styles.changePasswordLink}
            onPress={() => router.push("/ChangePassword")}
            activeOpacity={0.7}
          >
            <Text style={[styles.changePasswordText, { color: colors.primary }]}>
              Change your password →
            </Text>
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
  saveBtn: { fontSize: 16, fontWeight: "700" },
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
  fieldGroup: { paddingHorizontal: 16, paddingVertical: 12 },
  fieldLabelRow: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
  fieldLabel: { fontSize: 12, fontWeight: "600", marginBottom: 6 },
  fieldInput: {
    fontSize: 15,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  bioInput: { minHeight: 80, textAlignVertical: "top" },
  charCount: { fontSize: 11, textAlign: "right", marginTop: 4 },
  divider: { height: 0.5, marginHorizontal: 16 },
  passwordRow: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  passwordInput: { flex: 1, fontSize: 15 },
  changePasswordLink: {
    alignSelf: "center",
    marginTop: 28,
    paddingVertical: 4,
  },
  changePasswordText: { fontSize: 15, fontWeight: "600" },
});
