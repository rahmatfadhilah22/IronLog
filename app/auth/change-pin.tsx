import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { NumericKeypad } from "../../src/components/numeric-keypad";
import { PinDots } from "../../src/components/pin-dots";
import { pinAuthService } from "../../src/services/auth";
import { themeTokens } from "../../src/core/theme";
import * as Haptics from "expo-haptics";

type Phase = "verify" | "newPin" | "confirm";

export default function ChangePinScreen() {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("verify");
  const [currentPin, setCurrentPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
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
          setPhase("newPin");
        } else {
          void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          setError("Incorrect PIN");
          setCurrentPin("");
        }
      }
    } else if (phase === "newPin" && newPin.length < 6) {
      const next = newPin + digit;
      setNewPin(next);
      if (next.length === 6) {
        setTimeout(() => {
          setConfirmPin("");
          setPhase("confirm");
        }, 80);
      }
    } else if (phase === "confirm" && confirmPin.length < 6) {
      const next = confirmPin + digit;
      setConfirmPin(next);
      if (next.length === 6) {
        if (next === newPin) {
          setSaving(true);
          void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          try {
            await pinAuthService.changePin(currentPin, next);
            router.back();
          } catch {
            setError("Failed to save. Please try again.");
            setSaving(false);
          }
        } else {
          void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          setError("PIN does not match");
          setNewPin("");
          setConfirmPin("");
          setPhase("newPin");
        }
      }
    }
  };

  const onBackspace = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (phase === "confirm" && confirmPin.length > 0) setConfirmPin((p) => p.slice(0, -1));
    else if (phase === "confirm" && confirmPin.length === 0 && newPin.length > 0) setNewPin((p) => p.slice(0, -1));
    else if (phase === "newPin" && newPin.length > 0) setNewPin((p) => p.slice(0, -1));
    else if (phase === "verify" && currentPin.length > 0) setCurrentPin((p) => p.slice(0, -1));
  };

  const filled = phase === "verify" ? currentPin.length : phase === "newPin" ? newPin.length : confirmPin.length;
  const title = phase === "verify" ? "Verify PIN" : phase === "newPin" ? "New PIN" : "Confirm PIN";
  const subtitle = phase === "verify" ? "Enter your current PIN" : phase === "newPin" ? "Enter your new 6-digit PIN" : "Re-enter your new PIN";

  return (
    <View style={styles.container}>
      <View style={styles.authContent}>
        <View style={styles.topArea}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>
          <PinDots filled={filled} />
          {error ? <Text style={styles.error}>{error}</Text> : null}
          {saving ? <Text style={styles.info}>Saving...</Text> : null}
        </View>
      </View>
      <View style={styles.keypadArea}>
        <NumericKeypad onDigit={onDigit} onBackspace={onBackspace} />
      </View>
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
  title: {
    color: themeTokens.colors.accentPrimary,
    fontSize: 32,
    fontWeight: "800",
    letterSpacing: 2,
    textTransform: "uppercase",
  },
  subtitle: {
    color: themeTokens.colors.textSecondary,
    fontSize: 13,
    letterSpacing: 0.5,
    textTransform: "uppercase",
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
});
