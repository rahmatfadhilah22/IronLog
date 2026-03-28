import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { themeTokens } from "../../src/core/theme";
import {
  cancelRestTimerNotification,
  playRestTimerCompletionHaptic,
  scheduleRestTimerCompletionNotification,
} from "../../src/services/notifications";
import { appSettingsService } from "../../src/services/settings";

export default function RestTimerModalScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{
    seconds?: string | string[];
    exerciseName?: string | string[];
    endsAt?: string | string[];
  }>();
  const initialSeconds = Number.parseInt(asFirstString(params.seconds) ?? "90", 10);
  const exerciseName = asFirstString(params.exerciseName) ?? "Next Exercise";
  const initialEndsAt = Number.parseInt(
    asFirstString(params.endsAt) ?? String(Date.now() + resolveInitialSeconds(initialSeconds) * 1000),
    10,
  );
  const [endsAtTimestamp, setEndsAtTimestamp] = useState(
    Number.isNaN(initialEndsAt)
      ? Date.now() + resolveInitialSeconds(initialSeconds) * 1000
      : initialEndsAt,
  );
  const [nowTimestamp, setNowTimestamp] = useState(Date.now());
  const [hapticsEnabled, setHapticsEnabled] = useState(true);
  const scheduledNotificationIdRef = useRef<string | null>(null);
  const didFireCompletionRef = useRef(false);

  useEffect(() => {
    const intervalId = setInterval(() => {
      setNowTimestamp(Date.now());
    }, 250);

    return () => {
      clearInterval(intervalId);
    };
  }, []);

  useEffect(() => {
    let isActive = true;

    appSettingsService
      .get()
      .then((settings) => {
        if (isActive) {
          setHapticsEnabled(settings.hapticsEnabled);
        }
      })
      .catch((error) => {
        console.warn("[rest-timer] failed to read app settings", error);
      });

    return () => {
      isActive = false;
    };
  }, []);

  useEffect(() => {
    let isActive = true;

    const syncNotification = async () => {
      await cancelRestTimerNotification(scheduledNotificationIdRef.current);
      scheduledNotificationIdRef.current = null;

      if (endsAtTimestamp <= Date.now()) {
        return;
      }

      const notificationId = await scheduleRestTimerCompletionNotification({
        endsAt: endsAtTimestamp,
        exerciseName,
      });

      if (!isActive) {
        await cancelRestTimerNotification(notificationId);
        return;
      }

      scheduledNotificationIdRef.current = notificationId;
    };

    void syncNotification();

    return () => {
      isActive = false;
      void cancelRestTimerNotification(scheduledNotificationIdRef.current);
      scheduledNotificationIdRef.current = null;
    };
  }, [endsAtTimestamp, exerciseName]);

  const remainingSeconds = useMemo(
    () => Math.max(0, Math.ceil((endsAtTimestamp - nowTimestamp) / 1000)),
    [endsAtTimestamp, nowTimestamp],
  );
  const countdownLabel = useMemo(() => formatDuration(remainingSeconds), [remainingSeconds]);
  const isComplete = remainingSeconds <= 0;

  useEffect(() => {
    if (remainingSeconds > 0) {
      didFireCompletionRef.current = false;
      return;
    }

    if (didFireCompletionRef.current) {
      return;
    }

    didFireCompletionRef.current = true;
    void cancelRestTimerNotification(scheduledNotificationIdRef.current);
    scheduledNotificationIdRef.current = null;
    void playRestTimerCompletionHaptic(hapticsEnabled);
  }, [hapticsEnabled, remainingSeconds]);

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
        <Text style={styles.eyebrow}>{isComplete ? "Ready to Lift" : "Recovery Phase"}</Text>
        <Text style={styles.exerciseName}>{exerciseName.toUpperCase()}</Text>
      </View>

      <View style={styles.countdownWrap}>
        <Text style={styles.countdownLabel}>{isComplete ? "GO" : countdownLabel}</Text>
        <Text style={styles.subLabel}>{isComplete ? "REST COMPLETE" : "RESTING"}</Text>
        <Text style={styles.helperLabel}>
          {isComplete
            ? "Your next set is ready."
            : "The timer stays accurate even if you leave the app."}
        </Text>
      </View>

      <View style={styles.actionRow}>
        <Pressable
          onPress={() => {
            didFireCompletionRef.current = false;
            setEndsAtTimestamp((previous) => Math.max(previous, Date.now()) + 15 * 1000);
          }}
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
          <Text style={styles.primaryLabel}>{isComplete ? "Back to Workout" : "Skip Rest"}</Text>
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

function resolveInitialSeconds(initialSeconds: number): number {
  if (Number.isNaN(initialSeconds)) {
    return 90;
  }

  return Math.max(0, initialSeconds);
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
  helperLabel: {
    color: themeTokens.colors.textSecondary,
    fontSize: 13,
    lineHeight: 18,
    textAlign: "center",
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
    textAlign: "center",
  },
});
