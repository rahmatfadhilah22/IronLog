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
          setError("Incorrect PIN");
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
      {(phase === "verify" || phase === "newQuestion") && (
        <View style={styles.authContent}>
          <View style={styles.topArea}>
            {phase === "verify" ? (
              <>
                <Text style={styles.title}>Verify PIN</Text>
                <Text style={styles.subtitle}>Enter your current PIN</Text>
                <PinDots filled={currentPin.length} />
              </>
            ) : (
              <>
                <Text style={styles.title}>Recovery Question</Text>
                <Text style={styles.subtitle}>Choose a new question</Text>
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
            {error ? <Text style={styles.error}>{error}</Text> : null}
            {saving ? <Text style={styles.info}>Saving...</Text> : null}
          </View>
        </View>
      )}

      {phase === "newAnswer" && (
        <View style={styles.answerContent}>
          <Text style={styles.title}>New Answer</Text>
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
          {error ? <Text style={styles.error}>{error}</Text> : null}
          {saving ? <Text style={styles.info}>Saving...</Text> : null}
          <Pressable
            style={[styles.saveBtn, answer.trim().length < 3 && styles.saveBtnDisabled]}
            onPress={onSubmitAnswer}
            disabled={answer.trim().length < 3}
          >
            <Text style={styles.saveLabel}>SAVE</Text>
          </Pressable>
        </View>
      )}

      {(phase === "verify" || phase === "newQuestion") && (
        <View style={styles.keypadArea}>
          {phase === "verify" ? (
            <NumericKeypad onDigit={onDigit} onBackspace={onBackspace} />
          ) : null}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: themeTokens.colors.background,
  },
  authContent: {
    flex: 1,
    justifyContent: "center",
    paddingTop: 0,
    paddingBottom: 0,
  },
  topArea: {
    alignItems: "center",
    gap: themeTokens.spacing.sm,
    paddingHorizontal: 24,
    paddingTop: 48,
    marginTop: 48,
  },
  answerContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 24,
  },
  title: {
    color: themeTokens.colors.accentPrimary,
    fontSize: 32,
    fontWeight: "800",
    letterSpacing: 2,
    textTransform: "uppercase",
    textAlign: "center",
  },
  subtitle: {
    color: themeTokens.colors.textSecondary,
    fontSize: 13,
    letterSpacing: 0.5,
    textTransform: "uppercase",
    textAlign: "center",
  },
  questionList: {
    gap: 10,
    width: "100%",
    paddingHorizontal: 8,
  },
  questionChip: {
    backgroundColor: themeTokens.colors.surfaceLow,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  questionChipSelected: {
    backgroundColor: themeTokens.colors.accentPrimary,
  },
  questionChipText: {
    color: themeTokens.colors.textSecondary,
    fontSize: 13,
    fontWeight: "700",
  },
  questionChipTextSelected: {
    color: themeTokens.colors.backgroundDeep,
  },
  question: {
    color: themeTokens.colors.textPrimary,
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
    paddingHorizontal: 8,
  },
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
  error: {
    color: themeTokens.colors.danger,
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  info: {
    color: themeTokens.colors.textSecondary,
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  keypadArea: {
    flex: 1,
    justifyContent: "flex-start",
    alignItems: "center",
    marginTop: -48,
    paddingBottom: 48,
  },
  saveBtn: {
    backgroundColor: themeTokens.colors.accentPrimary,
    borderRadius: 8,
    paddingHorizontal: 32,
    paddingVertical: 14,
    marginTop: 8,
  },
  saveBtnDisabled: {
    opacity: 0.35,
  },
  saveLabel: {
    color: themeTokens.colors.backgroundDeep,
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
});
