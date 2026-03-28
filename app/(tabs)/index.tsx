import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from "react-native";

import { EmptyState, PrimaryButton, RoutineCard } from "../../src/components";
import { themeTokens } from "../../src/core/theme";
import { routineService } from "../../src/services/routines";
import { workoutService } from "../../src/services/workouts";
import type { RoutineSummary } from "../../src/types/routine";
import type { ActiveWorkoutReference } from "../../src/types/workout";

export default function HomeScreen() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [recentRoutines, setRecentRoutines] = useState<RoutineSummary[]>([]);
  const [activeWorkout, setActiveWorkout] = useState<ActiveWorkoutReference | null>(
    null,
  );

  const loadHomeData = useCallback(() => {
    let isActive = true;
    setIsLoading(true);
    setError(null);

    routineService
      .listRoutines(3)
      .then(async (routines) => {
        const active = await workoutService.getActiveWorkout();
        if (isActive) {
          setRecentRoutines(routines);
          setActiveWorkout(active);
        }
      })
      .catch((requestError: unknown) => {
        if (isActive) {
          setError(
            requestError instanceof Error
              ? requestError.message
              : "Gagal memuat data Home.",
          );
        }
      })
      .finally(() => {
        if (isActive) {
          setIsLoading(false);
        }
      });

    return () => {
      isActive = false;
    };
  }, []);

  useFocusEffect(loadHomeData);

  if (isLoading) {
    return (
      <View style={styles.centerState}>
        <ActivityIndicator size="large" color={themeTokens.colors.accentPrimary} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerState}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.heroPanel}>
        <Text style={styles.heroEyebrow}>IronLog Local</Text>
        <Text style={styles.heroTitle}>Train Fast, Log Local</Text>
        <Text style={styles.heroDescription}>
          Semua data tetap di device. Mulai dan lanjutkan workout langsung dari routine.
        </Text>
        {activeWorkout ? (
          <View style={styles.activeWorkoutPanel}>
            <Text style={styles.activeWorkoutLabel}>Active Workout</Text>
            <Text style={styles.activeWorkoutTitle}>
              {activeWorkout.title.toUpperCase()}
            </Text>
            <Text style={styles.activeWorkoutMeta}>
              STARTED {new Date(activeWorkout.startedAt).toLocaleTimeString()}
            </Text>
          </View>
        ) : null}
        <PrimaryButton
          label={
            activeWorkout
              ? "Continue Workout"
              : recentRoutines.length > 0
                ? "View Routines"
                : "Create First Routine"
          }
          onPress={() => {
            if (activeWorkout) {
              router.push(`/workout/${activeWorkout.id}` as never);
              return;
            }

            router.push(recentRoutines.length > 0 ? "/routines" : "/routines/create");
          }}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Routines</Text>
        {recentRoutines.length === 0 ? (
          <EmptyState
            title="No Routine Yet"
            description="Buat routine pertama untuk memulai program latihan Anda."
            actionLabel="Create Routine"
            onPress={() => {
              router.push("/routines/create");
            }}
          />
        ) : (
          <View style={styles.listWrap}>
            {recentRoutines.map((routine) => (
              <RoutineCard
                key={routine.id}
                routine={routine}
                onPress={(routineId) => {
                  router.push(`/routines/${routineId}` as never);
                }}
              />
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: themeTokens.colors.background,
  },
  contentContainer: {
    padding: themeTokens.spacing.lg,
    gap: themeTokens.spacing.lg,
    paddingBottom: themeTokens.spacing.xl,
  },
  centerState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: themeTokens.colors.background,
  },
  errorText: {
    color: themeTokens.colors.danger,
    fontWeight: "700",
    textAlign: "center",
    paddingHorizontal: themeTokens.spacing.lg,
  },
  heroPanel: {
    backgroundColor: themeTokens.colors.surfaceLow,
    borderRadius: themeTokens.radius.sm,
    padding: themeTokens.spacing.lg,
    gap: themeTokens.spacing.sm,
  },
  heroEyebrow: {
    color: themeTokens.colors.accentPrimary,
    textTransform: "uppercase",
    fontSize: 11,
    letterSpacing: 1.2,
    fontWeight: "700",
  },
  heroTitle: {
    color: themeTokens.colors.textPrimary,
    textTransform: "uppercase",
    fontSize: 31,
    lineHeight: 34,
    fontWeight: "800",
    letterSpacing: 0.4,
  },
  heroDescription: {
    color: themeTokens.colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: themeTokens.spacing.sm,
  },
  activeWorkoutPanel: {
    backgroundColor: themeTokens.colors.surfaceHigh,
    borderRadius: themeTokens.radius.sm,
    padding: themeTokens.spacing.md,
    gap: 2,
  },
  activeWorkoutLabel: {
    color: themeTokens.colors.accentPrimary,
    textTransform: "uppercase",
    letterSpacing: 1,
    fontSize: 10,
    fontWeight: "700",
  },
  activeWorkoutTitle: {
    color: themeTokens.colors.textPrimary,
    fontSize: 17,
    lineHeight: 21,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  activeWorkoutMeta: {
    color: themeTokens.colors.textSecondary,
    fontSize: 11,
    letterSpacing: 0.8,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  section: {
    gap: themeTokens.spacing.sm,
  },
  sectionTitle: {
    color: themeTokens.colors.textPrimary,
    fontSize: 20,
    fontWeight: "700",
    letterSpacing: 0.2,
    textTransform: "uppercase",
  },
  listWrap: {
    gap: themeTokens.spacing.sm,
  },
});
