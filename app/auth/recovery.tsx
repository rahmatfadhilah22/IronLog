import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { useRouter } from "expo-router";
import { NumericKeypad } from "../../src/components/numeric-keypad";
import { PinDots } from "../../src/components/pin-dots";
import { pinAuthService } from "../../src/services/auth";
import { useAuthStore } from "../../src/stores/auth-store";
import { themeTokens } from "../../src/core/theme";
import * as Haptics from "expo-haptics";

type Phase = "question" | "newPin" | "confirmNew";

const QUESTIONS = [
  "What was your first pet's name?",
  "What street did you grow up on?",
  "What was your first favorite hobby?",
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
  const savingRef = useRef(false);

  useEffect(() => {
    pinAuthService.getRecoveryQuestion().then((q) => {
      setStoredQuestion(q ?? QUESTIONS[0]);
      setLoading(false);
    });
  }, []);

  const onSubmitAnswer = async () => {
    if (answer.trim().length < 3) {
      setError("Answer must be at least 3 characters.");
      return;
    }
    if (savingRef.current) return;
    savingRef.current = true;
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const isCorrect = await pinAuthService.checkRecoveryAnswer(answer);
    if (isCorrect) {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setPhase("newPin");
      setError("");
    } else {
      setError("Incorrect answer.");
      setAnswer("");
    }
    savingRef.current = false;
  };

  const onNewDigit = (digit: string) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setError("");

    if (phase === "newPin" && newPin.length < 6) {
      const next = newPin + digit;
      setNewPin(next);
      if (next.length === 6) setTimeout(() => { setConfirmPin(""); setPhase("confirmNew"); }, 80);
    } else if (phase === "confirmNew" && confirmPin.length < 6) {
      const next = confirmPin + digit;
      setConfirmPin(next);
      if (next.length === 6) {
        if (next === newPin) {
          void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          void (async () => {
            const ok = await pinAuthService.resetPinViaRecovery(answer, next);
            if (ok) {
              unlock();
              router.replace("/");
            } else {
              setError("Failed to reset PIN.");
              setSaving(false);
            }
          })();
        } else {
          void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          setError("PIN does not match.");
          setNewPin("");
          setConfirmPin("");
          setPhase("newPin");
        }
      }
    }
  };

  const [saving, setSaving] = useState(false);

  const onBackspace = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (phase === "confirmNew" && confirmPin.length > 0) {
      setConfirmPin((p) => p.slice(0, -1));
    } else if (phase === "confirmNew" && confirmPin.length === 0 && newPin.length > 0) {
      setNewPin((p) => p.slice(0, -1));
    } else if (phase === "newPin" && newPin.length > 0) {
      setNewPin((p) => p.slice(0, -1));
    }
  };

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={themeTokens.colors.accentPrimary} size="large" />
      </View>
    );
  }

  const isPinPhase = phase === "newPin" || phase === "confirmNew";

  return (
    <View style={styles.container}>
      <View style={[styles.contentWrap, isPinPhase && styles.contentWrapPin]}>
        <View style={[styles.topArea, isPinPhase && styles.topAreaPin]}>
          {phase === "question" ? (
            <>
              <Text style={styles.title}>Forgot PIN</Text>
              <Text style={styles.eyebrow}>Answer your recovery question</Text>
              <Text style={styles.question}>{storedQuestion}</Text>
              <TextInput
                style={styles.textInput}
                value={answer}
                onChangeText={setAnswer}
                placeholder="Type your answer"
                placeholderTextColor={themeTokens.colors.textSecondary}
                autoCapitalize="words"
                autoCorrect={false}
              />
              {error ? <Text style={styles.error}>{error}</Text> : null}
              <Pressable
                style={[styles.verifyBtn, answer.trim().length < 3 && styles.verifyBtnDisabled]}
                onPress={onSubmitAnswer}
                disabled={answer.trim().length < 3}
              >
                <Text style={styles.verifyLabel}>VERIFY</Text>
              </Pressable>
            </>
          ) : (
            <>
              <Text style={styles.eyebrow}>RESET PIN</Text>
              <Text style={styles.titlePin}>
                {phase === "confirmNew" ? "Confirm PIN" : "New PIN"}
              </Text>
              <Text style={styles.eyebrow2}>
                {phase === "newPin" ? "Enter your new 6-digit PIN" : "Re-enter your new PIN"}
              </Text>
              <PinDots filled={phase === "confirmNew" ? confirmPin.length : newPin.length} />
              {error ? <Text style={styles.error}>{error}</Text> : null}
            </>
          )}
        </View>
      </View>

      {isPinPhase && (
        <View style={styles.keypadArea}>
          <NumericKeypad onDigit={onNewDigit} onBackspace={onBackspace} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: themeTokens.colors.background },
  loading: { flex: 1, backgroundColor: themeTokens.colors.background, alignItems: "center", justifyContent: "center" },
  contentWrap: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  contentWrapPin: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  topArea: { alignItems: "center", gap: 10, paddingHorizontal: 24 },
  topAreaPin: { paddingTop: 48, marginTop: 48 },
  title: { color: themeTokens.colors.accentPrimary, fontSize: 26, fontWeight: "800", textTransform: "uppercase", letterSpacing: 2 },
  titlePin: { color: themeTokens.colors.accentPrimary, fontSize: 32, fontWeight: "800", letterSpacing: 2, textTransform: "uppercase" },
  eyebrow: { color: themeTokens.colors.textSecondary, fontSize: 11, fontWeight: "700", letterSpacing: 1.2, textTransform: "uppercase" },
  eyebrow2: { color: themeTokens.colors.textSecondary, fontSize: 11, fontWeight: "700", letterSpacing: 1.2, textTransform: "uppercase" },
  question: { color: themeTokens.colors.textPrimary, fontSize: 15, fontWeight: "600", textAlign: "center", paddingHorizontal: 8 },
  textInput: {
    backgroundColor: themeTokens.colors.surfaceLow,
    borderRadius: themeTokens.radius.sm,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 18,
    fontWeight: "600",
    color: themeTokens.colors.textPrimary,
    width: "100%",
    maxWidth: 300,
    textAlign: "center",
  },
  error: { color: themeTokens.colors.danger, fontSize: 12, fontWeight: "700", textTransform: "uppercase" },
  verifyBtn: { backgroundColor: themeTokens.colors.accentPrimary, borderRadius: 8, paddingHorizontal: 32, paddingVertical: 14, marginTop: 4 },
  verifyBtnDisabled: { opacity: 0.35 },
  verifyLabel: { color: themeTokens.colors.backgroundDeep, fontSize: 13, fontWeight: "800", letterSpacing: 1.2, textTransform: "uppercase" },
  keypadArea: { flex: 1, justifyContent: "flex-start", alignItems: "center", marginTop: -48, paddingBottom: 48 },
});
