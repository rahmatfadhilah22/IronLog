import { useState } from "react";
import { BackHandler, Pressable, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { NumericKeypad } from "../../src/components/numeric-keypad";
import { PinDots } from "../../src/components/pin-dots";
import { pinAuthService } from "../../src/services/auth";
import { useAuthStore } from "../../src/stores/auth-store";
import { themeTokens } from "../../src/core/theme";
import * as Haptics from "expo-haptics";

const RECOVERY_QUESTIONS = [
  "Nama hewan peliharaan pertama?",
  "Nama jalan rumah masa kecil?",
  "Hobi pertama yang kamu sukai?",
];

type Step = "enter" | "confirm" | "recovery";

export default function PinSetupScreen() {
  const router = useRouter();
  const unlock = useAuthStore((s) => s.unlock);

  const [step, setStep] = useState<Step>("enter");
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [error, setError] = useState("");
  const [recoveryQuestion, setRecoveryQuestion] = useState(RECOVERY_QUESTIONS[0]);
  const [recoveryAnswer, setRecoveryAnswer] = useState("");
  const [saving, setSaving] = useState(false);

  // Intercept back button during setup
  useState(() => {
    const sub = BackHandler.addEventListener("hardwareBackPress", () => true);
    return () => sub.remove();
  });

  const appendDigit = (digit: string) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setError("");

    if (step === "enter" && pin.length < 6) {
      const next = pin + digit;
      setPin(next);
      if (next.length === 6) setTimeout(() => setStep("confirm"), 120);
    } else if (step === "confirm" && confirmPin.length < 6) {
      const next = confirmPin + digit;
      setConfirmPin(next);
      if (next.length === 6) {
        if (next === pin) {
          void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          setStep("recovery");
        } else {
          void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          setError("PIN tidak cocok. Ulangi.");
          setPin("");
          setConfirmPin("");
          setStep("enter");
        }
      }
    }
  };

  const onBackspace = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (step === "enter" && pin.length > 0) setPin((p) => p.slice(0, -1));
    if (step === "confirm" && confirmPin.length > 0) setConfirmPin((p) => p.slice(0, -1));
  };

  const onAnswerKey = (key: string) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (key === "⌫") {
      setRecoveryAnswer((a) => a.slice(0, -1));
    } else {
      setRecoveryAnswer((a) => a + key);
    }
  };

  const onFinish = async () => {
    if (recoveryAnswer.trim().length < 3) {
      setError("Jawaban minimal 3 karakter.");
      return;
    }
    setSaving(true);
    try {
      await pinAuthService.setupPin(pin, recoveryQuestion, recoveryAnswer.trim());
      unlock();
      router.replace("/");
    } catch {
      setError("Gagal menyimpan PIN. Coba lagi.");
      setSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.topArea}>
        {step === "enter" && (
          <>
            <Text style={styles.stepLabel}>STEP 1 / 3</Text>
            <Text style={styles.title}>Buat PIN</Text>
            <Text style={styles.subtitle}>Masukkan 6 digit PIN</Text>
          </>
        )}
        {step === "confirm" && (
          <>
            <Text style={styles.stepLabel}>STEP 2 / 3</Text>
            <Text style={styles.title}>Konfirmasi PIN</Text>
            <Text style={styles.subtitle}>Ketik ulang PIN</Text>
          </>
        )}
        {step === "recovery" && (
          <>
            <Text style={styles.stepLabel}>STEP 3 / 3</Text>
            <Text style={styles.title}>Pertanyaan Pemulihan</Text>
            <Text style={styles.subtitle}>Pilih satu dan jawab untuk reset PIN nanti</Text>
          </>
        )}

        <View style={styles.dotsRow}>
          <PinDots filled={step === "enter" ? pin.length : step === "confirm" ? confirmPin.length : 0} />
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}
      </View>

      <View style={styles.keypadArea}>
        {step !== "recovery" ? (
          <NumericKeypad onDigit={appendDigit} onBackspace={onBackspace} />
        ) : (
          <View style={styles.recoveryForm}>
            <Text style={styles.chipGroupLabel}>Pilih pertanyaan:</Text>
            <View style={styles.chipGroup}>
              {RECOVERY_QUESTIONS.map((q) => (
                <Pressable
                  key={q}
                  style={[styles.chip, recoveryQuestion === q ? styles.chipSelected : null]}
                  onPress={() => setRecoveryQuestion(q)}
                >
                  <Text style={[styles.chipText, recoveryQuestion === q ? styles.chipTextSelected : null]}>
                    {q}
                  </Text>
                </Pressable>
              ))}
            </View>

            <Text style={styles.chipGroupLabel}>Jawaban:</Text>
            <Text style={styles.answerDisplay}>{recoveryAnswer || "(ketik di bawah)"}</Text>

            <View style={styles.miniKeypadRow}>
              {[
                ["Q","W","E","R","T","Y","U","I","O","P"],
                ["A","S","D","F","G","H","J","K","L"],
                ["Z","X","C","V","B","N","M","⌫"],
              ].map((row, ri) => (
                <View key={ri} style={styles.miniKeyRow}>
                  {row.map((key) => {
                    const isBackspace = key === "⌫";
                    return (
                      <Pressable
                        key={key}
                        style={[styles.miniKey, isBackspace ? styles.miniKeyBack : null]}
                        onPress={() => onAnswerKey(key)}
                      >
                        <Text style={[styles.miniKeyText, isBackspace ? styles.miniKeyTextBack : null]}>
                          {key}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              ))}
            </View>

            <Text style={styles.charCount}>
              {recoveryAnswer.length} karakter {recoveryAnswer.trim().length >= 3 ? "✓" : "— min 3"}
            </Text>

            <Pressable
              style={[
                styles.finishButton,
                recoveryAnswer.trim().length < 3 || saving ? styles.finishButtonDisabled : null,
              ]}
              onPress={onFinish}
            >
              <Text style={styles.finishLabel}>{saving ? "MENYIMPAN..." : "SELESAI"}</Text>
            </Pressable>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: themeTokens.colors.background, paddingTop: 60 },
  topArea: { alignItems: "center", gap: themeTokens.spacing.md, paddingHorizontal: 24 },
  stepLabel: {
    color: themeTokens.colors.accentPrimary,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.5,
    textTransform: "uppercase",
  },
  title: {
    color: themeTokens.colors.textPrimary,
    fontSize: 28,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  subtitle: {
    color: themeTokens.colors.textSecondary,
    fontSize: 12,
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  dotsRow: { marginTop: themeTokens.spacing.sm },
  error: {
    color: themeTokens.colors.danger,
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  keypadArea: {
    flex: 1,
    justifyContent: "flex-end",
    alignItems: "center",
    paddingBottom: 48,
  },
  recoveryForm: { alignItems: "center", gap: 12, paddingHorizontal: 24, width: "100%" },
  chipGroupLabel: {
    color: themeTokens.colors.textSecondary,
    fontSize: 11,
    letterSpacing: 1,
    textTransform: "uppercase",
    fontWeight: "700",
    alignSelf: "flex-start",
    paddingLeft: 4,
  },
  chipGroup: { flexDirection: "row", flexWrap: "wrap", justifyContent: "center", gap: 8, width: "100%" },
  chip: {
    backgroundColor: themeTokens.colors.surfaceLow,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 7,
    maxWidth: 180,
  },
  chipSelected: { backgroundColor: themeTokens.colors.accentPrimary },
  chipText: {
    color: themeTokens.colors.textSecondary,
    fontSize: 12,
    fontWeight: "700",
    textAlign: "center",
  },
  chipTextSelected: { color: themeTokens.colors.backgroundDeep },
  answerDisplay: {
    color: themeTokens.colors.textPrimary,
    fontSize: 18,
    fontWeight: "600",
    letterSpacing: 1,
    minHeight: 24,
  },
  miniKeypadRow: { gap: 4 },
  miniKeyRow: { flexDirection: "row", gap: 4 },
  miniKey: {
    width: 34,
    height: 44,
    backgroundColor: themeTokens.colors.surfaceLow,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  miniKeyBack: { backgroundColor: themeTokens.colors.surfaceHigh },
  miniKeyText: { color: themeTokens.colors.textPrimary, fontSize: 15, fontWeight: "600" },
  miniKeyTextBack: { color: themeTokens.colors.textSecondary, fontSize: 18 },
  charCount: {
    color: themeTokens.colors.textSecondary,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1,
  },
  finishButton: {
    backgroundColor: themeTokens.colors.accentPrimary,
    borderRadius: themeTokens.radius.sm,
    paddingHorizontal: 48,
    paddingVertical: 14,
  },
  finishButtonDisabled: { opacity: 0.4 },
  finishLabel: {
    color: themeTokens.colors.backgroundDeep,
    fontSize: 14,
    fontWeight: "800",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
});