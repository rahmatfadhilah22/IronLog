import { Ionicons } from "@expo/vector-icons";
import { Image, StyleSheet, Text, View } from "react-native";

import { themeTokens } from "../../../core/theme";
import type { WorkoutSummary } from "../../../types/workout";

export type ShareCardProps = {
  summary: WorkoutSummary;
  photoUri: string | null;
};

export function ShareCard({ summary, photoUri }: ShareCardProps) {
  const dateLabel = formatShareDate(summary.finishedAt);

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.headerBrand}>IRONLOG</Text>
        <Text style={styles.headerDate}>{dateLabel}</Text>
      </View>

      <View style={styles.photoArea}>
        {photoUri ? (
          <Image source={{ uri: photoUri }} style={styles.photo} resizeMode="contain" />
        ) : (
          <View style={styles.photoPlaceholder}>
            <Ionicons name="barbell" size={64} color={themeTokens.colors.accentPrimary} />
          </View>
        )}
      </View>

      <View style={styles.titleSection}>
        <Text style={styles.titleHeadline}>WORKOUT COMPLETE</Text>
        <View style={styles.titleBadge}>
          <Text style={styles.titleBadgeText} numberOfLines={1}>
            {summary.title.toUpperCase()}
          </Text>
        </View>
      </View>

      <View style={styles.metricsSection}>
        <View style={styles.metricsRow}>
          <View style={styles.metricCell}>
            <Text style={styles.metricLabel}>TOTAL VOLUME</Text>
            <Text style={styles.metricValue}>
              {Math.round(summary.totalVolume).toLocaleString()}
              <Text style={styles.metricUnit}> {summary.totalVolumeUnit.toUpperCase()}</Text>
            </Text>
          </View>
          <View style={styles.metricDivider} />
          <View style={styles.metricCell}>
            <Text style={styles.metricLabel}>DURATION</Text>
            <Text style={styles.metricValue}>
              {formatDurationMinutes(summary.durationSeconds)}
            </Text>
          </View>
        </View>

        <View style={styles.metricsRowDivider} />

        <View style={styles.metricsRow}>
          <View style={styles.metricCell}>
            <Text style={styles.metricLabel}>TOTAL SETS</Text>
            <Text style={styles.metricValue}>{summary.totalSets}</Text>
          </View>
          <View style={styles.metricDivider} />
          <View style={styles.metricCell}>
            <Text style={styles.metricLabel}>TOP SET</Text>
            {summary.topSet ? (
              <>
                <Text style={styles.metricValue}>
                  {formatWeight(summary.topSet.weight)}{" "}
                  {summary.topSet.unit.toUpperCase()} {"\u00D7"} {summary.topSet.reps}
                </Text>
                <Text style={styles.metricSubtext}>
                  {summary.topSet.exerciseName.toUpperCase()}
                </Text>
              </>
            ) : (
              <Text style={styles.metricSubtext}>---</Text>
            )}
          </View>
        </View>
      </View>
    </View>
  );
}

function formatShareDate(finishedAt: string | null): string {
  if (!finishedAt) {
    return new Date().toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }
  return new Date(finishedAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatDurationMinutes(totalSeconds: number): string {
  const safe = Math.max(0, totalSeconds);
  const mins = Math.floor(safe / 60);
  return `${mins}m`;
}

function formatWeight(value: number): string {
  if (Number.isInteger(value)) {
    return String(value);
  }
  return value.toFixed(1);
}

const CARD_WIDTH = 320;
const CARD_HEIGHT = 540;

const styles = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    backgroundColor: themeTokens.colors.background,
    borderRadius: 12,
    overflow: "hidden",
    alignSelf: "center",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: themeTokens.colors.accentPrimary,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  headerBrand: {
    color: themeTokens.colors.backgroundDeep,
    fontSize: 14,
    fontWeight: "900",
    letterSpacing: 2,
  },
  headerDate: {
    color: themeTokens.colors.backgroundDeep,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  photoArea: {
    flex: 1,
    backgroundColor: themeTokens.colors.backgroundDeep,
  },
  photo: {
    width: "100%",
    height: "100%",
  },
  photoPlaceholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  titleSection: {
    backgroundColor: themeTokens.colors.surfaceLow,
    paddingHorizontal: 12,
    paddingVertical: 10,
    alignItems: "center",
    gap: 8,
  },
  titleHeadline: {
    color: themeTokens.colors.textPrimary,
    fontSize: 18,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 1,
    textAlign: "center",
  },
  titleBadge: {
    backgroundColor: themeTokens.colors.accentPrimary,
    borderRadius: 6,
    paddingHorizontal: 14,
    paddingVertical: 6,
    alignSelf: "center",
  },
  titleBadgeText: {
    color: themeTokens.colors.backgroundDeep,
    fontSize: 14,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  metricsSection: {
    backgroundColor: themeTokens.colors.surfaceLow,
    padding: 12,
    gap: 6,
  },
  metricsRow: {
    flexDirection: "row",
  },
  metricsRowDivider: {
    height: 1,
    backgroundColor: themeTokens.colors.surfaceHigh,
  },
  metricCell: {
    flex: 1,
    alignItems: "center",
  },
  metricDivider: {
    width: 1,
    backgroundColor: themeTokens.colors.surfaceHigh,
  },
  metricLabel: {
    color: themeTokens.colors.accentPrimary,
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: 3,
  },
  metricValue: {
    color: themeTokens.colors.textPrimary,
    fontSize: 17,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  metricUnit: {
    color: themeTokens.colors.textSecondary,
    fontSize: 12,
    fontWeight: "700",
  },
  metricSubtext: {
    color: themeTokens.colors.textSecondary,
    fontSize: 10,
    fontWeight: "600",
    marginTop: 2,
  },
});
