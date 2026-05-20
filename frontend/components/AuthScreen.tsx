import React, { useState } from "react";
import {
  ActivityIndicator,
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
import { useRouter } from "expo-router";

// Auth screen renders before ThemeProvider is in scope — colours are fixed here.

// ─── Input field ──────────────────────────────────────────────────────────────

function InputField({
  placeholder,
  value,
  onChangeText,
  secureTextEntry = false,
  keyboardType = "default",
  autoCapitalize = "none",
}: {
  placeholder: string;
  value: string;
  onChangeText: (t: string) => void;
  secureTextEntry?: boolean;
  keyboardType?: "default" | "email-address";
  autoCapitalize?: "none" | "words";
}) {
  const [focused, setFocused] = useState(false);
  const [visible, setVisible] = useState(!secureTextEntry);

  return (
    <View style={[styles.inputWrap, focused && styles.inputFocused]}>
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor="#aaa"
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={secureTextEntry && !visible}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      />
      {secureTextEntry && (
        <TouchableOpacity onPress={() => setVisible(!visible)} style={styles.eyeBtn}>
          <Text style={styles.eyeIcon}>{visible ? "👁" : "🙈"}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function AuthScreen() {
  const { login, register } = useAuth();
  const router = useRouter();

  const [mode, setMode] = useState<"login" | "register">("login");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Login fields
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Register fields
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const switchMode = (next: "login" | "register") => {
    setError("");
    setMode(next);
  };

  // ── Login ──────────────────────────────────────────────────────────────────

  const handleLogin = async () => {
    setError("");
    if (!email.trim() || !password.trim()) {
      setError("Veuillez remplir tous les champs.");
      return;
    }
    setLoading(true);
    const result = await login(email.trim(), password);
    setLoading(false);
    if (!result.success) setError(result.error ?? "Erreur inconnue.");
  };

  // ── Register ───────────────────────────────────────────────────────────────

  const handleRegister = async () => {
    setError("");

    if (!fullName.trim() || !username.trim() || !regEmail.trim() || !regPassword.trim()) {
      setError("Veuillez remplir tous les champs.");
      return;
    }
    if (username.trim().length < 3) {
      setError("Le nom d'utilisateur doit contenir au moins 3 caractères.");
      return;
    }
    if (regPassword.length < 6) {
      setError("Le mot de passe doit contenir au moins 6 caractères.");
      return;
    }
    if (regPassword !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }

    setLoading(true);
    const result = await register({
      fullName: fullName.trim(),
      username: username.trim().toLowerCase(),
      email: regEmail.trim().toLowerCase(),
      password: regPassword,
    });
    setLoading(false);
    if (!result.success) setError(result.error ?? "Erreur inconnue.");
    // On success AuthGuard redirects automatically
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.screen}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Logo */}
          <View style={styles.logoSection}>
            <Text style={styles.logo}>Sharely</Text>
            <Text style={styles.subtitle}>
              {mode === "login"
                ? "Connectez-vous pour continuer"
                : "Créez votre compte gratuitement"}
            </Text>
          </View>

          {/* Mode tabs */}
          <View style={styles.modeTabs}>
            <TouchableOpacity
              style={[styles.modeTab, mode === "login" && styles.modeTabActive]}
              onPress={() => switchMode("login")}
            >
              <Text style={[styles.modeTabText, mode === "login" && styles.modeTabTextActive]}>
                Connexion
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modeTab, mode === "register" && styles.modeTabActive]}
              onPress={() => switchMode("register")}
            >
              <Text style={[styles.modeTabText, mode === "register" && styles.modeTabTextActive]}>
                Inscription
              </Text>
            </TouchableOpacity>
          </View>

          {/* Error */}
          {error !== "" && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{"⚠️  " + error}</Text>
            </View>
          )}

          {mode === "login" ? (
            /* ── Login form ─────────────────────────────────────────────── */
            <View style={styles.form}>
              <InputField
                placeholder="Email"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
              />
              <InputField
                placeholder="Mot de passe"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />

              <TouchableOpacity
                style={styles.forgotBtn}
                onPress={() => router.push("/ForgotPassword")}
              >
                <Text style={styles.forgotText}>Mot de passe oublié ?</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.submitBtn, loading && styles.submitDisabled]}
                onPress={handleLogin}
                disabled={loading}
                activeOpacity={0.85}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.submitText}>Se connecter</Text>
                )}
              </TouchableOpacity>
            </View>
          ) : (
            /* ── Register form ──────────────────────────────────────────── */
            <View style={styles.form}>
              <InputField
                placeholder="Nom complet"
                value={fullName}
                onChangeText={setFullName}
                autoCapitalize="words"
              />
              <InputField
                placeholder="Nom d'utilisateur"
                value={username}
                onChangeText={setUsername}
              />
              <InputField
                placeholder="Email"
                value={regEmail}
                onChangeText={setRegEmail}
                keyboardType="email-address"
              />
              <InputField
                placeholder="Mot de passe (min. 6 caractères)"
                value={regPassword}
                onChangeText={setRegPassword}
                secureTextEntry
              />
              <InputField
                placeholder="Confirmer le mot de passe"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
              />

              <TouchableOpacity
                style={[styles.submitBtn, loading && styles.submitDisabled]}
                onPress={handleRegister}
                disabled={loading}
                activeOpacity={0.85}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.submitText}>Créer mon compte</Text>
                )}
              </TouchableOpacity>
            </View>
          )}

          {/* Dev hint box */}
          <View style={styles.hintBox}>
            <Text style={styles.hintTitle}>Comptes existants :</Text>
            <Text style={styles.hintItem}>mehdi@gmail.com / mehdi123</Text>
            <Text style={styles.hintItem}>alex@gmail.com / alex123</Text>
            <Text style={styles.hintItem}>maria@gmail.com / maria123</Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Bottom toggle */}
      <View style={styles.bottomBar}>
        {mode === "login" ? (
          <>
            <Text style={styles.bottomText}>Pas encore de compte ? </Text>
            <TouchableOpacity onPress={() => switchMode("register")}>
              <Text style={styles.bottomLink}>S'inscrire</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <Text style={styles.bottomText}>Déjà un compte ? </Text>
            <TouchableOpacity onPress={() => switchMode("login")}>
              <Text style={styles.bottomLink}>Se connecter</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#fff" },
  scroll: { paddingHorizontal: 28, paddingTop: 40, paddingBottom: 24 },

  logoSection: { alignItems: "center", marginBottom: 28 },
  logo: { fontSize: 42, fontWeight: "800", color: "#7C3AED", letterSpacing: 2 },
  subtitle: { fontSize: 13.5, color: "#8A8A8A", marginTop: 8, textAlign: "center" },

  // Mode tabs
  modeTabs: {
    flexDirection: "row",
    backgroundColor: "#F0F0F0",
    borderRadius: 50,
    padding: 4,
    marginBottom: 20,
  },
  modeTab: {
    flex: 1, paddingVertical: 10, borderRadius: 50, alignItems: "center",
  },
  modeTabActive: { backgroundColor: "#fff", elevation: 2, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 4 },
  modeTabText: { fontSize: 14, fontWeight: "600", color: "#8A8A8A" },
  modeTabTextActive: { color: "#7C3AED" },

  // Form
  form: { gap: 14, marginBottom: 20 },
  inputWrap: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: "#F4F4F4", borderWidth: 1.5, borderColor: "#E8E8E8",
    borderRadius: 14, paddingHorizontal: 16, height: 52,
  },
  inputFocused: { borderColor: "#7C3AED" },
  input: { flex: 1, fontSize: 14.5, color: "#1A1A1A" },
  eyeBtn: { padding: 6 },
  eyeIcon: { fontSize: 18 },

  forgotBtn: { alignSelf: "flex-end" },
  forgotText: { fontSize: 13, color: "#7C3AED", fontWeight: "600" },

  errorBox: {
    backgroundColor: "#fff3f3", borderRadius: 12, padding: 12,
    borderWidth: 1, borderColor: "#ffcccc", marginBottom: 12,
  },
  errorText: { color: "#c0392b", fontSize: 13 },

  submitBtn: {
    backgroundColor: "#7C3AED", borderRadius: 50,
    height: 52, alignItems: "center", justifyContent: "center",
  },
  submitDisabled: { opacity: 0.65 },
  submitText: { color: "#fff", fontWeight: "700", fontSize: 15.5, letterSpacing: 0.3 },

  // Dev hint
  hintBox: {
    marginTop: 28, backgroundColor: "#F5F0FF", borderRadius: 14,
    padding: 14, borderWidth: 1, borderColor: "#D8C8FF", gap: 4,
  },
  hintTitle: { fontSize: 13, fontWeight: "700", color: "#5B21B6", marginBottom: 4 },
  hintItem: { fontSize: 12, color: "#555" },

  bottomBar: {
    flexDirection: "row", justifyContent: "center",
    paddingVertical: 16, borderTopWidth: 1, borderTopColor: "#E8E8E8",
  },
  bottomText: { fontSize: 13.5, color: "#1A1A1A" },
  bottomLink: { fontSize: 13.5, color: "#7C3AED", fontWeight: "700" },
});
