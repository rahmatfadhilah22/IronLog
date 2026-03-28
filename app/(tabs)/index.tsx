import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { EmptyState, PrimaryButton, RoutineCard } from "../../src/components";
import { themeTokens } from "../../src/core/theme";
import { routineService } from "../../src/services/routines";
import { workoutService } from "../../src/services/workouts";
import type { RoutineSummary } from "../../src/types/routine";
import type {
  ActiveWorkoutReference,
  CompletedWorkoutReference,
} from "../../src/types/workout";

export default function HomeScreen() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [recentRoutines, setRecentRoutines] = useState<RoutineSummary[]>([]);
  const [activeWorkout, setActiveWorkout] = useState<ActiveWorkoutReference | null>(
    null,
  );
  const [lastCompletedWorkout, setLastCompletedWorkout] =
    useState<CompletedWorkoutReference | null>(null);

  const loadHomeData = useCallback(() => {
    let isActive = true;
    setIsLoading(true);
    setError(null);

    routineService
      .listRoutines(3)
      .then(async (routines) => {
        const active = await workoutService.getActiveWorkout();
        const latestCompleted = await workoutService.getLatestCompletedWorkout();
        if (isActive) {
          setRecentRoutines(routines);
          setActiveWorkout(active);
          setLastCompletedWorkout(latestCompleted);
        }
      })
      .catch((requestError: unknown) => {
        if (isActive) {
          setError(
            requestError instanceof Error
              ? requestError.message
              : "Failed to load home data.",
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
        <Text style={styles.heroEyebrow}>Focused Training Log</Text>
        <Text style={styles.heroTitle}>Lift Hard. Log Fast.</Text>
        <Text style={styles.heroDescription}>
          Build routines, run sessions, and review progress from one fast training log.
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

      {lastCompletedWorkout ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Last Completed</Text>
          <View style={styles.completedWorkoutPanel}>
            <View style={styles.completedWorkoutInfo}>
              <Text style={styles.completedWorkoutTitle}>
                {lastCompletedWorkout.title.toUpperCase()}
              </Text>
              <Text style={styles.completedWorkoutMeta}>
                FINISHED {new Date(lastCompletedWorkout.finishedAt).toLocaleString()}
              </Text>
            </View>
            <Pressable
              onPress={() => {
                router.push(
                  {
                    pathname: "/workout/summary",
                    params: { workoutId: lastCompletedWorkout.id },
                  } as never,
                );
              }}
              style={({ pressed }) => [
                styles.secondaryActionButton,
                pressed ? styles.secondaryActionButtonPressed : null,
              ]}
            >
              <Text style={styles.secondaryActionLabel}>View Summary</Text>
            </Pressable>
          </View>
        </View>
      ) : null}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Routines</Text>
        {recentRoutines.length === 0 ? (
          <EmptyState
            title="No Routine Yet"
            description="Create your first routine to start training with structure."
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
  completedWorkoutPanel: {
    backgroundColor: themeTokens.colors.surfaceLow,
    borderRadius: themeTokens.radius.sm,
    padding: themeTokens.spacing.md,
    gap: themeTokens.spacing.sm,
  },
  completedWorkoutInfo: {
    gap: 2,
  },
  completedWorkoutTitle: {
    color: themeTokens.colors.textPrimary,
    fontSize: 18,
    lineHeight: 22,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  completedWorkoutMeta: {
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
  secondaryActionButton: {
    minHeight: 46,
    borderRadius: themeTokens.radius.sm,
    backgroundColor: themeTokens.colors.surfaceHighest,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: themeTokens.spacing.lg,
  },
  secondaryActionButtonPressed: {
    opacity: 0.85,
  },
  secondaryActionLabel: {
    color: themeTokens.colors.textPrimary,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    fontSize: 12,
  },
});
