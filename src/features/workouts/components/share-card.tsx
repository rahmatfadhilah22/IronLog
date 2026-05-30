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
          <Image source={{ uri: photoUri }} style={styles.photo} resizeMode="cover" />
        ) : (
          <View style={styles.photoPlaceholder}>
            <Ionicons name="barbell" size={64} color={themeTokens.colors.accentPrimary} />
          </View>
        )}
      </View>

      <View style={styles.titleSection}>
        <Text style={styles.titleEyebrow}>MISSION ACCOMPLISHED</Text>
        <Text style={styles.titleMain}>
          {summary.title.toUpperCase()}
        </Text>
      </View>

      <View style={styles.metricsSection}>
        <View style={styles.metricColumn}>
          <Text style={styles.metricLabel}>VOLUME</Text>
          <Text style={styles.metricValue}>
            {Math.round(summary.totalVolume).toLocaleString()}
          </Text>
          <Text style={styles.metricUnit}>
            {summary.totalVolumeUnit.toUpperCase()}
          </Text>
        </View>

        <View style={styles.metricColumn}>
          <Text style={styles.metricLabel}>DURATION</Text>
          <Text style={styles.metricValue}>
            {formatDurationMinutes(summary.durationSeconds)}
          </Text>
        </View>

        <View style={styles.metricColumn}>
          <Text style={styles.metricLabel}>SETS</Text>
          <Text style={styles.metricValue}>{summary.totalSets}</Text>
        </View>
      </View>

      {summary.topSet && (
        <View style={styles.topSetSection}>
          <Text style={styles.topSetLabel}>TOP SET</Text>
          <Text style={styles.topSetValue}>
            {formatWeight(summary.topSet.weight)}{" "}
            {summary.topSet.unit.toUpperCase()} {"\u00D7"} {summary.topSet.reps}
          </Text>
          <Text style={styles.topSetName}>
            {summary.topSet.exerciseName.toUpperCase()}
            {summary.topSet.rpe ? `  \u2022  RPE ${summary.topSet.rpe}` : ""}
          </Text>
        </View>
      )}

      <View style={styles.footer}>
        <Text style={styles.footerText}>ironlog.app</Text>
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
    height: (CARD_HEIGHT - 36) * 0.45,
    backgroundColor: themeTokens.colors.backgroundDeep,
    overflow: "hidden",
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
    gap: 2,
  },
  titleEyebrow: {
    color: themeTokens.colors.accentPrimary,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  titleMain: {
    color: themeTokens.colors.textPrimary,
    fontSize: 16,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  metricsSection: {
    flexDirection: "row",
    backgroundColor: themeTokens.colors.surfaceLow,
    paddingHorizontal: 12,
    paddingBottom: 10,
    gap: 8,
  },
  metricColumn: {
    flex: 1,
    alignItems: "center",
  },
  metricLabel: {
    color: themeTokens.colors.textSecondary,
    fontSize: 8,
    fontWeight: "700",
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: 2,
  },
  metricValue: {
    color: themeTokens.colors.textPrimary,
    fontSize: 22,
    fontWeight: "800",
  },
  metricUnit: {
    color: themeTokens.colors.textSecondary,
    fontSize: 10,
    fontWeight: "700",
    marginTop: 1,
  },
  topSetSection: {
    backgroundColor: themeTokens.colors.surfaceHigh,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 2,
  },
  topSetLabel: {
    color: themeTokens.colors.accentPrimary,
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  topSetValue: {
    color: themeTokens.colors.textPrimary,
    fontSize: 18,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  topSetName: {
    color: themeTokens.colors.textSecondary,
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 0.5,
  },
  footer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  footerText: {
    color: themeTokens.colors.accentPrimary,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1,
  },
});
