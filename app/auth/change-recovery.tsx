import { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { useRouter } from "expo-router";
import { NumericKeypad } from "../../src/components/numeric-keypad";
import { PinDots } from "../../src/components/pin-dots";
import { pinAuthService } from "../../src/services/auth";
import { themeTokens } from "../../src/core/theme";
import * as Haptics from "expo-haptics";

type Phase = "verify" | "newQuestion" | "newAnswer";

const QUESTIONS = [
  "What was your first pet's name?",
  "What street did you grow up on?",
  "What was your first favorite hobby?",
];

export default function ChangeRecoveryScreen() {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("verify");
  const [currentPin, setCurrentPin] = useState("");
  const [selectedQuestion, setSelectedQuestion] = useState(QUESTIONS[0]);
  const [answer, setAnswer] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const onDigit = async (digit: string) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setError("");

    if (phase === "verify" && currentPin.length < 6) {
      const next = currentPin + digit;
      setCurrentPin(next);
      if (next.length === 6) {
        const valid = await pinAuthService.verifyPin(next);
        if (valid) {
          void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          setPhase("newQuestion");
        } else {
          void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          setError("PIN salah");
          setCurrentPin("");
        }
      }
    }
  };

  const onBackspace = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (phase === "verify") setCurrentPin((p) => p.slice(0, -1));
  };

  const onSelectQuestion = (q: string) => {
    setSelectedQuestion(q);
    setPhase("newAnswer");
    setAnswer("");
  };

  const onSubmitAnswer = async () => {
    if (answer.trim().length < 3) {
      setError("Answer must be at least 3 characters.");
      return;
    }
    setSaving(true);
    try {
      await pinAuthService.changeRecovery(currentPin, selectedQuestion, answer.trim());
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } catch {
      setError("Failed to save recovery question.");
      setSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.topArea}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backLabel}>← Batal</Text>
        </Pressable>

        {phase === "verify" && (
          <>
            <Text style={styles.eyebrow}>VERIFY PIN</Text>
            <Text style={styles.title}>Enter current PIN</Text>
            <PinDots filled={currentPin.length} />
          </>
        )}

        {phase === "newQuestion" && (
          <>
            <Text style={styles.eyebrow}>RECOVERY QUESTION</Text>
            <Text style={styles.title}>Choose a new question</Text>
            <View style={styles.questionList}>
              {QUESTIONS.map((q) => (
                <Pressable
                  key={q}
                  style={[styles.questionChip, selectedQuestion === q && styles.questionChipSelected]}
                  onPress={() => onSelectQuestion(q)}
                >
                  <Text style={[styles.questionChipText, selectedQuestion === q && styles.questionChipTextSelected]}>
                    {q}
                  </Text>
                </Pressable>
              ))}
            </View>
          </>
        )}

        {phase === "newAnswer" && (
          <>
            <Text style={styles.eyebrow}>NEW ANSWER</Text>
            <Text style={styles.question}>{selectedQuestion}</Text>
            <TextInput
              style={styles.answerInput}
              value={answer}
              onChangeText={setAnswer}
              placeholder="Type your answer"
              placeholderTextColor={themeTokens.colors.textSecondary}
              autoCapitalize="words"
              autoCorrect={false}
              returnKeyType="done"
            />
          </>
        )}

        {error ? <Text style={styles.error}>{error}</Text> : null}
        {saving ? <Text style={styles.info}>Saving...</Text> : null}
      </View>

      <View style={styles.keypadArea}>
        {phase === "newAnswer" ? (
          <View style={{ alignItems: "center", gap: 12 }}>
            <Pressable
              style={[styles.saveBtn, answer.trim().length < 3 && styles.saveBtnDisabled]}
              onPress={onSubmitAnswer}
              disabled={answer.trim().length < 3}
            >
              <Text style={styles.saveLabel}>SAVE</Text>
            </Pressable>
          </View>
        ) : (
          <NumericKeypad onDigit={onDigit} onBackspace={onBackspace} />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: themeTokens.colors.background, paddingTop: 60 },
  topArea: { alignItems: "center", gap: 12, paddingHorizontal: 24 },
  backBtn: { position: "absolute", top: 12, left: 12 },
  backLabel: { color: themeTokens.colors.textSecondary, fontSize: 12, fontWeight: "700", letterSpacing: 1, textTransform: "uppercase" },
  eyebrow: { color: themeTokens.colors.accentPrimary, fontSize: 11, fontWeight: "700", letterSpacing: 1.5, textTransform: "uppercase", marginTop: 20 },
  title: { color: themeTokens.colors.textPrimary, fontSize: 22, fontWeight: "800", textTransform: "uppercase" },
  questionList: { gap: 10, width: "100%", paddingHorizontal: 8 },
  questionChip: { backgroundColor: themeTokens.colors.surfaceLow, borderRadius: 10, paddingHorizontal: 16, paddingVertical: 10 },
  questionChipSelected: { backgroundColor: themeTokens.colors.accentPrimary },
  questionChipText: { color: themeTokens.colors.textSecondary, fontSize: 13, fontWeight: "700" },
  questionChipTextSelected: { color: themeTokens.colors.backgroundDeep },
  question: { color: themeTokens.colors.textPrimary, fontSize: 14, fontWeight: "600", textAlign: "center", paddingHorizontal: 8 },
  answerInput: {
    backgroundColor: themeTokens.colors.surfaceLow,
    borderRadius: themeTokens.radius.sm,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 18,
    fontWeight: "600",
    color: themeTokens.colors.textPrimary,
    width: "100%",
    maxWidth: 320,
    textAlign: "center",
  },
  error: { color: themeTokens.colors.danger, fontSize: 12, fontWeight: "700", textTransform: "uppercase" },
  info: { color: themeTokens.colors.textSecondary, fontSize: 12, fontWeight: "700", textTransform: "uppercase" },
  keypadArea: { flex: 1, justifyContent: "flex-end", alignItems: "center", paddingBottom: 48 },
  saveBtn: { backgroundColor: themeTokens.colors.accentPrimary, borderRadius: 8, paddingHorizontal: 32, paddingVertical: 14 },
  saveBtnDisabled: { opacity: 0.35 },
  saveLabel: { color: themeTokens.colors.backgroundDeep, fontSize: 13, fontWeight: "800", letterSpacing: 1.2, textTransform: "uppercase" },
});
