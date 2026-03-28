import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { APP_NAME } from "../../src/core/constants";
import { ConfirmationDialog } from "../../src/components";
import { themeTokens } from "../../src/core/theme";
import { analyticsService } from "../../src/services/analytics";
import { backupService, getBackupWarningText } from "../../src/services/backup";
import { appSettingsService } from "../../src/services/settings";
import type { OneRmFormula, PreferredUnit } from "../../src/types/settings";

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const [isLoading, setIsLoading] = useState(true);
  const [isBusy, setIsBusy] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [preferredUnit, setPreferredUnit] = useState<PreferredUnit>("kg");
  const [oneRmFormula, setOneRmFormula] = useState<OneRmFormula>("brzycki");
  const [hapticsEnabled, setHapticsEnabled] = useState(true);
  const [autoStartRestTimer, setAutoStartRestTimer] = useState(true);
  const [pendingRestore, setPendingRestore] = useState<{
    payload: Parameters<typeof backupService.restoreFromBackup>[0];
    sourceName: string;
  } | null>(null);

  const loadSettings = useCallback(() => {
    let isActive = true;
    setIsLoading(true);
    setErrorMessage(null);

    appSettingsService
      .get()
      .then((settings) => {
        if (!isActive) {
          return;
        }

        setPreferredUnit(settings.preferredUnit);
        setOneRmFormula(settings.oneRmFormula);
        setHapticsEnabled(settings.hapticsEnabled);
        setAutoStartRestTimer(settings.autoStartRestTimer);
      })
      .catch((error: unknown) => {
        if (isActive) {
          setErrorMessage(
            error instanceof Error
              ? error.message
              : "Gagal memuat app settings.",
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

  useFocusEffect(loadSettings);

  const onUpdateSettings = async (
    update: Partial<{
      preferredUnit: PreferredUnit;
      oneRmFormula: OneRmFormula;
      hapticsEnabled: boolean;
      autoStartRestTimer: boolean;
    }>,
  ) => {
    setIsBusy(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const next = await appSettingsService.update(update);
      setPreferredUnit(next.preferredUnit);
      setOneRmFormula(next.oneRmFormula);
      setHapticsEnabled(next.hapticsEnabled);
      setAutoStartRestTimer(next.autoStartRestTimer);

      if (update.preferredUnit || update.oneRmFormula) {
        await analyticsService.rebuildExerciseStats();
      }

      setSuccessMessage("Settings tersimpan.");
    } catch (error: unknown) {
      setErrorMessage(error instanceof Error ? error.message : "Gagal menyimpan settings.");
    } finally {
      setIsBusy(false);
    }
  };

  const onExportJson = async () => {
    setIsBusy(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const result = await backupService.exportJsonBackup();
      await backupService.shareFile(result.fileUri);
      setSuccessMessage(`Backup JSON berhasil dibuat: ${result.fileName}`);
    } catch (error: unknown) {
      setErrorMessage(error instanceof Error ? error.message : "Export JSON gagal.");
    } finally {
      setIsBusy(false);
    }
  };

  const onExportCsv = async () => {
    setIsBusy(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const result = await backupService.exportCsvAnalytics();
      await backupService.shareFile(result.fileUri);
      setSuccessMessage(`Export CSV berhasil dibuat: ${result.fileName}`);
    } catch (error: unknown) {
      setErrorMessage(error instanceof Error ? error.message : "Export CSV gagal.");
    } finally {
      setIsBusy(false);
    }
  };

  const onImportJson = async () => {
    setIsBusy(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const parsed = await backupService.pickAndParseJsonBackup();
      if (!parsed) {
        return;
      }

      setPendingRestore({
        payload: parsed.payload,
        sourceName: parsed.sourceName,
      });
    } catch (error: unknown) {
      setErrorMessage(error instanceof Error ? error.message : "Import JSON gagal.");
    } finally {
      setIsBusy(false);
    }
  };

  const confirmRestore = async (
    payload: Parameters<typeof backupService.restoreFromBackup>[0],
  ) => {
    setIsBusy(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      await backupService.restoreFromBackup(payload);
      const settings = await appSettingsService.refresh();
      setPreferredUnit(settings.preferredUnit);
      setOneRmFormula(settings.oneRmFormula);
      setHapticsEnabled(settings.hapticsEnabled);
      setAutoStartRestTimer(settings.autoStartRestTimer);
      setSuccessMessage("Restore backup berhasil. Seluruh data lokal sudah diperbarui.");
    } catch (error: unknown) {
      setErrorMessage(error instanceof Error ? error.message : "Restore gagal.");
    } finally {
      setIsBusy(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.centerState}>
        <ActivityIndicator size="large" color={themeTokens.colors.accentPrimary} />
      </View>
    );
  }

  return (
    <>
      <ScrollView
        style={styles.container}
        contentContainerStyle={[
          styles.contentContainer,
          { paddingBottom: insets.bottom + themeTokens.spacing.xxl },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.headerEyebrow}>System Configuration</Text>
          <Text style={styles.headerTitle}>Settings</Text>
        </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Preferences</Text>

        <View style={styles.rowCard}>
          <View style={styles.rowTextWrap}>
            <Text style={styles.rowTitle}>Units</Text>
            <Text style={styles.rowSubtitle}>Weight measurement system</Text>
          </View>
          <View style={styles.chipRow}>
            <Chip
              label="KG"
              selected={preferredUnit === "kg"}
              onPress={() => {
                if (preferredUnit !== "kg") {
                  void onUpdateSettings({ preferredUnit: "kg" });
                }
              }}
            />
            <Chip
              label="LB"
              selected={preferredUnit === "lb"}
              onPress={() => {
                if (preferredUnit !== "lb") {
                  void onUpdateSettings({ preferredUnit: "lb" });
                }
              }}
            />
          </View>
        </View>

        <View style={styles.rowCard}>
          <View style={styles.rowTextWrap}>
            <Text style={styles.rowTitle}>1RM Formula</Text>
            <Text style={styles.rowSubtitle}>Estimated max calculation</Text>
          </View>
          <View style={styles.chipRow}>
            <Chip
              label="BRZYCKI"
              selected={oneRmFormula === "brzycki"}
              onPress={() => {
                if (oneRmFormula !== "brzycki") {
                  void onUpdateSettings({ oneRmFormula: "brzycki" });
                }
              }}
            />
            <Chip
              label="EPLEY"
              selected={oneRmFormula === "epley"}
              onPress={() => {
                if (oneRmFormula !== "epley") {
                  void onUpdateSettings({ oneRmFormula: "epley" });
                }
              }}
            />
          </View>
        </View>

        <ToggleRow
          title="Auto-start rest timer"
          subtitle="Trigger setelah set tersimpan"
          value={autoStartRestTimer}
          onChange={(value) => {
            void onUpdateSettings({ autoStartRestTimer: value });
          }}
        />

      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Data & Backup</Text>
        <ActionButton
          label="Export JSON Backup"
          description="Full backup lokal seluruh data app"
          onPress={() => {
            void onExportJson();
          }}
        />
        <ActionButton
          label="Export CSV"
          description="Set history untuk analisis spreadsheet"
          onPress={() => {
            void onExportCsv();
          }}
        />
        <ActionButton
          label="Import JSON Backup"
          description="Restore akan mengganti seluruh data lokal"
          danger
          onPress={() => {
            void onImportJson();
          }}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.aboutText}>{APP_NAME} local-only MVP</Text>
      </View>

      {isBusy ? <Text style={styles.infoText}>Processing...</Text> : null}
      {successMessage ? <Text style={styles.successText}>{successMessage}</Text> : null}
      {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
      </ScrollView>

      <ConfirmationDialog
        visible={pendingRestore !== null}
        title="Restore Backup JSON?"
        message={
          pendingRestore
            ? `${getBackupWarningText()}\n\nFile: ${pendingRestore.sourceName}`
            : ""
        }
        confirmLabel="Restore"
        onCancel={() => setPendingRestore(null)}
        onConfirm={() => {
          if (pendingRestore) {
            void confirmRestore(pendingRestore.payload);
          }
          setPendingRestore(null);
        }}
      />
    </>
  );
}

type ChipProps = {
  label: string;
  selected: boolean;
  onPress: () => void;
};

function Chip({ label, selected, onPress }: ChipProps) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.chip, selected ? styles.chipSelected : null]}
    >
      <Text style={[styles.chipLabel, selected ? styles.chipLabelSelected : null]}>
        {label}
      </Text>
    </Pressable>
  );
}

type ToggleRowProps = {
  title: string;
  subtitle: string;
  value: boolean;
  onChange: (value: boolean) => void;
};

function ToggleRow({ title, subtitle, value, onChange }: ToggleRowProps) {
  return (
    <View style={styles.rowCard}>
      <View style={styles.rowTextWrap}>
        <Text style={styles.rowTitle}>{title}</Text>
        <Text style={styles.rowSubtitle}>{subtitle}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        thumbColor={value ? themeTokens.colors.backgroundDeep : themeTokens.colors.textSecondary}
        trackColor={{
          false: themeTokens.colors.surfaceHigh,
          true: themeTokens.colors.accentPrimary,
        }}
      />
    </View>
  );
}

type ActionButtonProps = {
  label: string;
  description: string;
  danger?: boolean;
  onPress: () => void;
};

function ActionButton({
  label,
  description,
  danger = false,
  onPress,
}: ActionButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.actionButton,
        danger ? styles.actionButtonDanger : null,
        pressed ? styles.actionButtonPressed : null,
      ]}
    >
      <Text style={[styles.actionTitle, danger ? styles.actionTitleDanger : null]}>
        {label}
      </Text>
      <Text
        style={[
          styles.actionDescription,
          danger ? styles.actionDescriptionDanger : null,
        ]}
      >
        {description}
      </Text>
    </Pressable>
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
  },
  centerState: {
    flex: 1,
    backgroundColor: themeTokens.colors.background,
    alignItems: "center",
    justifyContent: "center",
  },
  header: {
    gap: 2,
  },
  headerEyebrow: {
    color: themeTokens.colors.accentPrimary,
    textTransform: "uppercase",
    letterSpacing: 1.2,
    fontSize: 11,
    fontWeight: "700",
  },
  headerTitle: {
    color: themeTokens.colors.textPrimary,
    fontSize: 34,
    lineHeight: 36,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  section: {
    gap: themeTokens.spacing.sm,
  },
  sectionTitle: {
    color: themeTokens.colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 1,
    fontSize: 11,
    fontWeight: "700",
  },
  rowCard: {
    minHeight: 74,
    backgroundColor: themeTokens.colors.surfaceLow,
    borderRadius: themeTokens.radius.sm,
    paddingHorizontal: themeTokens.spacing.md,
    paddingVertical: themeTokens.spacing.sm,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: themeTokens.spacing.md,
  },
  rowTextWrap: {
    flex: 1,
    gap: 2,
  },
  rowTitle: {
    color: themeTokens.colors.textPrimary,
    fontSize: 16,
    lineHeight: 19,
    fontWeight: "700",
  },
  rowSubtitle: {
    color: themeTokens.colors.textSecondary,
    fontSize: 11,
    lineHeight: 14,
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
  chipRow: {
    flexDirection: "row",
    gap: themeTokens.spacing.xs,
  },
  chip: {
    minHeight: 34,
    minWidth: 62,
    backgroundColor: themeTokens.colors.surfaceHigh,
    borderRadius: themeTokens.radius.sm,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: themeTokens.spacing.sm,
  },
  chipSelected: {
    backgroundColor: themeTokens.colors.accentPrimary,
  },
  chipLabel: {
    color: themeTokens.colors.textPrimary,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.8,
  },
  chipLabelSelected: {
    color: themeTokens.colors.backgroundDeep,
  },
  actionButton: {
    minHeight: 70,
    backgroundColor: themeTokens.colors.surfaceLow,
    borderRadius: themeTokens.radius.sm,
    paddingHorizontal: themeTokens.spacing.md,
    paddingVertical: themeTokens.spacing.sm,
    justifyContent: "center",
    gap: 2,
  },
  actionButtonDanger: {
    backgroundColor: "#3A1111",
  },
  actionButtonPressed: {
    opacity: 0.82,
  },
  actionTitle: {
    color: themeTokens.colors.textPrimary,
    fontSize: 15,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  actionTitleDanger: {
    color: "#FFB4AB",
  },
  actionDescription: {
    color: themeTokens.colors.textSecondary,
    fontSize: 11,
    lineHeight: 14,
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
  actionDescriptionDanger: {
    color: "#FFB4AB",
  },
  aboutText: {
    color: themeTokens.colors.textSecondary,
    textAlign: "center",
    fontSize: 11,
    letterSpacing: 1,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  infoText: {
    color: themeTokens.colors.textSecondary,
    fontSize: 12,
    fontWeight: "700",
  },
  successText: {
    color: themeTokens.colors.accentPrimary,
    fontSize: 12,
    fontWeight: "700",
  },
  errorText: {
    color: themeTokens.colors.danger,
    fontSize: 12,
    fontWeight: "700",
  },
});
