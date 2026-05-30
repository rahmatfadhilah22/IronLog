import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";

import { APP_NAME } from "../src/core/constants";
import { themeTokens } from "../src/core/theme";
import { useDatabaseBootstrap } from "../src/db/sqlite";
import { pinAuthService } from "../src/services/auth";
import { initializeRestTimerNotifications } from "../src/services/notifications";
import { useAuthStore } from "../src/stores/auth-store";

type AuthBootstrapState = "loading" | "needsSetup" | "locked" | "ready" | "error";

const AUTH_BOOTSTRAP_TIMEOUT_MS = 8000;

export default function RootLayout() {
  const { isReady, error, retry } = useDatabaseBootstrap();
  const [authState, setAuthState] = useState<AuthBootstrapState>("loading");
  const [authError, setAuthError] = useState<Error | null>(null);
  const isUnlocked = useAuthStore((s) => s.isUnlocked);

  useEffect(() => {
    initializeRestTimerNotifications();
  }, []);

  useEffect(() => {
    if (!isReady) {
      setAuthState("loading");
      setAuthError(null);
      return;
    }

    let isCancelled = false;

    const checkPinBootstrap = async () => {
      try {
        const hasPin = await withTimeout(
          pinAuthService.hasPin(),
          "PIN bootstrap timed out while reading SecureStore.",
        );

        if (isCancelled) {
          return;
        }

        setAuthError(null);
        setAuthState(hasPin ? (isUnlocked ? "ready" : "locked") : "needsSetup");
      } catch (bootstrapError) {
        if (isCancelled) {
          return;
        }

        const normalizedError =
          bootstrapError instanceof Error
            ? bootstrapError
            : new Error(String(bootstrapError));

        setAuthError(normalizedError);
        setAuthState("error");
      }
    };

    void checkPinBootstrap();

    return () => {
      isCancelled = true;
    };
  }, [isReady, isUnlocked]);

  if (error) {
    return (
      <View style={styles.stateContainer}>
        <Text style={styles.stateLabel}>BOOTSTRAP ERROR</Text>
        <Text style={styles.stateTitle}>Database initialization failed</Text>
        <Text style={styles.stateDescription}>{error.message}</Text>
        <Pressable style={styles.retryButton} onPress={retry}>
          <Text style={styles.retryLabel}>Retry Bootstrap</Text>
        </Pressable>
      </View>
    );
  }

  if (!isReady || authState === "loading") {
    return (
      <View style={styles.stateContainer}>
        <ActivityIndicator size="large" color={themeTokens.colors.accentPrimary} />
        <Text style={styles.stateLabel}>{APP_NAME.toUpperCase()}</Text>
        <Text style={styles.stateTitle}>{!isReady ? "Preparing local database" : "Checking app security"}</Text>
      </View>
    );
  }

  if (authState === "error") {
    return (
      <View style={styles.stateContainer}>
        <Text style={styles.stateLabel}>SECURITY ERROR</Text>
        <Text style={styles.stateTitle}>PIN initialization failed</Text>
        <Text style={styles.stateDescription}>{authError?.message ?? "Unknown SecureStore error."}</Text>
        <Pressable
          style={styles.retryButton}
          onPress={() => {
            setAuthError(null);
            setAuthState("loading");
          }}
        >
          <Text style={styles.retryLabel}>Retry Security Check</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: themeTokens.colors.backgroundDeep },
          headerTintColor: themeTokens.colors.textPrimary,
          contentStyle: { backgroundColor: themeTokens.colors.background },
          headerTitleStyle: { fontWeight: "700" },
        }}
      >
        <Stack.Protected guard={authState !== "ready"}>
          <Stack.Screen name="auth" options={{ headerShown: false }} />
        </Stack.Protected>

        <Stack.Protected guard={authState === "ready"}>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="routines/create" options={{ title: "Create Routine" }} />
          <Stack.Screen name="routines/[routineId]" options={{ title: "Routine Detail" }} />
          <Stack.Screen name="workout/[workoutId]" options={{ title: "Active Workout" }} />
          <Stack.Screen name="workout/summary" options={{ title: "Workout Summary" }} />
          <Stack.Screen name="exercise/[exerciseId]" options={{ title: "Exercise Insights" }} />
          <Stack.Screen name="body-metrics" options={{ title: "Body Metrics" }} />
          <Stack.Screen
            name="modal/exercise-picker"
            options={{
              title: "Select Exercise",
              presentation: "modal",
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="modal/rest-timer"
            options={{
              title: "Rest Timer",
              presentation: "transparentModal",
              headerShown: false,
              contentStyle: { backgroundColor: "transparent" },
            }}
          />
        </Stack.Protected>
      </Stack>
    </>
  );
}

function withTimeout<T>(promise: Promise<T>, message: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      reject(new Error(message));
    }, AUTH_BOOTSTRAP_TIMEOUT_MS);

    promise
      .then((value) => {
        clearTimeout(timeoutId);
        resolve(value);
      })
      .catch((timeoutError: unknown) => {
        clearTimeout(timeoutId);
        reject(timeoutError);
      });
  });
}

const styles = StyleSheet.create({
  stateContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: themeTokens.colors.background,
    gap: themeTokens.spacing.md,
    padding: themeTokens.spacing.xl,
  },
  stateLabel: {
    color: themeTokens.colors.accentPrimary,
    fontSize: themeTokens.typography.label.fontSize,
    letterSpacing: themeTokens.typography.label.letterSpacing,
    fontWeight: "700",
  },
  stateTitle: {
    color: themeTokens.colors.textPrimary,
    fontSize: themeTokens.typography.title.fontSize,
    lineHeight: themeTokens.typography.title.lineHeight,
    fontWeight: "700",
    textAlign: "center",
  },
  stateDescription: {
    color: themeTokens.colors.textSecondary,
    fontSize: themeTokens.typography.body.fontSize,
    lineHeight: themeTokens.typography.body.lineHeight,
    textAlign: "center",
  },
  retryButton: {
    backgroundColor: themeTokens.colors.accentPrimary,
    borderRadius: themeTokens.radius.sm,
    paddingHorizontal: themeTokens.spacing.lg,
    paddingVertical: themeTokens.spacing.sm,
  },
  retryLabel: {
    color: themeTokens.colors.backgroundDeep,
    fontWeight: "700",
  },
});
