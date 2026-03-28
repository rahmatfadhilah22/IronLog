import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";

import { APP_NAME } from "../src/core/constants";
import { themeTokens } from "../src/core/theme";
import { useDatabaseBootstrap } from "../src/db/sqlite";
import { initializeRestTimerNotifications } from "../src/services/notifications";

export default function RootLayout() {
  const { isReady, error, retry } = useDatabaseBootstrap();

  useEffect(() => {
    initializeRestTimerNotifications();
  }, []);

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

  if (!isReady) {
    return (
      <View style={styles.stateContainer}>
        <ActivityIndicator size="large" color={themeTokens.colors.accentPrimary} />
        <Text style={styles.stateLabel}>{APP_NAME.toUpperCase()}</Text>
        <Text style={styles.stateTitle}>Preparing local database</Text>
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
      </Stack>
    </>
  );
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
