import { useRouter } from "expo-router";
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

// ✅ Auth screen N'utilise PAS useTheme — il s'affiche AVANT que ThemeProvider
// soit accessible au niveau route. Les couleurs sont donc fixes ici.

function InputField({
  placeholder,
  value,
  onChangeText,
  secureTextEntry = false,
  keyboardType = "default",
}: {
  placeholder: string;
  value: string;
  onChangeText: (t: string) => void;
  secureTextEntry?: boolean;
  keyboardType?: "default" | "email-address";
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
        autoCapitalize="none"
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      />
      {secureTextEntry && (
        <TouchableOpacity
          onPress={() => setVisible(!visible)}
          style={styles.eyeBtn}
        >
          <Text style={styles.eyeIcon}>{visible ? "👁" : "🙈"}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

export default function AuthScreen() {
  const router = useRouter();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setError("");
    if (!email.trim() || !password.trim()) {
      setError("Veuillez remplir tous les champs.");
      return;
    }
    setLoading(true);
    const result = await login(email.trim(), password);
    setLoading(false);
    if (!result.success) {
      setError(result.error ?? "Erreur inconnue.");
    }
    // ✅ Pas de router.replace() — AuthGuard redirige automatiquement
  };

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
          <View style={styles.logoSection}>
            <Text style={styles.logo}>Instagram</Text>
            <Text style={styles.subtitle}>Connectez-vous pour continuer</Text>
          </View>

          <View style={styles.form}>
            <InputField
              placeholder="Email ou nom d'utilisateur"
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

            <TouchableOpacity style={styles.forgotBtn}>
              <Text style={styles.forgotText}>Mot de passe oublié ?</Text>
            </TouchableOpacity>

            {error !== "" && (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{"⚠️  " + error}</Text>
              </View>
            )}

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

          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>OU</Text>
            <View style={styles.dividerLine} />
          </View>

          <TouchableOpacity style={styles.facebookBtn}>
            <Text style={styles.facebookIcon}>f</Text>
            <Text style={styles.facebookText}>Continuer avec Facebook</Text>
          </TouchableOpacity>

          <View style={styles.hintBox}>
            <Text style={styles.hintTitle}>Comptes disponibles :</Text>
            <Text style={styles.hintItem}>mehdi@gmail.com / mehdi123</Text>
            <Text style={styles.hintItem}>alex@gmail.com / alex123</Text>
            <Text style={styles.hintItem}>maria@gmail.com / maria123</Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <View style={styles.bottomBar}>
        <Text style={styles.bottomText}>Vous n'avez pas de compte ? </Text>
        <TouchableOpacity>
          <Text style={styles.bottomLink}>S'inscrire.</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#fff" },
  scroll: { paddingHorizontal: 28, paddingTop: 48, paddingBottom: 24 },

  logoSection: { alignItems: "center", marginBottom: 36 },
  logo: {
    fontFamily: "serif",
    fontSize: 48,
    fontWeight: "600",
    color: "#000",
    letterSpacing: -1,
  },
  subtitle: { fontSize: 13.5, color: "#8e8e8e", marginTop: 6 },

  form: { gap: 12, marginBottom: 20 },
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fafafa",
    borderWidth: 1,
    borderColor: "#dbdbdb",
    borderRadius: 8,
    paddingHorizontal: 14,
    height: 50,
  },
  inputFocused: { borderColor: "#a0a0a0" },
  input: { flex: 1, fontSize: 14, color: "#262626" },
  eyeBtn: { padding: 6 },
  eyeIcon: { fontSize: 18 },

  forgotBtn: { alignSelf: "flex-end" },
  forgotText: { fontSize: 13, color: "#0095f6", fontWeight: "600" },

  errorBox: {
    backgroundColor: "#fff3f3",
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: "#ffcccc",
  },
  errorText: { color: "#c0392b", fontSize: 13 },

  submitBtn: {
    backgroundColor: "#0095f6",
    borderRadius: 8,
    height: 50,
    alignItems: "center",
    justifyContent: "center",
  },
  submitDisabled: { opacity: 0.65 },
  submitText: { color: "#fff", fontWeight: "700", fontSize: 15 },

  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 22,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: "#dbdbdb" },
  dividerText: {
    marginHorizontal: 14,
    color: "#8e8e8e",
    fontSize: 13,
    fontWeight: "600",
  },

  facebookBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  facebookIcon: { color: "#1877f2", fontSize: 22, fontWeight: "800" },
  facebookText: { color: "#1877f2", fontWeight: "700", fontSize: 14 },

  hintBox: {
    marginTop: 32,
    backgroundColor: "#f0f8ff",
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: "#cce5ff",
    gap: 4,
  },
  hintTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#0a558c",
    marginBottom: 4,
  },
  hintItem: { fontSize: 12, color: "#444" },

  bottomBar: {
    flexDirection: "row",
    justifyContent: "center",
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: "#dbdbdb",
  },
  bottomText: { fontSize: 13.5, color: "#262626" },
  bottomLink: { fontSize: 13.5, color: "#0095f6", fontWeight: "700" },
});
