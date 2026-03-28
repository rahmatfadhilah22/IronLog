import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { EmptyState } from "../../src/components";
import { themeTokens } from "../../src/core/theme";
import { analyticsService } from "../../src/services/analytics";
import type { ProgressOverview } from "../../src/types/progress";

export default function ProgressScreen() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [overview, setOverview] = useState<ProgressOverview | null>(null);

  const loadOverview = useCallback(() => {
    let isActive = true;
    setIsLoading(true);
    setErrorMessage(null);

    analyticsService
      .getProgressOverview(search.trim() || undefined)
      .then((result) => {
        if (!isActive) {
          return;
        }
        setOverview(result);
      })
      .catch((error: unknown) => {
        if (isActive) {
          setErrorMessage(
            error instanceof Error ? error.message : "Gagal memuat data progress.",
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
  }, [search]);

  useFocusEffect(loadOverview);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerEyebrow}>Performance Tracker</Text>
        <Text style={styles.headerTitle}>Progress</Text>
      </View>

      <TextInput
        value={search}
        onChangeText={setSearch}
        placeholder="Search exercise..."
        placeholderTextColor={themeTokens.colors.textSecondary}
        style={styles.searchInput}
      />

      {isLoading ? (
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color={themeTokens.colors.accentPrimary} />
        </View>
      ) : errorMessage ? (
        <View style={styles.centerState}>
          <Text style={styles.errorText}>{errorMessage}</Text>
        </View>
      ) : !overview || overview.exercises.length === 0 ? (
        <EmptyState
          title="Belum Ada Data Progress"
          description="Selesaikan workout terlebih dulu agar analytics exercise muncul."
          actionLabel="Go To Routines"
          onPress={() => {
            router.push("/routines");
          }}
        />
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.summaryGrid}>
            <StatCard
              label="Tracked Exercises"
              value={String(overview.trackedExerciseCount)}
            />
            <StatCard
              label="Completed Workouts"
              value={String(overview.completedWorkoutCount)}
            />
            <StatCard
              label="Completed Sets"
              value={String(overview.totalCompletedSets)}
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Best Lifts</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.topLiftRow}
            >
              {overview.topLifts.map((item) => (
                <Pressable
                  key={item.exerciseId}
                  style={styles.topLiftCard}
                  onPress={() => {
                    router.push(`/exercise/${item.exerciseId}` as never);
                  }}
                >
                  <Text style={styles.topLiftName} numberOfLines={2}>
                    {item.exerciseName.toUpperCase()}
                  </Text>
                  <Text style={styles.topLiftValue}>
                    {formatNumber(item.bestWeight)}{" "}
                    {overview.preferredUnit.toUpperCase()}
                  </Text>
                  <Text style={styles.topLiftMeta}>
                    1RM {formatNumber(item.bestOneRm)} {overview.preferredUnit.toUpperCase()}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Exercise History</Text>
            <View style={styles.exerciseList}>
              {overview.exercises.map((exercise, index) => (
                <Pressable
                  key={exercise.exerciseId}
                  style={({ pressed }) => [
                    styles.exerciseRow,
                    pressed ? styles.exerciseRowPressed : null,
                  ]}
                  onPress={() => {
                    router.push(`/exercise/${exercise.exerciseId}` as never);
                  }}
                >
                  <View style={styles.exerciseLeft}>
                    <Text style={styles.exerciseRank}>
                      {String(index + 1).padStart(2, "0")}
                    </Text>
                    <View style={styles.exerciseTextWrap}>
                      <Text style={styles.exerciseName}>{exercise.exerciseName}</Text>
                      <Text style={styles.exerciseMeta}>
                        {exercise.muscleGroup.toUpperCase()} • {exercise.totalSessions} SESSIONS
                      </Text>
                    </View>
                  </View>
                  <View style={styles.exerciseRight}>
                    <Text style={styles.exerciseWeight}>
                      {formatNumber(exercise.bestWeight)}
                    </Text>
                    <Text style={styles.exerciseWeightUnit}>
                      {overview.preferredUnit.toUpperCase()}
                    </Text>
                  </View>
                </Pressable>
              ))}
            </View>
          </View>

          <Pressable
            style={({ pressed }) => [
              styles.bodyMetricsButton,
              pressed ? styles.bodyMetricsButtonPressed : null,
            ]}
            onPress={() => {
              router.push("/body-metrics");
            }}
          >
            <Text style={styles.bodyMetricsLabel}>Open Body Metrics</Text>
          </Pressable>
        </ScrollView>
      )}
    </View>
  );
}

type StatCardProps = {
  label: string;
  value: string;
};

function StatCard({ label, value }: StatCardProps) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );
}

