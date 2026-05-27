import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { NumericKeypad } from "../../src/components/numeric-keypad";
import { PinDots } from "../../src/components/pin-dots";
import { pinAuthService } from "../../src/services/auth";
import { useAuthStore } from "../../src/stores/auth-store";
import { themeTokens } from "../../src/core/theme";
import * as Haptics from "expo-haptics";

type Phase = "question" | "setNew";

const QUESTIONS = [
  "Nama hewan peliharaan pertama?",
  "Nama jalan rumah masa kecil?",
  "Hobi pertama yang kamu sukai?",
];

export default function PinRecoveryScreen() {
  const router = useRouter();
  const unlock = useAuthStore((s) => s.unlock);

  const [phase, setPhase] = useState<Phase>("question");
  const [storedQuestion, setStoredQuestion] = useState<string | null>(null);
  const [answer, setAnswer] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    pinAuthService.getRecoveryQuestion().then((q) => {
      setStoredQuestion(q ?? QUESTIONS[0]);
      setLoading(false);
    });
  }, []);

  const onSubmitAnswer = async () => {
    if (answer.trim().length < 3) {
      setError("Min 3 karakter");
      return;
    }
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const ok = await pinAuthService.resetPinViaRecovery(answer, "TEMP1234");
    if (ok) {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setPhase("setNew");
      setError("");
    } else {
      setError("Jawaban salah");
      setAnswer("");
    }
  };

  const onNewDigit = (digit: string) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setError("");

    if (phase === "setNew" && newPin.length < 6) {
      const next = newPin + digit;
      setNewPin(next);
      if (next.length === 6) setTimeout(() => setConfirmPin(""), 80);
    } else if (phase === "setNew" && confirmPin.length < 6) {
      const next = confirmPin + digit;
      setConfirmPin(next);
      if (next.length === 6) {
        if (next === newPin) {
          void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          void (async () => {
            await pinAuthService.changePin("TEMP1234", next);
            unlock();
            router.replace("/");
          })();
        } else {
          void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          setError("PIN tidak cocok");
          setNewPin("");
          setConfirmPin("");
        }
      }
    }
  };

  const onBackspace = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (confirmPin.length > 0) setConfirmPin((p) => p.slice(0, -1));
    else if (newPin.length > 0) setNewPin((p) => p.slice(0, -1));
  };

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={themeTokens.colors.accentPrimary} size="large" />
      </View>
    );
  }

  const TEXT_KEYS = "QWERTYUIOPASDFGHJKLZXCVBNM".split("");

  return (
    <View style={styles.container}>
      <View style={styles.topArea}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backLabel}>← Kembali</Text>
        </Pressable>

        {phase === "question" && (
          <>
            <Text style={styles.title}>Lupa PIN</Text>
            <Text style={styles.eyebrow}>Jawaban pertanyaan pemulihan</Text>
            <Text style={styles.question}>{storedQuestion}</Text>
            <Text style={styles.answerDisplay}>{answer || "(ketik jawaban)"}</Text>
            {error ? <Text style={styles.error}>{error}</Text> : null}
          </>
        )}

        {phase === "setNew" && (
          <>
            <Text style={styles.title}>
              {confirmPin.length === 6 && newPin.length === 6 ? "Konfirmasi" : "PIN Baru"}
            </Text>
            <Text style={styles.eyebrow}>
              {newPin.length < 6 ? "Masukkan 6 digit PIN baru" : "Ketik ulang PIN"}
            </Text>
            <PinDots filled={confirmPin.length > 0 ? confirmPin.length : newPin.length} />
            {error ? <Text style={styles.error}>{error}</Text> : null}
          </>
        )}
      </View>

      <View style={styles.keypadArea}>
        {phase === "question" ? (
          <View style={styles.textKeypad}>
            {["QWERTYUIOP", "ASDFGHJKL", "ZXCVBNM⌫"].map((row, ri) => (
              <View key={ri} style={styles.textRow}>
                {row.split("").map((k) => {
                  const isBack = k === "⌫";
                  return (
                    <Pressable
                      key={k}
                      style={[styles.textKey, isBack && styles.textKeyBack]}
                      onPress={() => {
                        if (isBack) {
                          setAnswer((a) => a.slice(0, -1));
                        } else {
                          setAnswer((a) => a + k.toLowerCase());
                        }
                        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      }}
                    >
                      <Text style={[styles.textKeyLabel, isBack && styles.textKeyLabelBack]}>
                        {k}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            ))}
            <Pressable
              style={[styles.goBtn, answer.trim().length < 3 && styles.goBtnDisabled]}
              onPress={onSubmitAnswer}
              disabled={answer.trim().length < 3}
            >
              <Text style={styles.goLabel}>VERIFIKASI →</Text>
            </Pressable>
          </View>
        ) : (
          <NumericKeypad onDigit={onNewDigit} onBackspace={onBackspace} />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: themeTokens.colors.background, paddingTop: 60 },
  loading: { flex: 1, backgroundColor: themeTokens.colors.background, alignItems: "center", justifyContent: "center" },
  topArea: { alignItems: "center", gap: 12, paddingHorizontal: 24 },
  backBtn: { position: "absolute", top: 12, left: 12, zIndex: 1 },
  backLabel: { color: themeTokens.colors.textSecondary, fontSize: 12, fontWeight: "700", letterSpacing: 1, textTransform: "uppercase" },
  title: { color: themeTokens.colors.textPrimary, fontSize: 26, fontWeight: "800", textTransform: "uppercase", marginTop: 24 },
  eyebrow: { color: themeTokens.colors.textSecondary, fontSize: 11, fontWeight: "700", letterSpacing: 1.2, textTransform: "uppercase" },
  question: { color: themeTokens.colors.textPrimary, fontSize: 15, fontWeight: "600", textAlign: "center", paddingHorizontal: 8 },
  answerDisplay: { color: themeTokens.colors.textPrimary, fontSize: 20, fontWeight: "600", letterSpacing: 1 },
  error: { color: themeTokens.colors.danger, fontSize: 12, fontWeight: "700", textTransform: "uppercase" },
  keypadArea: { flex: 1, justifyContent: "flex-end", alignItems: "center", paddingBottom: 48 },
  textKeypad: { alignItems: "center", gap: 6, paddingHorizontal: 16 },
  textRow: { flexDirection: "row", gap: 6 },
  textKey: { width: 34, height: 46, backgroundColor: themeTokens.colors.surfaceLow, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  textKeyBack: { backgroundColor: themeTokens.colors.surfaceHigh },
  textKeyLabel: { color: themeTokens.colors.textPrimary, fontSize: 14, fontWeight: "600" },
  textKeyLabelBack: { fontSize: 18, color: themeTokens.colors.textSecondary },
  goBtn: { backgroundColor: themeTokens.colors.accentPrimary, borderRadius: 8, paddingHorizontal: 28, paddingVertical: 14, marginTop: 12 },
  goBtnDisabled: { opacity: 0.35 },
  goLabel: { color: themeTokens.colors.backgroundDeep, fontSize: 13, fontWeight: "800", letterSpacing: 1.2, textTransform: "uppercase" },
});