import { useRouter } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
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

import { ConfirmationDialog, PrimaryButton } from "../../components";
import { themeTokens } from "../../core/theme";
import { convertWeight, createId } from "../../core/utils";
import { appSettingsService } from "../../services/settings";
import { workoutService } from "../../services/workouts";
import { useExercisePickerStore } from "../../stores";
import type { PreferredUnit } from "../../types/settings";
import type { WorkoutDetail, WorkoutSet } from "../../types/workout";

type ActiveWorkoutScreenProps = {
  workoutId: string;
};

export function ActiveWorkoutScreen({ workoutId }: ActiveWorkoutScreenProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [workout, setWorkout] = useState<WorkoutDetail | null>(null);
  const [selectedExerciseId, setSelectedExerciseId] = useState<string | null>(null);
  const [preferredUnit, setPreferredUnit] = useState<PreferredUnit>("kg");
  const [autoStartRestTimer, setAutoStartRestTimer] = useState(true);
  const [draftWeight, setDraftWeight] = useState("");
  const [draftReps, setDraftReps] = useState("");
  const [draftRpe, setDraftRpe] = useState("");
  const [draftUnit, setDraftUnit] = useState<PreferredUnit>("kg");
  const [editingSetId, setEditingSetId] = useState<string | null>(null);
  const [pickerRequestKey, setPickerRequestKey] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMutating, setIsMutating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [nowTimestamp, setNowTimestamp] = useState(Date.now());
  const [pendingDeleteSet, setPendingDeleteSet] = useState<WorkoutSet | null>(null);
  const [isFinishDialogVisible, setIsFinishDialogVisible] = useState(false);
  const handledPickRef = useRef<string | null>(null);

  const picked = useExercisePickerStore((state) => state.picked);
  const beginRequest = useExercisePickerStore((state) => state.beginRequest);
  const clearPicked = useExercisePickerStore((state) => state.clearPicked);

  const refreshWorkout = async (silent = false): Promise<void> => {
    if (!silent) {
      setIsLoading(true);
    }

    try {
      const nextWorkout = await workoutService.getWorkoutById(workoutId);
      if (!nextWorkout) {
        setWorkout(null);
        setErrorMessage("Workout not found.");
        return;
      }

      if (nextWorkout.status !== "active") {
        router.replace({ pathname: "/workout/summary", params: { workoutId } } as never);
        return;
      }

      setWorkout(nextWorkout);
      setErrorMessage(null);
      setSelectedExerciseId((current) => {
        if (current && nextWorkout.exercises.some((exercise) => exercise.id === current)) {
          return current;
        }

        return nextWorkout.exercises[0]?.id ?? null;
      });
    } catch (error: unknown) {
      setErrorMessage(error instanceof Error ? error.message : "Failed to load workout.");
    } finally {
      if (!silent) {
        setIsLoading(false);
      }
    }
  };

  useEffect(() => {
    let isActive = true;

    const initialize = async () => {
      try {
        const settings = await appSettingsService.get();
        if (!isActive) {
          return;
        }

        setPreferredUnit(settings.preferredUnit);
        setAutoStartRestTimer(settings.autoStartRestTimer);
        setDraftUnit(settings.preferredUnit);
      } catch (error) {
        if (isActive) {
          console.warn("[workout] failed to read app settings", error);
        }
      }
    };

    void initialize();

    return () => {
      isActive = false;
    };
  }, []);

  useEffect(() => {
    void refreshWorkout(false);
  }, [workoutId]);

  useEffect(() => {
    const intervalId = setInterval(() => {
      setNowTimestamp(Date.now());
    }, 1000);

    return () => {
      clearInterval(intervalId);
    };
  }, []);

  useEffect(() => {
    if (!picked || !pickerRequestKey || !workout) {
      return;
    }

    if (picked.requestKey !== pickerRequestKey) {
      return;
    }

    if (handledPickRef.current === picked.pickedAt) {
      return;
    }

    handledPickRef.current = picked.pickedAt;
    clearPicked();
    setFeedbackMessage(null);
    setErrorMessage(null);
    setIsMutating(true);

    workoutService
      .addExerciseBlock(workout.id, picked.exerciseIds[0] ?? "")
      .then(async () => {
        await refreshWorkout(true);
        setFeedbackMessage("Exercise block added.");
      })
      .catch((error: unknown) => {
        setErrorMessage(error instanceof Error ? error.message : "Failed to add exercise.");
      })
      .finally(() => {
        setIsMutating(false);
      });
  }, [clearPicked, pickerRequestKey, picked, workout]);

  const selectedExercise = useMemo(() => {
    if (!workout) {
      return null;
    }

    return (
      workout.exercises.find((exercise) => exercise.id === selectedExerciseId) ??
      workout.exercises[0] ??
      null
    );
  }, [selectedExerciseId, workout]);

  useEffect(() => {
    if (!selectedExercise || editingSetId) {
      return;
    }

    const lastSet = selectedExercise.sets[selectedExercise.sets.length - 1];
    if (lastSet) {
      applySetToDraft(lastSet, setDraftWeight, setDraftReps, setDraftRpe, setDraftUnit);
      return;
    }

    setDraftWeight("");
    setDraftReps("");
    setDraftRpe("");
    setDraftUnit(preferredUnit);
  }, [editingSetId, preferredUnit, selectedExercise?.id]);

  const elapsedLabel = useMemo(() => {
    if (!workout) {
      return "00:00";
    }

    const elapsedSeconds = Math.max(
      0,
      Math.floor((nowTimestamp - Date.parse(workout.startedAt)) / 1000),
    );
    return formatDuration(elapsedSeconds);
  }, [nowTimestamp, workout]);

  const nextSetNumber = (selectedExercise?.sets.length ?? 0) + 1;

  const onOpenExercisePicker = () => {
    const requestKey = createId();
    setPickerRequestKey(requestKey);
    beginRequest(requestKey);
    router.push({
      pathname: "/modal/exercise-picker",
      params: { requestKey, selectionMode: "single" },
    } as never);
  };

  const onCopyPreviousSet = () => {
    if (!selectedExercise) {
      return;
    }

    const lastSet = selectedExercise.sets[selectedExercise.sets.length - 1];
    if (!lastSet) {
      return;
    }

    setEditingSetId(null);
    applySetToDraft(lastSet, setDraftWeight, setDraftReps, setDraftRpe, setDraftUnit);
  };

  const onSaveSet = async () => {
    if (!selectedExercise) {
      return;
    }

    const parsedWeight = Number.parseFloat(draftWeight.replace(",", "."));
    const parsedReps = Number.parseInt(draftReps, 10);
    const rawRpe = draftRpe.trim()
      ? Number.parseInt(draftRpe.trim(), 10)
      : undefined;
    const parsedRpe = Number.isInteger(rawRpe) ? rawRpe : undefined;

    if (!Number.isFinite(parsedWeight) || parsedWeight < 0) {
      setErrorMessage("Weight must be a number greater than or equal to 0.");
      return;
    }

    if (!Number.isInteger(parsedReps) || parsedReps < 0) {
      setErrorMessage("Reps must be a whole number greater than or equal to 0.");
      return;
    }

    if (
      draftRpe.trim() &&
      (parsedRpe === undefined || parsedRpe < 1 || parsedRpe > 10)
    ) {
      setErrorMessage("RPE is optional, but if provided it must be between 1 and 10.");
      return;
    }

    setIsMutating(true);
    setErrorMessage(null);
    setFeedbackMessage(null);

    try {
      if (editingSetId) {
        await workoutService.updateSet({
          workoutSetId: editingSetId,
          weight: parsedWeight,
          reps: parsedReps,
          rpe: parsedRpe,
          unit: draftUnit,
        });
        setEditingSetId(null);
        setFeedbackMessage("Set updated.");
      } else {
        await workoutService.addSet({
          workoutExerciseId: selectedExercise.id,
          weight: parsedWeight,
          reps: parsedReps,
          rpe: parsedRpe,
          unit: draftUnit,
        });
        setFeedbackMessage("Set saved.");

        if (autoStartRestTimer && selectedExercise.restTimeSeconds > 0) {
          const endsAt = Date.now() + selectedExercise.restTimeSeconds * 1000;
          router.push(
            {
              pathname: "/modal/rest-timer",
              params: {
                seconds: String(selectedExercise.restTimeSeconds),
                endsAt: String(endsAt),
                exerciseName: selectedExercise.displayName,
              },
            } as never,
          );
        }
      }

      await refreshWorkout(true);
    } catch (error: unknown) {
      setErrorMessage(error instanceof Error ? error.message : "Failed to save set.");
    } finally {
      setIsMutating(false);
    }
  };

  const onEditSet = (workoutSet: WorkoutSet) => {
    setEditingSetId(workoutSet.id);
    applySetToDraft(workoutSet, setDraftWeight, setDraftReps, setDraftRpe, setDraftUnit);
    setErrorMessage(null);
    setFeedbackMessage(null);
  };

  const onDeleteSet = async (workoutSetId: string) => {
    setIsMutating(true);
    setErrorMessage(null);
    setFeedbackMessage(null);

    try {
      await workoutService.deleteSet(workoutSetId);
      if (editingSetId === workoutSetId) {
        setEditingSetId(null);
      }
      await refreshWorkout(true);
      setFeedbackMessage("Set deleted.");
    } catch (error: unknown) {
      setErrorMessage(error instanceof Error ? error.message : "Failed to delete set.");
    } finally {
      setIsMutating(false);
    }
  };

  const onConfirmDeleteSet = (workoutSet: WorkoutSet) => {
    setPendingDeleteSet(workoutSet);
  };

  const onFinishWorkoutConfirmed = async () => {
    setIsMutating(true);
    setErrorMessage(null);

    try {
      await workoutService.finishWorkout(workoutId);
      router.replace({ pathname: "/workout/summary", params: { workoutId } } as never);
    } catch (error: unknown) {
      setErrorMessage(error instanceof Error ? error.message : "Failed to finish workout.");
      setIsMutating(false);
    }
  };

  const onFinishWorkout = () => {
    setIsFinishDialogVisible(true);
  };

  if (isLoading) {
    return (
      <View style={styles.centerState}>
        <ActivityIndicator size="large" color={themeTokens.colors.accentPrimary} />
        <Text style={styles.stateText}>Loading workout...</Text>
      </View>
    );
  }

  if (!workout || !selectedExercise) {
    return (
      <View style={styles.centerState}>
        <Text style={styles.errorText}>{errorMessage ?? "Workout unavailable."}</Text>
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
    <>
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
        <View style={styles.headerRow}>
          <View style={styles.headerInfo}>
            <Text style={styles.eyebrow}>Current Session</Text>
            <Text style={styles.workoutTitle}>{workout.title}</Text>
            <Text style={styles.elapsedLabel}>Elapsed {elapsedLabel}</Text>
          </View>
          <Pressable
            style={({ pressed }) => [styles.finishButton, pressed ? styles.finishPressed : null]}
            onPress={onFinishWorkout}
            disabled={isMutating}
          >
            <Text style={styles.finishLabel}>Finish</Text>
          </Pressable>
        </View>

        {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
        {feedbackMessage ? <Text style={styles.feedbackText}>{feedbackMessage}</Text> : null}

        <View style={styles.selectorSection}>
          <Text style={styles.sectionLabel}>Exercise Queue</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.exerciseSelectorRow}
          >
            {workout.exercises.map((exercise, index) => {
              const isSelected = selectedExercise.id === exercise.id;
              return (
                <Pressable
                  key={exercise.id}
                  onPress={() => setSelectedExerciseId(exercise.id)}
                  style={[
                    styles.exerciseSelectorCard,
                    isSelected ? styles.exerciseSelectorSelected : null,
                  ]}
                >
                  <Text
                    style={[
                      styles.exerciseSelectorIndex,
                      isSelected ? styles.exerciseSelectorIndexSelected : null,
                    ]}
                  >
                    {String(index + 1).padStart(2, "0")}
                  </Text>
                  <Text
                    style={[
                      styles.exerciseSelectorName,
                      isSelected ? styles.exerciseSelectorNameSelected : null,
                    ]}
                    numberOfLines={2}
                  >
                    {exercise.displayName}
                  </Text>
                  <Text
                    style={[
                      styles.exerciseSelectorMeta,
                      isSelected ? styles.exerciseSelectorMetaSelected : null,
                    ]}
                  >
                    {exercise.sets.length} SETS
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        <View style={styles.currentExerciseSection}>
          <Text style={styles.sectionLabel}>
            Exercise{" "}
            {workout.exercises.findIndex((exercise) => exercise.id === selectedExercise.id) + 1}/
            {workout.exercises.length}
          </Text>
          <Text style={styles.currentExerciseName}>{selectedExercise.displayName}</Text>
          <View style={styles.exerciseMetricsRow}>
            <MetricPill
              label="REST"
              value={`${selectedExercise.restTimeSeconds}s`}
              highlighted
            />
            <MetricPill
              label="SETS"
              value={String(selectedExercise.sets.length)}
            />
            <MetricPill
              label="VOLUME"
              value={formatVolume(selectedExercise.sets, preferredUnit)}
            />
          </View>
        </View>

        <View style={styles.loggerSection}>
          <View style={styles.loggerHeaderRow}>
            <Text style={styles.loggerTitle}>
              {editingSetId ? "Edit Set" : `Active Set ${nextSetNumber}`}
            </Text>
            <Pressable
              onPress={onCopyPreviousSet}
              disabled={selectedExercise.sets.length === 0}
              style={({ pressed }) => [
                styles.copyButton,
                selectedExercise.sets.length === 0 ? styles.copyButtonDisabled : null,
                pressed && selectedExercise.sets.length > 0 ? styles.copyButtonPressed : null,
              ]}
            >
              <Text style={styles.copyLabel}>Copy Previous</Text>
            </Pressable>
          </View>

          <View style={styles.loggerGrid}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Weight</Text>
              <TextInput
                value={draftWeight}
                onChangeText={setDraftWeight}
                keyboardType="decimal-pad"
                style={styles.numberInput}
                placeholder="0"
                placeholderTextColor={themeTokens.colors.textSecondary}
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Reps</Text>
              <TextInput
                value={draftReps}
                onChangeText={setDraftReps}
                keyboardType="number-pad"
                style={styles.numberInput}
                placeholder="0"
                placeholderTextColor={themeTokens.colors.textSecondary}
              />
            </View>
          </View>

          <View style={styles.subControlRow}>
            <View style={styles.subInputGroup}>
              <Text style={styles.inputLabel}>RPE (Optional)</Text>
              <TextInput
                value={draftRpe}
                onChangeText={setDraftRpe}
                keyboardType="number-pad"
                style={styles.smallInput}
                placeholder="-"
                placeholderTextColor={themeTokens.colors.textSecondary}
              />
            </View>
            <View style={styles.subInputGroup}>
              <Text style={styles.inputLabel}>Unit</Text>
              <View style={styles.unitRow}>
                <Pressable
                  onPress={() => setDraftUnit("kg")}
                  style={[
                    styles.unitChip,
                    draftUnit === "kg" ? styles.unitChipSelected : null,
                  ]}
                >
                  <Text
                    style={[
                      styles.unitChipLabel,
                      draftUnit === "kg" ? styles.unitChipLabelSelected : null,
                    ]}
                  >
                    KG
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => setDraftUnit("lb")}
                  style={[
                    styles.unitChip,
                    draftUnit === "lb" ? styles.unitChipSelected : null,
                  ]}
                >
                  <Text
                    style={[
                      styles.unitChipLabel,
                      draftUnit === "lb" ? styles.unitChipLabelSelected : null,
                    ]}
                  >
                    LB
                  </Text>
                </Pressable>
              </View>
            </View>
          </View>

          <PrimaryButton
            label={editingSetId ? "Update Set" : "Complete Set"}
            onPress={() => {
              void onSaveSet();
            }}
            disabled={isMutating}
            style={styles.completeSetButton}
          />

          {editingSetId ? (
            <Pressable
              style={styles.cancelEditButton}
              onPress={() => {
                setEditingSetId(null);
              }}
            >
              <Text style={styles.cancelEditLabel}>Cancel Edit</Text>
            </Pressable>
          ) : null}
        </View>

        <View style={styles.loggedSection}>
          <Text style={styles.sectionLabel}>Logged Sets</Text>
          {selectedExercise.sets.length === 0 ? (
            <Text style={styles.mutedText}>No sets logged for this exercise yet.</Text>
          ) : (
            <View style={styles.setList}>
              {selectedExercise.sets.map((setItem) => (
                <View key={setItem.id} style={styles.setRow}>
                  <View style={styles.setInfo}>
                    <Text style={styles.setTitle}>SET {setItem.setNumber}</Text>
                    <Text style={styles.setData}>
                      {formatWeight(setItem.weight)} {setItem.unit.toUpperCase()} ×{" "}
                      {setItem.reps} REPS
                      {setItem.rpe ? ` • RPE ${setItem.rpe}` : ""}
                    </Text>
                  </View>
                  <View style={styles.setActions}>
                    <Pressable
                      onPress={() => onEditSet(setItem)}
                      style={styles.rowActionButton}
                    >
                      <Text style={styles.rowActionLabel}>EDIT</Text>
                    </Pressable>
                    <Pressable
                      onPress={() => {
                        onConfirmDeleteSet(setItem);
                      }}
                      style={styles.rowDangerButton}
                    >
                      <Text style={styles.rowDangerLabel}>DELETE</Text>
                    </Pressable>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>

          <Pressable
            onPress={onOpenExercisePicker}
            style={({ pressed }) => [
              styles.addExerciseButton,
              pressed ? styles.addExercisePressed : null,
            ]}
          >
            <Text style={styles.addExerciseLabel}>Add Exercise Block</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>

      <ConfirmationDialog
        visible={pendingDeleteSet !== null}
        title="Delete Set?"
        message={
          pendingDeleteSet
            ? `Set ${pendingDeleteSet.setNumber} will be removed from ${selectedExercise?.displayName ?? "this exercise"}.`
            : ""
        }
        confirmLabel="Delete"
        onCancel={() => setPendingDeleteSet(null)}
        onConfirm={() => {
          if (pendingDeleteSet) {
            void onDeleteSet(pendingDeleteSet.id);
          }
          setPendingDeleteSet(null);
        }}
      />

      <ConfirmationDialog
        visible={isFinishDialogVisible}
        title="Finish Workout?"
        message="This workout will be marked as completed."
        confirmLabel="Finish"
        tone="accent"
        onCancel={() => setIsFinishDialogVisible(false)}
        onConfirm={() => {
          setIsFinishDialogVisible(false);
          void onFinishWorkoutConfirmed();
        }}
      />
    </>
  );
}

type MetricPillProps = {
  label: string;
  value: string;
  highlighted?: boolean;
};

function MetricPill({ label, value, highlighted = false }: MetricPillProps) {
  return (
    <View style={[styles.metricPill, highlighted ? styles.metricPillHighlighted : null]}>
      <Text
        style={[
          styles.metricPillLabel,
          highlighted ? styles.metricPillLabelHighlighted : null,
        ]}
      >
        {label}
      </Text>
      <Text
        style={[
          styles.metricPillValue,
          highlighted ? styles.metricPillValueHighlighted : null,
        ]}
      >
        {value}
      </Text>
    </View>
  );
}

function applySetToDraft(
  workoutSet: WorkoutSet,
  setWeight: (value: string) => void,
  setReps: (value: string) => void,
  setRpe: (value: string) => void,
  setUnit: (value: PreferredUnit) => void,
): void {
  setWeight(formatWeight(workoutSet.weight));
  setReps(String(workoutSet.reps));
  setRpe(workoutSet.rpe ? String(workoutSet.rpe) : "");
  setUnit(workoutSet.unit);
}

function formatWeight(value: number): string {
  if (Number.isInteger(value)) {
    return String(value);
  }

  return value.toFixed(1);
}

function formatVolume(sets: WorkoutSet[], preferredUnit: PreferredUnit): string {
  const totalVolume = sets.reduce((sum, currentSet) => {
    const convertedWeight = convertWeight(
      currentSet.weight,
      currentSet.unit,
      preferredUnit,
    );
    return sum + convertedWeight * currentSet.reps;
  }, 0);

  const rounded = Math.round(totalVolume);
  return `${rounded.toLocaleString()} ${preferredUnit.toUpperCase()}`;
}

function formatDuration(totalSeconds: number): string {
  const safeSeconds = Math.max(0, totalSeconds);
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const seconds = safeSeconds % 60;

  if (hours > 0) {
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(
      seconds,
    ).padStart(2, "0")}`;
  }

  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
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
  centerState: {
    flex: 1,
    backgroundColor: themeTokens.colors.background,
    alignItems: "center",
    justifyContent: "center",
    gap: themeTokens.spacing.sm,
    paddingHorizontal: themeTokens.spacing.xl,
  },
  stateText: {
    color: themeTokens.colors.textSecondary,
    fontSize: 14,
    fontWeight: "600",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: themeTokens.spacing.md,
    backgroundColor: themeTokens.colors.surfaceLow,
    padding: themeTokens.spacing.lg,
    borderRadius: themeTokens.radius.sm,
  },
  headerInfo: {
    flex: 1,
    gap: 4,
  },
  eyebrow: {
    color: themeTokens.colors.accentPrimary,
    textTransform: "uppercase",
    letterSpacing: 1.2,
    fontSize: 11,
    fontWeight: "700",
  },
  workoutTitle: {
    color: themeTokens.colors.textPrimary,
    fontSize: 28,
    lineHeight: 31,
    textTransform: "uppercase",
    fontWeight: "800",
  },
  elapsedLabel: {
    color: themeTokens.colors.textSecondary,
    fontSize: 12,
    letterSpacing: 0.7,
    textTransform: "uppercase",
    fontWeight: "700",
  },
  finishButton: {
    minHeight: 44,
    minWidth: 90,
    backgroundColor: themeTokens.colors.accentPrimary,
    borderRadius: themeTokens.radius.sm,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: themeTokens.spacing.md,
    paddingVertical: themeTokens.spacing.sm,
  },
  finishPressed: {
    opacity: 0.82,
  },
  finishLabel: {
    color: themeTokens.colors.backgroundDeep,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    fontSize: 12,
  },
  selectorSection: {
    gap: themeTokens.spacing.sm,
  },
  sectionLabel: {
    color: themeTokens.colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 1,
    fontWeight: "700",
    fontSize: 11,
  },
  exerciseSelectorRow: {
    gap: themeTokens.spacing.sm,
    paddingRight: themeTokens.spacing.lg,
  },
  exerciseSelectorCard: {
    width: 140,
    minHeight: 92,
    padding: themeTokens.spacing.sm,
    borderRadius: themeTokens.radius.sm,
    backgroundColor: themeTokens.colors.surfaceLow,
    gap: themeTokens.spacing.xs,
  },
  exerciseSelectorSelected: {
    backgroundColor: themeTokens.colors.surfaceHighest,
  },
  exerciseSelectorIndex: {
    color: themeTokens.colors.textSecondary,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.9,
  },
  exerciseSelectorIndexSelected: {
    color: themeTokens.colors.accentPrimary,
  },
  exerciseSelectorName: {
    color: themeTokens.colors.textPrimary,
    fontSize: 14,
    lineHeight: 18,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  exerciseSelectorNameSelected: {
    color: themeTokens.colors.accentPrimary,
  },
  exerciseSelectorMeta: {
    color: themeTokens.colors.textSecondary,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.8,
  },
  exerciseSelectorMetaSelected: {
    color: themeTokens.colors.textPrimary,
  },
  currentExerciseSection: {
    backgroundColor: themeTokens.colors.surfaceLow,
    borderRadius: themeTokens.radius.sm,
    padding: themeTokens.spacing.lg,
    gap: themeTokens.spacing.sm,
  },
  currentExerciseName: {
    color: themeTokens.colors.textPrimary,
    fontSize: 24,
    lineHeight: 28,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  exerciseMetricsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: themeTokens.spacing.sm,
  },
  metricPill: {
    minWidth: 90,
    backgroundColor: themeTokens.colors.surfaceHigh,
    borderRadius: themeTokens.radius.sm,
    paddingVertical: themeTokens.spacing.xs,
    paddingHorizontal: themeTokens.spacing.sm,
    gap: 2,
  },
  metricPillHighlighted: {
    backgroundColor: themeTokens.colors.surfaceHighest,
  },
  metricPillLabel: {
    color: themeTokens.colors.textSecondary,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.8,
  },
  metricPillLabelHighlighted: {
    color: themeTokens.colors.accentPrimary,
  },
  metricPillValue: {
    color: themeTokens.colors.textPrimary,
    fontSize: 14,
    fontWeight: "700",
  },
  metricPillValueHighlighted: {
    color: themeTokens.colors.textPrimary,
  },
  loggerSection: {
    backgroundColor: themeTokens.colors.surfaceHighest,
    borderRadius: themeTokens.radius.sm,
    padding: themeTokens.spacing.lg,
    gap: themeTokens.spacing.md,
  },
  loggerHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: themeTokens.spacing.sm,
  },
  loggerTitle: {
    color: themeTokens.colors.accentPrimary,
    textTransform: "uppercase",
    fontSize: 15,
    fontWeight: "800",
    letterSpacing: 0.7,
  },
  copyButton: {
    backgroundColor: themeTokens.colors.surfaceLow,
    borderRadius: themeTokens.radius.sm,
    minHeight: 34,
    paddingHorizontal: themeTokens.spacing.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  copyButtonDisabled: {
    opacity: 0.45,
  },
  copyButtonPressed: {
    opacity: 0.85,
  },
  copyLabel: {
    color: themeTokens.colors.textPrimary,
    fontWeight: "700",
    textTransform: "uppercase",
    fontSize: 10,
    letterSpacing: 0.8,
  },
  loggerGrid: {
    flexDirection: "row",
    gap: themeTokens.spacing.sm,
  },
  inputGroup: {
    flex: 1,
    gap: 6,
  },
  inputLabel: {
    color: themeTokens.colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.9,
    fontSize: 10,
    fontWeight: "700",
  },
  numberInput: {
    minHeight: 72,
    backgroundColor: themeTokens.colors.surfaceLow,
    borderRadius: themeTokens.radius.sm,
    color: themeTokens.colors.textPrimary,
    fontSize: 36,
    lineHeight: 38,
    fontWeight: "800",
    textAlign: "center",
    paddingHorizontal: themeTokens.spacing.sm,
  },
  subControlRow: {
    flexDirection: "row",
    gap: themeTokens.spacing.md,
  },
  subInputGroup: {
    flex: 1,
    gap: 6,
  },
  smallInput: {
    minHeight: 46,
    backgroundColor: themeTokens.colors.surfaceLow,
    borderRadius: themeTokens.radius.sm,
    color: themeTokens.colors.textPrimary,
    fontSize: 22,
    lineHeight: 25,
    fontWeight: "700",
    textAlign: "center",
    paddingHorizontal: themeTokens.spacing.sm,
  },
  unitRow: {
    flexDirection: "row",
    gap: themeTokens.spacing.xs,
  },
  unitChip: {
    flex: 1,
    minHeight: 46,
    borderRadius: themeTokens.radius.sm,
    backgroundColor: themeTokens.colors.surfaceLow,
    alignItems: "center",
    justifyContent: "center",
  },
  unitChipSelected: {
    backgroundColor: themeTokens.colors.accentPrimary,
  },
  unitChipLabel: {
    color: themeTokens.colors.textPrimary,
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.7,
  },
  unitChipLabelSelected: {
    color: themeTokens.colors.backgroundDeep,
  },
  completeSetButton: {
    minHeight: 64,
  },
  cancelEditButton: {
    minHeight: 42,
    borderRadius: themeTokens.radius.sm,
    backgroundColor: themeTokens.colors.surfaceLow,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelEditLabel: {
    color: themeTokens.colors.textPrimary,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    fontSize: 11,
    fontWeight: "700",
  },
  loggedSection: {
    gap: themeTokens.spacing.sm,
  },
  setList: {
    gap: themeTokens.spacing.xs,
  },
  setRow: {
    backgroundColor: themeTokens.colors.surfaceLow,
    borderRadius: themeTokens.radius.sm,
    paddingHorizontal: themeTokens.spacing.md,
    paddingVertical: themeTokens.spacing.sm,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: themeTokens.spacing.md,
  },
  setInfo: {
    flex: 1,
    gap: 2,
  },
  setTitle: {
    color: themeTokens.colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    fontSize: 10,
    fontWeight: "700",
  },
  setData: {
    color: themeTokens.colors.textPrimary,
    fontSize: 14,
    lineHeight: 18,
    fontWeight: "700",
  },
  setActions: {
    flexDirection: "row",
    gap: themeTokens.spacing.xs,
  },
  rowActionButton: {
    minHeight: 34,
    minWidth: 56,
    borderRadius: themeTokens.radius.sm,
    backgroundColor: themeTokens.colors.surfaceHigh,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: themeTokens.spacing.xs,
  },
  rowActionLabel: {
    color: themeTokens.colors.textPrimary,
    textTransform: "uppercase",
    letterSpacing: 0.7,
    fontSize: 10,
    fontWeight: "700",
  },
  rowDangerButton: {
    minHeight: 34,
    minWidth: 64,
    borderRadius: themeTokens.radius.sm,
    backgroundColor: themeTokens.colors.surfaceHigh,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: themeTokens.spacing.xs,
  },
  rowDangerLabel: {
    color: themeTokens.colors.danger,
    textTransform: "uppercase",
    letterSpacing: 0.7,
    fontSize: 10,
    fontWeight: "700",
  },
  addExerciseButton: {
    minHeight: 56,
    borderRadius: themeTokens.radius.sm,
    backgroundColor: themeTokens.colors.surfaceLow,
    alignItems: "center",
    justifyContent: "center",
    marginTop: themeTokens.spacing.xs,
  },
  addExercisePressed: {
    backgroundColor: themeTokens.colors.surfaceHigh,
  },
  addExerciseLabel: {
    color: themeTokens.colors.accentPrimary,
    textTransform: "uppercase",
    letterSpacing: 1,
    fontSize: 12,
    fontWeight: "800",
  },
  errorText: {
    color: themeTokens.colors.danger,
    fontSize: 13,
    fontWeight: "700",
  },
  feedbackText: {
    color: themeTokens.colors.accentPrimary,
    fontSize: 13,
    fontWeight: "700",
  },
  mutedText: {
    color: themeTokens.colors.textSecondary,
    fontSize: 13,
    lineHeight: 18,
  },
});
