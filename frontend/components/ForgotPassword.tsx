import React, { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { API_URL } from "../config/env";

// ── Input field ───────────────────────────────────────────────────────────────

function Field({
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
  keyboardType?: "default" | "email-address" | "number-pad";
}) {
  const [focused, setFocused] = useState(false);
  const [visible, setVisible] = useState(!secureTextEntry);

  return (
    <View style={[s.inputWrap, focused && s.inputFocused]}>
      <TextInput
        style={s.input}
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
        <Pressable onPress={() => setVisible(v => !v)} style={s.eyeBtn}>
          <Text style={s.eyeIcon}>{visible ? "👁" : "🙈"}</Text>
        </Pressable>
      )}
    </View>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const isValidEmail = (email: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

// ── Main screen ───────────────────────────────────────────────────────────────

export default function ForgotPasswordScreen() {
  const router = useRouter();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Step 1
  const [email, setEmail] = useState("");

  // Step 2
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // ── Handlers ─────────────────────────────────────────────────────────────────

  const handleSendCode = async () => {
    setError("");
    if (!email.trim()) {
      setError("Veuillez entrer votre email");
      return;
    }
    if (!isValidEmail(email)) {
      setError("Adresse email invalide");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 404) {
          setError("Aucun compte associé à cet email");
        } else {
          setError(data.message || "Erreur serveur");
        }
        return;
      }
      setStep(2);
    } catch {
      setError("Impossible de contacter le serveur");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    setError("");
    if (!code.trim() || !newPassword.trim() || !confirmPassword.trim()) {
      setError("Veuillez remplir tous les champs.");
      return;
    }
    if (newPassword.length < 6) {
      setError("Le mot de passe doit contenir au moins 6 caractères.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          code: code.trim(),
          newPassword,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Erreur serveur");
      setStep(3);
    } catch (e: any) {
      setError(e.message || "Erreur de connexion");
    } finally {
      setLoading(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={s.screen}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={s.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Back button */}
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => [s.backBtn, { opacity: pressed ? 0.6 : 1 }]}
          >
            <Text style={s.backText}>← Retour</Text>
          </Pressable>

          {/* Header */}
          <Text style={s.logo}>Sharely</Text>
          <Text style={s.pageTitle}>Mot de passe oublié</Text>

          {/* Step progress dots */}
          <View style={s.stepRow}>
            {([1, 2, 3] as const).map(n => (
              <View key={n} style={[s.dot, step >= n && s.dotActive]} />
            ))}
          </View>

          {/* Error banner */}
          {error !== "" && (
            <View style={s.errorBox}>
              <Text style={s.errorText}>⚠️  {error}</Text>
            </View>
          )}

          {/* ── Step 1: Enter email ─────────────────────────────────────────── */}
          {step === 1 && (
            <View style={s.form}>
              <Text style={s.stepTitle}>Étape 1 — Email</Text>
              <Text style={s.stepDesc}>
                Entrez l'adresse email associée à votre compte Sharely.
              </Text>

              <Field
                placeholder="Email"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
              />

              <Pressable
                style={({ pressed }) => [
                  s.btn,
                  loading && s.btnDisabled,
                  { opacity: pressed ? 0.85 : 1 },
                ]}
                onPress={handleSendCode}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={s.btnText}>Envoyer le code</Text>
                )}
              </Pressable>
            </View>
          )}

          {/* ── Step 2: Code + new password ────────────────────────────────── */}
          {step === 2 && (
            <View style={s.form}>
              <Text style={s.stepTitle}>Étape 2 — Vérification</Text>

              {/* Email-sent confirmation */}
              <View style={s.sentBox}>
                <Text style={s.sentIcon}>📧</Text>
                <View style={{ flex: 1 }}>
                  <Text style={s.sentTitle}>Code envoyé !</Text>
                  <Text style={s.sentDesc}>
                    Un code à 6 chiffres a été envoyé à{" "}
                    <Text style={s.sentEmail}>{email}</Text>
                    {"\n"}Vérifiez votre boîte de réception (et les spams).
                  </Text>
                </View>
              </View>

              <Field
                placeholder="Code à 6 chiffres"
                value={code}
                onChangeText={setCode}
                keyboardType="number-pad"
              />
              <Field
                placeholder="Nouveau mot de passe (min. 6 car.)"
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry
              />
              <Field
                placeholder="Confirmer le mot de passe"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
              />

              <Pressable
                style={({ pressed }) => [
                  s.btn,
                  loading && s.btnDisabled,
                  { opacity: pressed ? 0.85 : 1 },
                ]}
                onPress={handleReset}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={s.btnText}>Réinitialiser le mot de passe</Text>
                )}
              </Pressable>

              <Pressable
                style={({ pressed }) => [s.secondaryBtn, { opacity: pressed ? 0.6 : 1 }]}
                onPress={() => { setError(""); setCode(""); setStep(1); }}
              >
                <Text style={s.secondaryBtnText}>Renvoyer un code</Text>
              </Pressable>
            </View>
          )}

          {/* ── Step 3: Success ─────────────────────────────────────────────── */}
          {step === 3 && (
            <View style={s.successCard}>
              <Text style={s.successIcon}>✅</Text>
              <Text style={s.successTitle}>Mot de passe réinitialisé !</Text>
              <Text style={s.successDesc}>
                Vous pouvez maintenant vous connecter avec votre nouveau mot de passe.
              </Text>
              <Pressable
                style={({ pressed }) => [s.btn, { opacity: pressed ? 0.85 : 1 }]}
                onPress={() => router.replace("/Auth")}
              >
                <Text style={s.btnText}>Se connecter →</Text>
              </Pressable>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#fff" },
  scroll: { paddingHorizontal: 28, paddingTop: 24, paddingBottom: 48 },

  backBtn: { alignSelf: "flex-start", marginBottom: 16 },
  backText: { fontSize: 14, color: "#7C3AED", fontWeight: "600" },

  logo: {
    fontSize: 34,
    fontWeight: "800",
    color: "#7C3AED",
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  pageTitle: { fontSize: 22, fontWeight: "700", color: "#1A1A1A", marginBottom: 20 },

  stepRow: { flexDirection: "row", gap: 8, marginBottom: 24 },
  dot: { height: 8, width: 8, borderRadius: 4, backgroundColor: "#E0D4FF" },
  dotActive: { backgroundColor: "#7C3AED", width: 28, borderRadius: 4 },

  errorBox: {
    backgroundColor: "#fff3f3",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "#ffcccc",
    marginBottom: 16,
  },
  errorText: { color: "#c0392b", fontSize: 13 },

  form: { gap: 14 },

  stepTitle: { fontSize: 16, fontWeight: "700", color: "#1A1A1A" },
  stepDesc: { fontSize: 13, color: "#8A8A8A", lineHeight: 20 },

  // Email-sent info box
  sentBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    backgroundColor: "#F5F0FF",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#D8C8FF",
    padding: 16,
  },
  sentIcon: { fontSize: 28, lineHeight: 32 },
  sentTitle: { fontSize: 14, fontWeight: "700", color: "#7C3AED", marginBottom: 4 },
  sentDesc: { fontSize: 13, color: "#555", lineHeight: 19 },
  sentEmail: { fontWeight: "700", color: "#1A1A1A" },

  // Input
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F4F4F4",
    borderWidth: 1.5,
    borderColor: "#E8E8E8",
    borderRadius: 14,
    paddingHorizontal: 16,
    height: 52,
  },
  inputFocused: { borderColor: "#7C3AED" },
  input: { flex: 1, fontSize: 14.5, color: "#1A1A1A" },
  eyeBtn: { padding: 6 },
  eyeIcon: { fontSize: 18 },

  // Primary button
  btn: {
    backgroundColor: "#7C3AED",
    borderRadius: 50,
    height: 52,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },
  btnDisabled: { opacity: 0.65 },
  btnText: { color: "#fff", fontWeight: "700", fontSize: 15.5, letterSpacing: 0.3 },

  // Secondary link button
  secondaryBtn: { alignItems: "center", paddingVertical: 12 },
  secondaryBtnText: { fontSize: 13.5, color: "#7C3AED", fontWeight: "600" },

  // Success card
  successCard: {
    marginTop: 24,
    alignItems: "center",
    gap: 16,
    backgroundColor: "#F5F0FF",
    borderRadius: 20,
    padding: 32,
    borderWidth: 1,
    borderColor: "#D8C8FF",
  },
  successIcon: { fontSize: 56 },
  successTitle: { fontSize: 20, fontWeight: "800", color: "#1A1A1A", textAlign: "center" },
  successDesc: { fontSize: 14, color: "#555", textAlign: "center", lineHeight: 22 },
});
