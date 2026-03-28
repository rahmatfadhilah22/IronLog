import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { themeTokens } from "../../src/core/theme";

export default function RestTimerModalScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{
    seconds?: string | string[];
    exerciseName?: string | string[];
  }>();
  const initialSeconds = Number.parseInt(asFirstString(params.seconds) ?? "90", 10);
  const exerciseName = asFirstString(params.exerciseName) ?? "Next Exercise";
  const [remainingSeconds, setRemainingSeconds] = useState(
    Number.isNaN(initialSeconds) ? 90 : Math.max(0, initialSeconds),
  );

  useEffect(() => {
    if (remainingSeconds <= 0) {
      router.back();
      return;
    }

    const intervalId = setInterval(() => {
      setRemainingSeconds((previous) => {
        if (previous <= 1) {
          return 0;
        }

        return previous - 1;
      });
    }, 1000);

    return () => {
      clearInterval(intervalId);
    };
  }, [remainingSeconds, router]);

  const countdownLabel = useMemo(() => formatDuration(remainingSeconds), [remainingSeconds]);

  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: insets.top + themeTokens.spacing.xl,
          paddingBottom: insets.bottom + themeTokens.spacing.xl,
        },
      ]}
    >
      <View style={styles.header}>
        <Text style={styles.eyebrow}>Recovery Phase</Text>
        <Text style={styles.exerciseName}>{exerciseName.toUpperCase()}</Text>
      </View>

      <View style={styles.countdownWrap}>
        <Text style={styles.countdownLabel}>{countdownLabel}</Text>
        <Text style={styles.subLabel}>RESTING</Text>
      </View>

      <View style={styles.actionRow}>
        <Pressable
          onPress={() => setRemainingSeconds((previous) => previous + 15)}
          style={({ pressed }) => [styles.secondaryButton, pressed ? styles.pressed : null]}
        >
          <Text style={styles.secondaryLabel}>+15s</Text>
        </Pressable>
        <Pressable
          onPress={() => {
            router.back();
          }}
          style={({ pressed }) => [styles.primaryButton, pressed ? styles.pressed : null]}
        >
          <Text style={styles.primaryLabel}>Skip</Text>
        </Pressable>
      </View>
    </View>
  );
}

function asFirstString(value?: string | string[]): string | undefined {
  if (!value) {
    return undefined;
  }

  return Array.isArray(value) ? value[0] : value;
}

function formatDuration(totalSeconds: number): string {
  const safeSeconds = Math.max(0, totalSeconds);
  const minutes = Math.floor(safeSeconds / 60);
  const seconds = safeSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "rgba(19, 19, 19, 0.95)",
    paddingHorizontal: themeTokens.spacing.lg,
    justifyContent: "space-between",
  },
  header: {
    gap: themeTokens.spacing.xs,
  },
  eyebrow: {
    color: themeTokens.colors.accentPrimary,
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1.3,
  },
  exerciseName: {
    color: themeTokens.colors.textPrimary,
    fontSize: 22,
    lineHeight: 26,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  countdownWrap: {
    alignItems: "center",
    justifyContent: "center",
    gap: themeTokens.spacing.sm,
  },
  countdownLabel: {
    color: themeTokens.colors.textPrimary,
    fontSize: 96,
    lineHeight: 100,
    fontWeight: "900",
    letterSpacing: -1.8,
  },
  subLabel: {
    color: themeTokens.colors.accentPrimary,
    fontSize: 13,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 2.4,
  },
  actionRow: {
    flexDirection: "row",
    gap: themeTokens.spacing.sm,
  },
  secondaryButton: {
    flex: 1,
    minHeight: 64,
    backgroundColor: themeTokens.colors.surfaceHigh,
    borderRadius: themeTokens.radius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryButton: {
    flex: 1,
    minHeight: 64,
    backgroundColor: themeTokens.colors.accentPrimary,
    borderRadius: themeTokens.radius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  pressed: {
    opacity: 0.82,
  },
  secondaryLabel: {
    color: themeTokens.colors.textPrimary,
    fontSize: 22,
    fontWeight: "700",
  },
  primaryLabel: {
    color: themeTokens.colors.backgroundDeep,
    fontSize: 22,
    fontWeight: "800",
    textTransform: "uppercase",
  },
});
