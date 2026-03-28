import { useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { PrimaryButton } from "../../components";
import { themeTokens } from "../../core/theme";
import { workoutService } from "../../services/workouts";
import type { WorkoutSummary } from "../../types/workout";

type WorkoutSummaryScreenProps = {
  workoutId: string;
};

export function WorkoutSummaryScreen({ workoutId }: WorkoutSummaryScreenProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [summary, setSummary] = useState<WorkoutSummary | null>(null);

  useEffect(() => {
    let isActive = true;
    setIsLoading(true);
    setErrorMessage(null);

    workoutService
      .getWorkoutSummary(workoutId)
      .then((result) => {
        if (!isActive) {
          return;
        }

        if (!result) {
          setErrorMessage("Workout summary not found.");
          return;
        }

        setSummary(result);
      })
      .catch((error: unknown) => {
        if (isActive) {
          setErrorMessage(error instanceof Error ? error.message : "Failed to load summary.");
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
  }, [workoutId]);

  const completedDateLabel = useMemo(() => {
    if (!summary?.finishedAt) {
      return "-";
    }
    return new Date(summary.finishedAt).toLocaleString();
  }, [summary?.finishedAt]);

  if (isLoading) {
    return (
      <View style={styles.centerState}>
        <ActivityIndicator size="large" color={themeTokens.colors.accentPrimary} />
        <Text style={styles.stateLabel}>Loading summary...</Text>
      </View>
    );
  }

  if (!summary) {
    return (
      <View style={styles.centerState}>
        <Text style={styles.errorText}>{errorMessage ?? "Summary unavailable."}</Text>
        <PrimaryButton
          label="Back To Home"
          onPress={() => {
            router.replace("/(tabs)");
          }}
        />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[
        styles.contentContainer,
        { paddingBottom: insets.bottom + themeTokens.spacing.xxl },
      ]}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.heroSection}>
        <Text style={styles.heroEyebrow}>Mission Accomplished</Text>
        <Text style={styles.heroTitle}>Workout Complete</Text>
        <Text style={styles.heroSubtitle}>{summary.title.toUpperCase()}</Text>
        <Text style={styles.heroDate}>{completedDateLabel}</Text>
      </View>

      <View style={styles.metricsGrid}>
        <MetricCard
          label="TOTAL VOLUME"
          value={Math.round(summary.totalVolume).toLocaleString()}
          unit={summary.totalVolumeUnit.toUpperCase()}
          emphasized
        />
        <MetricCard
          label="DURATION"
          value={formatDuration(summary.durationSeconds)}
        />
        <MetricCard
          label="TOTAL SETS"
          value={String(summary.totalSets)}
        />
      </View>

      <View style={styles.topSetSection}>
        <Text style={styles.sectionLabel}>Top Set</Text>
        {summary.topSet ? (
          <>
            <Text style={styles.topSetHeadline}>
              {formatWeight(summary.topSet.weight)} {summary.topSet.unit.toUpperCase()} ×{" "}
              {summary.topSet.reps}
            </Text>
            <Text style={styles.topSetMeta}>
              {summary.topSet.exerciseName.toUpperCase()}
              {summary.topSet.rpe ? ` • RPE ${summary.topSet.rpe}` : ""}
            </Text>
          </>
        ) : (
          <Text style={styles.topSetMeta}>No completed sets were recorded.</Text>
        )}
      </View>

      <PrimaryButton
        label="Done"
        onPress={() => {
          router.replace("/(tabs)");
        }}
      />

      <Pressable
        style={({ pressed }) => [
          styles.secondaryButton,
          pressed ? styles.secondaryPressed : null,
        ]}
        onPress={() => {
          if (!summary.topSet) {
            return;
          }
          router.push(`/exercise/${summary.topSet.exerciseId}` as never);
        }}
      >
        <Text style={styles.secondaryLabel}>View Progress</Text>
      </Pressable>
    </ScrollView>
  );
}

type MetricCardProps = {
  label: string;
  value: string;
  unit?: string;
  emphasized?: boolean;
};

function MetricCard({ label, value, unit, emphasized = false }: MetricCardProps) {
  return (
    <View style={[styles.metricCard, emphasized ? styles.metricCardEmphasized : null]}>
      <Text style={[styles.metricLabel, emphasized ? styles.metricLabelEmphasized : null]}>
        {label}
      </Text>
      <View style={styles.metricValueRow}>
        <Text style={[styles.metricValue, emphasized ? styles.metricValueEmphasized : null]}>
          {value}
        </Text>
        {unit ? (
          <Text style={[styles.metricUnit, emphasized ? styles.metricUnitEmphasized : null]}>
            {unit}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

function formatDuration(totalSeconds: number): string {
  const safeSeconds = Math.max(0, totalSeconds);
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);

  if (hours > 0) {
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
  }

  const seconds = safeSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function formatWeight(value: number): string {
  if (Number.isInteger(value)) {
    return String(value);
  }

  return value.toFixed(1);
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: themeTokens.colors.background,
  },
  contentContainer: {
    padding: themeTokens.spacing.lg,
    gap: themeTokens.spacing.md,
  },
  centerState: {
    flex: 1,
    backgroundColor: themeTokens.colors.background,
    alignItems: "center",
    justifyContent: "center",
    gap: themeTokens.spacing.sm,
    paddingHorizontal: themeTokens.spacing.xl,
  },
  stateLabel: {
    color: themeTokens.colors.textSecondary,
    fontSize: 14,
    fontWeight: "600",
  },
  heroSection: {
    backgroundColor: themeTokens.colors.surfaceLow,
    borderRadius: themeTokens.radius.sm,
    padding: themeTokens.spacing.lg,
    gap: themeTokens.spacing.xs,
  },
  heroEyebrow: {
    color: themeTokens.colors.accentPrimary,
    textTransform: "uppercase",
    letterSpacing: 1.4,
    fontSize: 11,
    fontWeight: "700",
  },
  heroTitle: {
    color: themeTokens.colors.textPrimary,
    fontSize: 36,
    lineHeight: 40,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  heroSubtitle: {
    color: themeTokens.colors.textPrimary,
    fontSize: 18,
    lineHeight: 22,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  heroDate: {
    color: themeTokens.colors.textSecondary,
    fontSize: 12,
    letterSpacing: 0.7,
    textTransform: "uppercase",
    fontWeight: "600",
  },
  metricsGrid: {
    gap: themeTokens.spacing.sm,
  },
  metricCard: {
    backgroundColor: themeTokens.colors.surfaceLow,
    borderRadius: themeTokens.radius.sm,
    padding: themeTokens.spacing.md,
    gap: themeTokens.spacing.xs,
  },
  metricCardEmphasized: {
    backgroundColor: themeTokens.colors.surfaceHighest,
  },
  metricLabel: {
    color: themeTokens.colors.textSecondary,
    fontSize: 10,
    letterSpacing: 0.9,
    fontWeight: "700",
  },
  metricLabelEmphasized: {
    color: themeTokens.colors.accentPrimary,
  },
  metricValueRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: themeTokens.spacing.xs,
  },
  metricValue: {
    color: themeTokens.colors.textPrimary,
    fontSize: 34,
    lineHeight: 36,
    fontWeight: "800",
  },
  metricValueEmphasized: {
    color: themeTokens.colors.accentPrimary,
  },
  metricUnit: {
    color: themeTokens.colors.textSecondary,
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 4,
  },
  metricUnitEmphasized: {
    color: themeTokens.colors.accentDim,
  },
  topSetSection: {
    backgroundColor: themeTokens.colors.surfaceHigh,
    borderRadius: themeTokens.radius.sm,
    padding: themeTokens.spacing.md,
    gap: themeTokens.spacing.xs,
  },
  sectionLabel: {
    color: themeTokens.colors.accentPrimary,
    textTransform: "uppercase",
    letterSpacing: 1,
    fontWeight: "700",
    fontSize: 11,
  },
  topSetHeadline: {
    color: themeTokens.colors.textPrimary,
    fontSize: 28,
    lineHeight: 32,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  topSetMeta: {
    color: themeTokens.colors.textSecondary,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "600",
    letterSpacing: 0.6,
  },
  secondaryButton: {
    minHeight: 52,
    borderRadius: themeTokens.radius.sm,
    backgroundColor: themeTokens.colors.surfaceHigh,
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryPressed: {
    opacity: 0.82,
  },
  secondaryLabel: {
    color: themeTokens.colors.textPrimary,
    textTransform: "uppercase",
    letterSpacing: 0.9,
    fontSize: 12,
    fontWeight: "700",
  },
  errorText: {
    color: themeTokens.colors.danger,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "700",
    textAlign: "center",
  },
});
