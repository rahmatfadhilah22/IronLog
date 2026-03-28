import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { PrimaryButton } from "../src/components";
import { themeTokens } from "../src/core/theme";
import { bodyMetricsService } from "../src/services/body-metrics";
import { appSettingsService } from "../src/services/settings";
import type { BodyMetricEntry } from "../src/types/body-metrics";
import type { PreferredUnit } from "../src/types/settings";

export default function BodyMetricsScreen() {
  const insets = useSafeAreaInsets();
  const [preferredUnit, setPreferredUnit] = useState<PreferredUnit>("kg");
  const [weightInput, setWeightInput] = useState("");
  const [bodyFatInput, setBodyFatInput] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [history, setHistory] = useState<BodyMetricEntry[]>([]);

  const loadMetrics = useCallback(() => {
    let isActive = true;
    setIsLoading(true);
    setErrorMessage(null);

    Promise.all([appSettingsService.get(), bodyMetricsService.listMetrics(60)])
      .then(([settings, items]) => {
        if (!isActive) {
          return;
        }
        setPreferredUnit(settings.preferredUnit);
        setHistory(items);
      })
      .catch((error: unknown) => {
        if (isActive) {
          setErrorMessage(
            error instanceof Error ? error.message : "Failed to load body metrics.",
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

  useFocusEffect(loadMetrics);

  const latestMetric = history[0] ?? null;
  const previousMetric = history[1] ?? null;

  const weightDelta = useMemo(() => {
    if (!latestMetric || !previousMetric) {
      return null;
    }
    return latestMetric.weight - previousMetric.weight;
  }, [latestMetric, previousMetric]);

  const onSave = async () => {
    const parsedWeight = Number.parseFloat(weightInput.replace(",", "."));
    const parsedBodyFat = bodyFatInput.trim()
      ? Number.parseFloat(bodyFatInput.replace(",", "."))
      : undefined;

    if (!Number.isFinite(parsedWeight) || parsedWeight <= 0) {
      setErrorMessage("Weight must be a number greater than 0.");
      return;
    }

    if (
      bodyFatInput.trim() &&
      (
        parsedBodyFat === undefined ||
        !Number.isFinite(parsedBodyFat) ||
        parsedBodyFat < 0 ||
        parsedBodyFat > 100
      )
    ) {
      setErrorMessage("Body fat must stay within the 0-100 range.");
      return;
    }

    setIsSaving(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      await bodyMetricsService.addMetric({
        weight: parsedWeight,
        bodyFatPercentage: parsedBodyFat,
      });
      setWeightInput("");
      setBodyFatInput("");
      setSuccessMessage("Body metric saved.");
      const items = await bodyMetricsService.listMetrics(60);
      setHistory(items);
    } catch (error: unknown) {
      setErrorMessage(error instanceof Error ? error.message : "Failed to save body metric.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? insets.top : 0}
    >
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.contentContainer,
          { paddingBottom: insets.bottom + themeTokens.spacing.xxl },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.headerEyebrow}>Current Stats</Text>
          <Text style={styles.headerTitle}>
            {latestMetric ? formatMetric(latestMetric.weight) : "-"}
            <Text style={styles.headerUnit}> {preferredUnit.toUpperCase()}</Text>
          </Text>
          <Text style={styles.headerSub}>
            {weightDelta === null
              ? "No previous check-in yet"
              : `${weightDelta >= 0 ? "+" : ""}${formatMetric(weightDelta)} ${preferredUnit.toUpperCase()} vs the previous entry`}
          </Text>
          <Text style={styles.headerBodyFat}>
            BODY FAT:{" "}
            {latestMetric?.bodyFatPercentage !== null &&
            latestMetric?.bodyFatPercentage !== undefined
              ? `${formatMetric(latestMetric.bodyFatPercentage)}%`
              : "-"}
          </Text>
        </View>

        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>Log New Entry</Text>
          <View style={styles.formGrid}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>
                Weight ({preferredUnit.toUpperCase()})
              </Text>
              <TextInput
                value={weightInput}
                onChangeText={setWeightInput}
                keyboardType="decimal-pad"
                style={styles.input}
                placeholder={preferredUnit === "kg" ? "84.2" : "185.6"}
                placeholderTextColor={themeTokens.colors.textSecondary}
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Body Fat % (Opt)</Text>
              <TextInput
                value={bodyFatInput}
                onChangeText={setBodyFatInput}
                keyboardType="decimal-pad"
                style={styles.input}
                placeholder="14.8"
                placeholderTextColor={themeTokens.colors.textSecondary}
              />
            </View>
          </View>

          {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
          {successMessage ? <Text style={styles.successText}>{successMessage}</Text> : null}

          <PrimaryButton
            label={isSaving ? "Saving..." : "Commit Entry"}
            onPress={() => {
              void onSave();
            }}
            disabled={isSaving}
          />
        </View>

        <View style={styles.historySection}>
          <Text style={styles.sectionTitle}>Metric History</Text>

          {isLoading ? (
            <View style={styles.centerState}>
              <ActivityIndicator size="large" color={themeTokens.colors.accentPrimary} />
            </View>
          ) : history.length === 0 ? (
            <Text style={styles.emptyText}>No body metrics logged yet.</Text>
          ) : (
            <View style={styles.historyList}>
              {history.map((entry) => (
                <HistoryRow key={entry.id} entry={entry} preferredUnit={preferredUnit} />
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

type HistoryRowProps = {
  entry: BodyMetricEntry;
  preferredUnit: PreferredUnit;
};

function HistoryRow({ entry, preferredUnit }: HistoryRowProps) {
  const date = new Date(entry.recordedAt);

  return (
    <Pressable style={styles.historyRow}>
      <View style={styles.historyDateWrap}>
        <Text style={styles.historyDateMain}>
          {date.toLocaleDateString(undefined, { month: "short", day: "2-digit" })}
        </Text>
        <Text style={styles.historyDateSub}>
          {date.toLocaleDateString(undefined, { weekday: "short" }).toUpperCase()}
        </Text>
      </View>
      <View style={styles.historyMetrics}>
        <View style={styles.historyMetricBlock}>
          <Text style={styles.historyValue}>
            {formatMetric(entry.weight)} {preferredUnit.toUpperCase()}
          </Text>
        </View>
        <View style={styles.historyMetricBlock}>
          <Text style={styles.historyValueMuted}>
            {entry.bodyFatPercentage === null
              ? "--"
              : `${formatMetric(entry.bodyFatPercentage)}%`}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

function formatMetric(value: number): string {
  if (Number.isInteger(value)) {
    return value.toLocaleString();
  }

  return value.toFixed(1);
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: themeTokens.colors.background,
  },
  scroll: {
    flex: 1,
    backgroundColor: themeTokens.colors.background,
  },
  contentContainer: {
    padding: themeTokens.spacing.lg,
    gap: themeTokens.spacing.md,
  },
  header: {
    backgroundColor: themeTokens.colors.surfaceLow,
    borderRadius: themeTokens.radius.sm,
    padding: themeTokens.spacing.lg,
    gap: 2,
  },
  headerEyebrow: {
    color: themeTokens.colors.accentPrimary,
    fontSize: 11,
    letterSpacing: 1.1,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  headerTitle: {
    color: themeTokens.colors.textPrimary,
    fontSize: 52,
    lineHeight: 54,
    fontWeight: "800",
  },
  headerUnit: {
    color: themeTokens.colors.textSecondary,
    fontSize: 20,
    fontWeight: "700",
  },
  headerSub: {
    color: themeTokens.colors.accentPrimary,
    fontSize: 11,
    letterSpacing: 0.8,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  headerBodyFat: {
    color: themeTokens.colors.textSecondary,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.8,
    marginTop: themeTokens.spacing.xs,
  },
  formSection: {
    backgroundColor: themeTokens.colors.surfaceLow,
    borderRadius: themeTokens.radius.sm,
    padding: themeTokens.spacing.md,
    gap: themeTokens.spacing.sm,
  },
  sectionTitle: {
    color: themeTokens.colors.textPrimary,
    fontSize: 18,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  formGrid: {
    flexDirection: "row",
    gap: themeTokens.spacing.sm,
  },
  inputGroup: {
    flex: 1,
    gap: 6,
  },
  inputLabel: {
    color: themeTokens.colors.textSecondary,
    fontSize: 10,
    letterSpacing: 0.8,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  input: {
    minHeight: 48,
    backgroundColor: themeTokens.colors.surfaceHigh,
    borderRadius: themeTokens.radius.sm,
    color: themeTokens.colors.textPrimary,
    fontSize: 22,
    lineHeight: 24,
    fontWeight: "700",
    textAlign: "center",
    paddingHorizontal: themeTokens.spacing.sm,
  },
  errorText: {
    color: themeTokens.colors.danger,
    fontSize: 12,
    fontWeight: "700",
  },
  successText: {
    color: themeTokens.colors.accentPrimary,
    fontSize: 12,
    fontWeight: "700",
  },
  historySection: {
    gap: themeTokens.spacing.sm,
  },
  centerState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: themeTokens.spacing.xl,
  },
  emptyText: {
    color: themeTokens.colors.textSecondary,
    fontSize: 13,
  },
  historyList: {
    gap: themeTokens.spacing.xs,
  },
  historyRow: {
    minHeight: 64,
    backgroundColor: themeTokens.colors.surfaceLow,
    borderRadius: themeTokens.radius.sm,
    paddingHorizontal: themeTokens.spacing.md,
    paddingVertical: themeTokens.spacing.sm,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  historyDateWrap: {
    gap: 0,
  },
  historyDateMain: {
    color: themeTokens.colors.textPrimary,
    fontSize: 18,
    lineHeight: 20,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  historyDateSub: {
    color: themeTokens.colors.textSecondary,
    fontSize: 10,
    letterSpacing: 0.8,
    fontWeight: "700",
  },
  historyMetrics: {
    flexDirection: "row",
    alignItems: "center",
    gap: themeTokens.spacing.lg,
  },
  historyMetricBlock: {
    alignItems: "flex-end",
  },
  historyValue: {
    color: themeTokens.colors.textPrimary,
    fontSize: 17,
    lineHeight: 20,
    fontWeight: "700",
  },
  historyValueMuted: {
    color: themeTokens.colors.textSecondary,
    fontSize: 17,
    lineHeight: 20,
    fontWeight: "700",
  },
});