function formatNumber(value: number): string {
  if (Number.isInteger(value)) {
    return value.toLocaleString();
  }

  return value.toFixed(1);
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: themeTokens.colors.background,
    padding: themeTokens.spacing.lg,
    gap: themeTokens.spacing.sm,
  },
  header: {
    gap: 2,
  },
  headerEyebrow: {
    color: themeTokens.colors.accentPrimary,
    fontSize: 11,
    letterSpacing: 1.2,
    textTransform: "uppercase",
    fontWeight: "700",
  },
  headerTitle: {
    color: themeTokens.colors.textPrimary,
    fontSize: 36,
    lineHeight: 38,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  searchInput: {
    minHeight: 48,
    backgroundColor: themeTokens.colors.surfaceLow,
    borderRadius: themeTokens.radius.sm,
    paddingHorizontal: themeTokens.spacing.md,
    color: themeTokens.colors.textPrimary,
    fontSize: 15,
    marginBottom: themeTokens.spacing.xs,
  },
  centerState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  errorText: {
    color: themeTokens.colors.danger,
    textAlign: "center",
    fontWeight: "700",
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    gap: themeTokens.spacing.md,
    paddingBottom: themeTokens.spacing.xxl,
  },
  summaryGrid: {
    gap: themeTokens.spacing.xs,
  },
  statCard: {
    backgroundColor: themeTokens.colors.surfaceLow,
    borderRadius: themeTokens.radius.sm,
    padding: themeTokens.spacing.md,
    gap: 2,
  },
  statLabel: {
    color: themeTokens.colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.9,
    fontSize: 10,
    fontWeight: "700",
  },
  statValue: {
    color: themeTokens.colors.accentPrimary,
    fontSize: 32,
    lineHeight: 34,
    fontWeight: "800",
  },
  section: {
    gap: themeTokens.spacing.sm,
  },
  sectionTitle: {
    color: themeTokens.colors.textPrimary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    fontSize: 18,
    fontWeight: "700",
  },
  topLiftRow: {
    gap: themeTokens.spacing.sm,
    paddingRight: themeTokens.spacing.lg,
  },
  topLiftCard: {
    width: 188,
    backgroundColor: themeTokens.colors.surfaceLow,
    borderRadius: themeTokens.radius.sm,
    padding: themeTokens.spacing.md,
    gap: themeTokens.spacing.xs,
  },
  topLiftName: {
    color: themeTokens.colors.textPrimary,
    fontSize: 13,
    lineHeight: 17,
    fontWeight: "700",
  },
  topLiftValue: {
    color: themeTokens.colors.accentPrimary,
    fontSize: 30,
    lineHeight: 32,
    fontWeight: "800",
  },
  topLiftMeta: {
    color: themeTokens.colors.textSecondary,
    fontSize: 11,
    letterSpacing: 0.6,
    fontWeight: "600",
  },
  exerciseList: {
    gap: themeTokens.spacing.xs,
  },
  exerciseRow: {
    minHeight: 68,
    backgroundColor: themeTokens.colors.surfaceLow,
    borderRadius: themeTokens.radius.sm,
    paddingHorizontal: themeTokens.spacing.md,
    paddingVertical: themeTokens.spacing.sm,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: themeTokens.spacing.sm,
  },
  exerciseRowPressed: {
    backgroundColor: themeTokens.colors.surfaceHigh,
  },
  exerciseLeft: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: themeTokens.spacing.sm,
  },
  exerciseRank: {
    color: themeTokens.colors.accentPrimary,
    fontSize: 11,
    letterSpacing: 0.8,
    fontWeight: "700",
  },
  exerciseTextWrap: {
    flex: 1,
    gap: 2,
  },
  exerciseName: {
    color: themeTokens.colors.textPrimary,
    fontSize: 15,
    lineHeight: 18,
    fontWeight: "700",
  },
  exerciseMeta: {
    color: themeTokens.colors.textSecondary,
    fontSize: 10,
    letterSpacing: 0.7,
    fontWeight: "600",
  },
  exerciseRight: {
    alignItems: "flex-end",
    gap: 0,
  },
  exerciseWeight: {
    color: themeTokens.colors.textPrimary,
    fontSize: 24,
    lineHeight: 26,
    fontWeight: "800",
  },
  exerciseWeightUnit: {
    color: themeTokens.colors.textSecondary,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.7,
  },
  bodyMetricsButton: {
    minHeight: 52,
    backgroundColor: themeTokens.colors.surfaceHigh,
    borderRadius: themeTokens.radius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  bodyMetricsButtonPressed: {
    opacity: 0.85,
  },
  bodyMetricsLabel: {
    color: themeTokens.colors.textPrimary,
    fontWeight: "800",
    textTransform: "uppercase",
    fontSize: 12,
    letterSpacing: 0.8,
  },
});
