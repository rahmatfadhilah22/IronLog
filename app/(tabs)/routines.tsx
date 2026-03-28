import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from "react-native";

import { EmptyState, PrimaryButton, RoutineCard } from "../../src/components";
import { themeTokens } from "../../src/core/theme";
import { routineService } from "../../src/services/routines";
import type { RoutineSummary } from "../../src/types/routine";

export default function RoutinesScreen() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [routines, setRoutines] = useState<RoutineSummary[]>([]);

  const loadRoutines = useCallback(() => {
    let isActive = true;
    setIsLoading(true);
    setError(null);

    routineService
      .listRoutines(100)
      .then((result) => {
        if (isActive) {
          setRoutines(result);
        }
      })
      .catch((requestError: unknown) => {
        if (isActive) {
          setError(
            requestError instanceof Error
              ? requestError.message
              : "Failed to load routines.",
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

  useFocusEffect(loadRoutines);

  const goToCreate = () => {
    router.push("/routines/create");
  };

  const goToDetail = (routineId: string) => {
    router.push(`/routines/${routineId}` as never);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.eyebrow}>Training Archive</Text>
        <Text style={styles.title}>Routines</Text>
      </View>

      <PrimaryButton label="New Routine" onPress={goToCreate} />

      {isLoading ? (
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color={themeTokens.colors.accentPrimary} />
        </View>
      ) : error ? (
        <View style={styles.centerState}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : routines.length === 0 ? (
        <EmptyState
          title="No Routines Yet"
          description="Create your first routine and start building your training split."
          actionLabel="Create Routine"
          onPress={goToCreate}
        />
      ) : (
        <ScrollView contentContainerStyle={styles.listContent}>
          {routines.map((routine) => (
            <RoutineCard key={routine.id} routine={routine} onPress={goToDetail} />
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: themeTokens.colors.background,
    padding: themeTokens.spacing.lg,
    gap: themeTokens.spacing.md,
  },
  header: {
    gap: themeTokens.spacing.xs,
  },
  eyebrow: {
    color: themeTokens.colors.accentPrimary,
    textTransform: "uppercase",
    letterSpacing: 1.4,
    fontSize: 11,
    fontWeight: "700",
  },
  title: {
    color: themeTokens.colors.textPrimary,
    fontSize: 34,
    lineHeight: 36,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  centerState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  errorText: {
    color: themeTokens.colors.danger,
    fontWeight: "700",
    textAlign: "center",
  },
  listContent: {
    paddingBottom: themeTokens.spacing.xl,
    gap: themeTokens.spacing.sm,
  },
});
