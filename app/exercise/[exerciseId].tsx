import { useFocusEffect } from "@react-navigation/native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useState } from "react";
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

export default function ExerciseProgressScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ exerciseId?: string | string[] }>();
  const exerciseId = asFirstString(params.exerciseId);
  const [selectedRange, setSelectedRange] = useState<ProgressRange>("30d");
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
        <Text style={styles.headerEyebrow}>Performance Deep Dive</Text>
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
        <StatCard
          label="1RM FORMULA"
          value={detail.oneRmFormula.toUpperCase()}
        />
      </View>

      <TrendChartSection
        title="Weight Trend"
        subtitle={`TOP WEIGHT (${detail.preferredUnit.toUpperCase()})`}
        points={detail.trend.map((item) => ({
          value: item.topWeight,
          label: shortDate(item.performedAt),
          meta: `${formatMetric(item.topWeight)} ${detail.preferredUnit.toUpperCase()}`,
        }))}
      />

      <TrendChartSection
        title="Volume Trend"
        subtitle={`SESSION VOLUME (${detail.preferredUnit.toUpperCase()})`}
        points={detail.trend.map((item) => ({
          value: item.sessionVolume,
          label: shortDate(item.performedAt),
          meta: `${formatMetric(item.sessionVolume)} ${detail.preferredUnit.toUpperCase()}`,
        }))}
      />
    </ScrollView>
  );
}

type TrendPointView = {
  value: number;
  label: string;
  meta: string;
};

type TrendChartSectionProps = {
  title: string;
  subtitle: string;
  points: TrendPointView[];
};

function TrendChartSection({ title, subtitle, points }: TrendChartSectionProps) {
  if (points.length === 0) {
    return (
      <View style={styles.chartSection}>
        <Text style={styles.chartTitle}>{title}</Text>
        <Text style={styles.chartSubtitle}>{subtitle}</Text>
        <Text style={styles.chartEmpty}>Belum ada data pada range ini.</Text>
      </View>
    );
  }

  const recentPoints = points.slice(-12);
  const maxValue = Math.max(...recentPoints.map((item) => item.value), 1);

  return (
    <View style={styles.chartSection}>
      <Text style={styles.chartTitle}>{title}</Text>
      <Text style={styles.chartSubtitle}>{subtitle}</Text>
      <View style={styles.chartBars}>
        {recentPoints.map((point, index) => (
          <View key={`${point.label}-${index}`} style={styles.chartBarWrap}>
            <View style={styles.chartBarTrack}>
              <View
                style={[
                  styles.chartBarFill,
                  { height: `${Math.max(8, (point.value / maxValue) * 100)}%` },
                ]}
              />
            </View>
            <Text style={styles.chartLabel}>{point.label}</Text>
          </View>
        ))}
      </View>
      <Text style={styles.chartMeta}>
        Latest: {recentPoints[recentPoints.length - 1]?.meta ?? "-"}
      </Text>
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

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString();
}

function shortDate(iso: string): string {
  const date = new Date(iso);
  return `${date.getMonth() + 1}/${date.getDate()}`;
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
  chartSection: {
    backgroundColor: themeTokens.colors.surfaceLow,
    borderRadius: themeTokens.radius.sm,
    padding: themeTokens.spacing.md,
    gap: themeTokens.spacing.sm,
  },
  chartTitle: {
    color: themeTokens.colors.textPrimary,
    fontSize: 18,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  chartSubtitle: {
    color: themeTokens.colors.textSecondary,
    fontSize: 10,
    letterSpacing: 0.8,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  chartBars: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: themeTokens.spacing.xs,
    minHeight: 150,
  },
  chartBarWrap: {
    flex: 1,
    alignItems: "center",
    gap: 4,
  },
  chartBarTrack: {
    width: "100%",
    height: 120,
    backgroundColor: themeTokens.colors.surfaceHigh,
    justifyContent: "flex-end",
    overflow: "hidden",
    borderRadius: themeTokens.radius.sm,
  },
  chartBarFill: {
    width: "100%",
    backgroundColor: themeTokens.colors.accentPrimary,
  },
  chartLabel: {
    color: themeTokens.colors.textSecondary,
    fontSize: 9,
    fontWeight: "700",
  },
  chartMeta: {
    color: themeTokens.colors.textSecondary,
    fontSize: 11,
    fontWeight: "600",
  },
  chartEmpty: {
    color: themeTokens.colors.textSecondary,
    fontSize: 13,
  },
});
