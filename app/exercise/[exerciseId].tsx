import { useFocusEffect } from "@react-navigation/native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { PrimaryButton } from "../../src/components";
import { themeTokens } from "../../src/core/theme";
import { analyticsService } from "../../src/services/analytics";
import type { ExerciseProgressDetail, ProgressRange } from "../../src/types/progress";

type SnapshotMetric = "weight" | "volume" | "oneRm";

export default function ExerciseProgressScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ exerciseId?: string | string[] }>();
  const exerciseId = asFirstString(params.exerciseId);
  const [selectedRange, setSelectedRange] = useState<ProgressRange>("30d");
  const [snapshotMetric, setSnapshotMetric] = useState<SnapshotMetric>("weight");
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [detail, setDetail] = useState<ExerciseProgressDetail | null>(null);

  const loadDetail = useCallback(() => {
    if (!exerciseId) {
      setIsLoading(false);
      setErrorMessage("Exercise ID tidak valid.");
      setDetail(null);
      return () => {};
    }

    let isActive = true;
    setIsLoading(true);
    setErrorMessage(null);

    analyticsService
      .getExerciseProgressDetail(exerciseId, selectedRange)
      .then((result) => {
        if (!isActive) {
          return;
        }

        if (!result) {
          setErrorMessage("Data exercise tidak ditemukan.");
          setDetail(null);
          return;
        }

        setDetail(result);
      })
      .catch((error: unknown) => {
        if (isActive) {
          setErrorMessage(
            error instanceof Error
              ? error.message
              : "Gagal memuat detail progress exercise.",
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
  }, [exerciseId, selectedRange]);

  useFocusEffect(loadDetail);

  if (isLoading) {
    return (
      <View style={styles.centerState}>
        <ActivityIndicator size="large" color={themeTokens.colors.accentPrimary} />
      </View>
    );
  }

  if (!detail) {
    return (
      <View style={styles.centerState}>
        <Text style={styles.errorText}>{errorMessage ?? "Detail tidak tersedia."}</Text>
        <PrimaryButton
          label="Back To Progress"
          onPress={() => {
            router.back();
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
      <View style={styles.headerSection}>
        <Text style={styles.headerEyebrow}>Exercise Progress</Text>
        <Text style={styles.headerTitle}>{detail.exerciseName.toUpperCase()}</Text>
        <Text style={styles.headerMeta}>
          {detail.muscleGroup.toUpperCase()} • {detail.equipmentType.toUpperCase()}
        </Text>
      </View>

      <View style={styles.rangeRow}>
        {(["30d", "90d", "all"] as const).map((rangeValue) => (
          <Pressable
            key={rangeValue}
            onPress={() => {
              setSelectedRange(rangeValue);
            }}
            style={[
              styles.rangeChip,
              selectedRange === rangeValue ? styles.rangeChipSelected : null,
            ]}
          >
            <Text
              style={[
                styles.rangeChipLabel,
                selectedRange === rangeValue ? styles.rangeChipLabelSelected : null,
              ]}
            >
              {rangeValue.toUpperCase()}
            </Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.statGrid}>
        <StatCard
          label="BEST 1RM"
          value={`${formatMetric(detail.bestOneRm)} ${detail.preferredUnit.toUpperCase()}`}
          emphasized
        />
        <StatCard
          label="BEST WEIGHT"
          value={`${formatMetric(detail.bestWeight)} ${detail.preferredUnit.toUpperCase()}`}
        />
        <StatCard
          label="BEST VOLUME"
          value={`${formatMetric(detail.bestVolume)} ${detail.preferredUnit.toUpperCase()}`}
        />
        <StatCard label="TOTAL SESSIONS" value={String(detail.totalSessions)} />
        <StatCard
          label="LAST PERFORMED"
          value={detail.lastPerformed ? formatDate(detail.lastPerformed) : "-"}
        />
      </View>

      <TrendSnapshotSection
        detail={detail}
        selectedMetric={snapshotMetric}
        onSelectMetric={setSnapshotMetric}
      />

      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>How To Read This</Text>
        <Text style={styles.infoText}>
          Each row below represents one completed workout session for this exercise
          within the selected range.
        </Text>
      </View>

      <SessionHistorySection detail={detail} />
    </ScrollView>
  );
}

type SessionHistorySectionProps = {
  detail: ExerciseProgressDetail;
};

type TrendSnapshotSectionProps = {
  detail: ExerciseProgressDetail;
  selectedMetric: SnapshotMetric;
  onSelectMetric: (metric: SnapshotMetric) => void;
};

function TrendSnapshotSection({
  detail,
  selectedMetric,
  onSelectMetric,
}: TrendSnapshotSectionProps) {
  const recentSessions = useMemo(() => detail.trend.slice(-6), [detail.trend]);

  const points = useMemo(
    () =>
      recentSessions.map((session) => ({
        workoutId: session.workoutId,
        performedAt: session.performedAt,
        value:
          selectedMetric === "weight"
            ? session.topWeight
            : selectedMetric === "volume"
              ? session.sessionVolume
              : session.estimatedOneRm,
      })),
    [recentSessions, selectedMetric],
  );

  if (points.length === 0) {
    return (
      <View style={styles.snapshotSection}>
        <Text style={styles.snapshotTitle}>Trend Snapshot</Text>
        <Text style={styles.snapshotEmpty}>No visual trend available in this range.</Text>
      </View>
    );
  }

  const latestPoint = points[points.length - 1];
  const previousPoint = points.length > 1 ? points[points.length - 2] : null;
  const delta = previousPoint ? latestPoint.value - previousPoint.value : null;
  const maxValue = Math.max(...points.map((point) => point.value), 1);
  const metricLabel =
    selectedMetric === "weight"
      ? "Top Weight"
      : selectedMetric === "volume"
        ? "Session Volume"
        : "Estimated 1RM";
  const deltaLabel =
    delta === null
      ? "First tracked session in this range."
      : delta === 0
        ? "No change from the previous session."
        : `${delta > 0 ? "+" : ""}${formatMetric(delta)} ${detail.preferredUnit.toUpperCase()} vs previous session`;

  return (
    <View style={styles.snapshotSection}>
      <Text style={styles.snapshotTitle}>Trend Snapshot</Text>
      <Text style={styles.snapshotSubtitle}>LAST 6 COMPLETED SESSIONS</Text>

      <View style={styles.snapshotToggleRow}>
        <SnapshotChip
          label="Weight"
          selected={selectedMetric === "weight"}
          onPress={() => onSelectMetric("weight")}
        />
        <SnapshotChip
          label="Volume"
          selected={selectedMetric === "volume"}
          onPress={() => onSelectMetric("volume")}
        />
        <SnapshotChip
          label="1RM"
          selected={selectedMetric === "oneRm"}
          onPress={() => onSelectMetric("oneRm")}
        />
      </View>

      <View style={styles.snapshotSummaryCard}>
        <Text style={styles.snapshotSummaryLabel}>{metricLabel}</Text>
        <Text style={styles.snapshotSummaryValue}>
          {formatMetric(latestPoint.value)} {detail.preferredUnit.toUpperCase()}
        </Text>
        <Text
          style={[
            styles.snapshotSummaryDelta,
            delta !== null && delta > 0 ? styles.snapshotSummaryDeltaPositive : null,
            delta !== null && delta < 0 ? styles.snapshotSummaryDeltaNegative : null,
          ]}
        >
          {deltaLabel}
        </Text>
      </View>

      <View style={styles.snapshotBars}>
        {points.map((point) => (
          <View key={point.workoutId} style={styles.snapshotBarItem}>
            <Text style={styles.snapshotBarValue}>{formatCompactMetric(point.value)}</Text>
            <View style={styles.snapshotBarTrack}>
              <View
                style={[
                  styles.snapshotBarFill,
                  {
                    height: `${Math.max(10, (point.value / maxValue) * 100)}%`,
                  },
                ]}
              />
            </View>
            <Text style={styles.snapshotBarLabel}>{formatShortDateTime(point.performedAt)}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

type SnapshotChipProps = {
  label: string;
  selected: boolean;
  onPress: () => void;
};

function SnapshotChip({ label, selected, onPress }: SnapshotChipProps) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.snapshotChip, selected ? styles.snapshotChipSelected : null]}
    >
      <Text
        style={[
          styles.snapshotChipLabel,
          selected ? styles.snapshotChipLabelSelected : null,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function SessionHistorySection({ detail }: SessionHistorySectionProps) {
  if (detail.trend.length === 0) {
    return (
      <View style={styles.historySection}>
        <Text style={styles.historyTitle}>Session History</Text>
        <Text style={styles.historyEmpty}>No completed sessions in this range.</Text>
      </View>
    );
  }

  return (
    <View style={styles.historySection}>
      <Text style={styles.historyTitle}>Session History</Text>
      <Text style={styles.historySubtitle}>
        TOP WEIGHT, SESSION VOLUME, ESTIMATED 1RM, AND SET COUNT
      </Text>

      <View style={styles.historyList}>
        {[...detail.trend].reverse().map((session) => (
          <View key={session.workoutId} style={styles.historyCard}>
            <View style={styles.historyTopRow}>
              <Text style={styles.historyDate}>{formatDate(session.performedAt)}</Text>
              <Text style={styles.historySets}>{session.setCount} SETS</Text>
            </View>

            <View style={styles.historyMetricGrid}>
              <MetricItem
                label="TOP WEIGHT"
                value={`${formatMetric(session.topWeight)} ${detail.preferredUnit.toUpperCase()}`}
              />
              <MetricItem
                label="SESSION VOLUME"
                value={`${formatMetric(session.sessionVolume)} ${detail.preferredUnit.toUpperCase()}`}
              />
              <MetricItem
                label="EST. 1RM"
                value={`${formatMetric(session.estimatedOneRm)} ${detail.preferredUnit.toUpperCase()}`}
              />
              <MetricItem label="FORMULA" value={detail.oneRmFormula.toUpperCase()} />
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

type MetricItemProps = {
  label: string;
  value: string;
};

function MetricItem({ label, value }: MetricItemProps) {
  return (
    <View style={styles.metricItem}>
      <Text style={styles.metricItemLabel}>{label}</Text>
      <Text style={styles.metricItemValue}>{value}</Text>
    </View>
  );
}

type StatCardProps = {
  label: string;
  value: string;
  emphasized?: boolean;
};

function StatCard({ label, value, emphasized = false }: StatCardProps) {
  return (
    <View style={[styles.statCard, emphasized ? styles.statCardEmphasized : null]}>
      <Text style={[styles.statLabel, emphasized ? styles.statLabelEmphasized : null]}>
        {label}
      </Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );
}

function asFirstString(value?: string | string[]): string | undefined {
  if (!value) {
    return undefined;
  }

  return Array.isArray(value) ? value[0] : value;
}

function formatMetric(value: number): string {
  if (Number.isInteger(value)) {
    return value.toLocaleString();
  }

  return value.toFixed(1);
}

function formatCompactMetric(value: number): string {
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}k`;
  }

  return formatMetric(value);
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatShortDateTime(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
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
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: themeTokens.colors.background,
    paddingHorizontal: themeTokens.spacing.lg,
    gap: themeTokens.spacing.md,
  },
  errorText: {
    color: themeTokens.colors.danger,
    textAlign: "center",
    fontWeight: "700",
  },
  headerSection: {
    gap: 2,
  },
  headerEyebrow: {
    color: themeTokens.colors.accentPrimary,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.3,
    textTransform: "uppercase",
  },
  headerTitle: {
    color: themeTokens.colors.textPrimary,
    fontSize: 40,
    lineHeight: 42,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  headerMeta: {
    color: themeTokens.colors.textSecondary,
    fontSize: 12,
    letterSpacing: 0.8,
    fontWeight: "600",
  },
  rangeRow: {
    flexDirection: "row",
    gap: themeTokens.spacing.xs,
  },
  rangeChip: {
    minHeight: 34,
    minWidth: 68,
    borderRadius: themeTokens.radius.sm,
    backgroundColor: themeTokens.colors.surfaceLow,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: themeTokens.spacing.sm,
  },
  rangeChipSelected: {
    backgroundColor: themeTokens.colors.accentPrimary,
  },
  rangeChipLabel: {
    color: themeTokens.colors.textPrimary,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.8,
  },
  rangeChipLabelSelected: {
    color: themeTokens.colors.backgroundDeep,
  },
  statGrid: {
    gap: themeTokens.spacing.xs,
  },
  statCard: {
    backgroundColor: themeTokens.colors.surfaceLow,
    borderRadius: themeTokens.radius.sm,
    padding: themeTokens.spacing.md,
    gap: 2,
  },
  statCardEmphasized: {
    backgroundColor: themeTokens.colors.surfaceHighest,
  },
  statLabel: {
    color: themeTokens.colors.textSecondary,
    fontSize: 10,
    letterSpacing: 0.8,
    fontWeight: "700",
  },
  statLabelEmphasized: {
    color: themeTokens.colors.accentPrimary,
  },
  statValue: {
    color: themeTokens.colors.textPrimary,
    fontSize: 24,
    lineHeight: 28,
    fontWeight: "800",
  },
  snapshotSection: {
    backgroundColor: themeTokens.colors.surfaceLow,
    borderRadius: themeTokens.radius.sm,
    padding: themeTokens.spacing.md,
    gap: themeTokens.spacing.sm,
  },
  snapshotTitle: {
    color: themeTokens.colors.textPrimary,
    fontSize: 18,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  snapshotSubtitle: {
    color: themeTokens.colors.textSecondary,
    fontSize: 10,
    letterSpacing: 0.8,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  snapshotToggleRow: {
    flexDirection: "row",
    gap: themeTokens.spacing.xs,
  },
  snapshotChip: {
    minHeight: 34,
    minWidth: 72,
    borderRadius: themeTokens.radius.sm,
    backgroundColor: themeTokens.colors.surfaceHighest,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: themeTokens.spacing.sm,
  },
  snapshotChipSelected: {
    backgroundColor: themeTokens.colors.accentPrimary,
  },
  snapshotChipLabel: {
    color: themeTokens.colors.textPrimary,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.6,
  },
  snapshotChipLabelSelected: {
    color: themeTokens.colors.backgroundDeep,
  },
  snapshotSummaryCard: {
    backgroundColor: themeTokens.colors.background,
    borderRadius: themeTokens.radius.sm,
    padding: themeTokens.spacing.md,
    gap: 4,
    borderWidth: 1,
    borderColor: themeTokens.colors.surfaceHighest,
  },
  snapshotSummaryLabel: {
    color: themeTokens.colors.textSecondary,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  snapshotSummaryValue: {
    color: themeTokens.colors.textPrimary,
    fontSize: 24,
    lineHeight: 28,
    fontWeight: "800",
  },
  snapshotSummaryDelta: {
    color: themeTokens.colors.textSecondary,
    fontSize: 12,
    lineHeight: 18,
    fontWeight: "600",
  },
  snapshotSummaryDeltaPositive: {
    color: themeTokens.colors.accentPrimary,
  },
  snapshotSummaryDeltaNegative: {
    color: "#FF8D7E",
  },
  snapshotBars: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: themeTokens.spacing.xs,
    minHeight: 170,
  },
  snapshotBarItem: {
    flex: 1,
    alignItems: "center",
    gap: 6,
  },
  snapshotBarValue: {
    color: themeTokens.colors.textSecondary,
    fontSize: 10,
    fontWeight: "700",
  },
  snapshotBarTrack: {
    width: "100%",
    height: 120,
    backgroundColor: themeTokens.colors.surfaceHigh,
    borderRadius: themeTokens.radius.sm,
    justifyContent: "flex-end",
    overflow: "hidden",
  },
  snapshotBarFill: {
    width: "100%",
    backgroundColor: themeTokens.colors.accentPrimary,
  },
  snapshotBarLabel: {
    color: themeTokens.colors.textSecondary,
    fontSize: 9,
    fontWeight: "700",
    textAlign: "center",
  },
  infoCard: {
    backgroundColor: themeTokens.colors.surfaceLow,
    borderRadius: themeTokens.radius.sm,
    padding: themeTokens.spacing.md,
    gap: themeTokens.spacing.sm,
  },
  infoTitle: {
    color: themeTokens.colors.textPrimary,
    fontSize: 16,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  infoText: {
    color: themeTokens.colors.textSecondary,
    fontSize: 13,
    lineHeight: 20,
  },
  historySection: {
    backgroundColor: themeTokens.colors.surfaceLow,
    borderRadius: themeTokens.radius.sm,
    padding: themeTokens.spacing.md,
    gap: themeTokens.spacing.sm,
  },
  historyTitle: {
    color: themeTokens.colors.textPrimary,
    fontSize: 18,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  historySubtitle: {
    color: themeTokens.colors.textSecondary,
    fontSize: 10,
    letterSpacing: 0.8,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  historyList: {
    gap: themeTokens.spacing.sm,
  },
  historyCard: {
    backgroundColor: themeTokens.colors.background,
    borderRadius: themeTokens.radius.sm,
    padding: themeTokens.spacing.md,
    gap: themeTokens.spacing.sm,
    borderWidth: 1,
    borderColor: themeTokens.colors.surfaceHighest,
  },
  historyTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: themeTokens.spacing.sm,
  },
  historyDate: {
    flex: 1,
    color: themeTokens.colors.textPrimary,
    fontSize: 15,
    fontWeight: "700",
  },
  historySets: {
    color: themeTokens.colors.accentPrimary,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.8,
  },
  historyMetricGrid: {
    gap: themeTokens.spacing.xs,
  },
  historyEmpty: {
    color: themeTokens.colors.textSecondary,
    fontSize: 13,
  },
  metricItem: {
    backgroundColor: themeTokens.colors.surfaceHigh,
    borderRadius: themeTokens.radius.sm,
    paddingHorizontal: themeTokens.spacing.sm,
    paddingVertical: themeTokens.spacing.sm,
    gap: 2,
  },
  metricItemLabel: {
    color: themeTokens.colors.textSecondary,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  metricItemValue: {
    color: themeTokens.colors.textPrimary,
    fontSize: 15,
    fontWeight: "700",
  },
  snapshotEmpty: {
    color: themeTokens.colors.textSecondary,
    fontSize: 13,
  },
});
