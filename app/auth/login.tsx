import { useRef, useState } from "react";
import { Animated, Pressable, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { NumericKeypad } from "../../src/components/numeric-keypad";
import { PinDots } from "../../src/components/pin-dots";
import { pinAuthService } from "../../src/services/auth";
import { useAuthStore } from "../../src/stores/auth-store";
import { themeTokens } from "../../src/core/theme";
import * as Haptics from "expo-haptics";

export default function PinLoginScreen() {
  const router = useRouter();
  const unlock = useAuthStore((s) => s.unlock);
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const shakeAnim = useRef(new Animated.Value(0)).current;

  const shake = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 8, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -8, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 60, useNativeDriver: true }),
    ]).start();
  };

  const onDigit = async (digit: string) => {
    if (pin.length >= 6) return;
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const next = pin + digit;
    setPin(next);
    setError("");

    if (next.length === 6) {
      const valid = await pinAuthService.verifyPin(next);
      if (valid) {
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        unlock();
        router.replace("/");
      } else {
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        shake();
        setError("PIN salah");
        setPin("");
      }
    }
  };

  const onBackspace = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (pin.length > 0) setPin((p) => p.slice(0, -1));
  };

  return (
    <Animated.View style={[styles.container, { transform: [{ translateX: shakeAnim }] }]}>
      <View style={styles.authContent}>
        <View style={styles.topArea}>
          <Text style={styles.title}>IronLog</Text>
          <Text style={styles.subtitle}>Enter your PIN</Text>
          <PinDots filled={pin.length} />
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <Pressable onPress={() => router.push("/auth/recovery")} style={styles.forgotButton}>
            <Text style={styles.forgotLabel}>Forgot PIN?</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.keypadArea}>
        <NumericKeypad onDigit={onDigit} onBackspace={onBackspace} />
      </View>
    </Animated.View>
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
    marginTop: 48
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
  },
  error: {
    color: themeTokens.colors.danger,
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  forgotButton: { marginTop: 4 },
  forgotLabel: {
    color: themeTokens.colors.textSecondary,
    fontSize: 12,
    fontWeight: "600",
    textDecorationLine: "underline",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  keypadArea: {
    flex: 1,
    justifyContent: "flex-start",
    alignItems: "center",
    marginTop: -48,
    paddingBottom: 48,
  },
});
