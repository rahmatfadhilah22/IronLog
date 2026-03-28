import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
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
import { createId } from "../../core/utils";
import { routineService } from "../../services/routines";
import { workoutService } from "../../services/workouts";
import { useExercisePickerStore } from "../../stores";
import type { RoutineExerciseDraft } from "../../types/routine";
import type { ActiveWorkoutReference } from "../../types/workout";

type RoutineEditorScreenProps = {
  mode: "create" | "edit";
  routineId?: string;
};

export function RoutineEditorScreen({
  mode,
  routineId,
}: RoutineEditorScreenProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [exercises, setExercises] = useState<RoutineExerciseDraft[]>([]);
  const [isLoading, setIsLoading] = useState(mode === "edit");
  const [isSaving, setIsSaving] = useState(false);
  const [isStartingWorkout, setIsStartingWorkout] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [pickerRequestKey, setPickerRequestKey] = useState<string | null>(null);
  const [pendingRemoveExercise, setPendingRemoveExercise] =
    useState<RoutineExerciseDraft | null>(null);
  const [activeWorkout, setActiveWorkout] = useState<ActiveWorkoutReference | null>(null);
  const handledPickRef = useRef<string | null>(null);
  const picked = useExercisePickerStore((state) => state.picked);
  const beginRequest = useExercisePickerStore((state) => state.beginRequest);
  const clearPicked = useExercisePickerStore((state) => state.clearPicked);

  const loadRoutine = useCallback(() => {
    if (mode !== "edit" || !routineId) {
      return () => undefined;
    }

    let isActive = true;
    setIsLoading(true);
    setErrorMessage(null);

    routineService
      .getRoutineById(routineId)
      .then((routine) => {
        if (!isActive) {
          return;
        }

        if (!routine || routine.isArchived) {
          setErrorMessage("Routine not found.");
          return;
        }

        setName(routine.name);
        setDescription(routine.description);
        setExercises(routine.exercises);
      })
      .catch((error: unknown) => {
        if (isActive) {
          setErrorMessage(
            error instanceof Error ? error.message : "Failed to load routine.",
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
  }, [mode, routineId]);

  useEffect(loadRoutine, [loadRoutine]);

  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      workoutService
        .getActiveWorkout()
        .then((nextActiveWorkout) => {
          if (isActive) {
            setActiveWorkout(nextActiveWorkout);
          }
        })
        .catch(() => {
          if (isActive) {
            setActiveWorkout(null);
          }
        });

      return () => {
        isActive = false;
      };
    }, []),
  );

  useEffect(() => {
    if (!picked || !pickerRequestKey) {
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
    setErrorMessage(null);

    routineService
      .getExerciseById(picked.exerciseId)
      .then((exercise) => {
        if (!exercise) {
          return;
        }

        setExercises((previous) => {
          if (previous.some((item) => item.exerciseId === exercise.id)) {
            return previous;
          }

          return [
            ...previous,
            {
              localId: createId(),
              exerciseId: exercise.id,
              name: exercise.name,
              muscleGroup: exercise.muscleGroup,
              equipmentType: exercise.equipmentType,
              restTimeSeconds: 90,
            },
          ];
        });
      })
      .catch((error: unknown) => {
        setErrorMessage(
          error instanceof Error ? error.message : "Failed to add exercise.",
        );
      });
  }, [clearPicked, picked, pickerRequestKey]);

  const canSave = useMemo(() => {
    return name.trim().length > 0 && exercises.length > 0 && !isSaving;
  }, [exercises.length, isSaving, name]);

  const startWorkoutLabel = useMemo(() => {
    if (mode !== "edit") {
      return "Start Workout";
    }

    if (!activeWorkout) {
      return "Start Workout";
    }

    if (activeWorkout.routineId && activeWorkout.routineId === routineId) {
      return "Continue Workout";
    }

    return "Open Active Workout";
  }, [activeWorkout, mode, routineId]);

  const onOpenExercisePicker = () => {
    const requestKey = createId();
    const excludeIds = exercises.map((exercise) => exercise.exerciseId).join(",");
    setPickerRequestKey(requestKey);
    beginRequest(requestKey);

    router.push(
      {
        pathname: "/modal/exercise-picker",
        params: {
          requestKey,
          excludeIds,
        },
      } as never,
    );
  };

  const onRemoveExercise = (localId: string) => {
    setExercises((previous) =>
      previous.filter((exercise) => exercise.localId !== localId),
    );
  };

  const onConfirmRemoveExercise = (exercise: RoutineExerciseDraft) => {
    setPendingRemoveExercise(exercise);
  };

  const onMoveExercise = (index: number, direction: -1 | 1) => {
    setExercises((previous) => {
      const targetIndex = index + direction;
      if (targetIndex < 0 || targetIndex >= previous.length) {
        return previous;
      }

      const next = [...previous];
      const [current] = next.splice(index, 1);
      next.splice(targetIndex, 0, current);
      return next;
    });
  };

  const onUpdateRestTime = (localId: string, rawValue: string) => {
    const numericValue = Number.parseInt(rawValue.replace(/[^\d]/g, ""), 10);
    const sanitized = Number.isNaN(numericValue) ? 0 : Math.max(0, numericValue);

    setExercises((previous) =>
      previous.map((exercise) =>
        exercise.localId === localId
          ? { ...exercise, restTimeSeconds: sanitized }
          : exercise,
      ),
    );
  };

  const onSave = async () => {
    setErrorMessage(null);
    setSuccessMessage(null);

    const trimmedName = name.trim();
    if (!trimmedName) {
      setErrorMessage("Routine name is required.");
      return;
    }

    if (exercises.length === 0) {
      setErrorMessage("Add at least 1 exercise before saving.");
      return;
    }

    setIsSaving(true);

    const payload = {
      name: trimmedName,
      description: description.trim(),
      exercises: exercises.map((exercise) => ({
        exerciseId: exercise.exerciseId,
        restTimeSeconds: Math.max(0, Math.floor(exercise.restTimeSeconds)),
      })),
    };

    try {
      if (mode === "create") {
        const createdRoutineId = await routineService.createRoutine(payload);
        router.replace(`/routines/${createdRoutineId}` as never);
        return;
      }

      if (!routineId) {
        throw new Error("Routine ID is missing.");
      }

      await routineService.updateRoutine(routineId, payload);
      setSuccessMessage("Routine saved.");
    } catch (error: unknown) {
      setErrorMessage(error instanceof Error ? error.message : "Failed to save routine.");
    } finally {
      setIsSaving(false);
    }
  };

  const onStartWorkout = async () => {
    if (mode !== "edit" || !routineId) {
      return;
    }

    if (activeWorkout) {
      router.push(`/workout/${activeWorkout.id}` as never);
      return;
    }

    setErrorMessage(null);
    setSuccessMessage(null);
    setIsStartingWorkout(true);

    try {
      const result = await workoutService.startWorkoutFromRoutine(routineId);
      if (result.reusedActiveWorkout) {
        setSuccessMessage("An active workout was found. Reopening the current session.");
      }
      router.push(`/workout/${result.workoutId}` as never);
    } catch (error: unknown) {
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to start workout.",
      );
    } finally {
      setIsStartingWorkout(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.centerState}>
        <ActivityIndicator size="large" color={themeTokens.colors.accentPrimary} />
        <Text style={styles.stateText}>Loading routine...</Text>
      </View>
    );
  }

  return (
    <>
      <ScrollView
        style={styles.container}
        contentContainerStyle={[
          styles.contentContainer,
          { paddingBottom: insets.bottom + themeTokens.spacing.xxl + themeTokens.spacing.lg },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.section}>
          <Text style={styles.sectionEyebrow}>
            {mode === "create" ? "NEW ROUTINE" : "EDIT ROUTINE"}
          </Text>
          <Text style={styles.sectionTitle}>
            {mode === "create" ? "Create Routine" : "Routine Detail"}
          </Text>
          {mode === "edit" ? (
          <PrimaryButton
            label={isStartingWorkout ? "Opening Workout..." : startWorkoutLabel}
            onPress={() => {
              void onStartWorkout();
            }}
            disabled={isStartingWorkout || isSaving}
            style={styles.startWorkoutButton}
          />
          ) : null}
        </View>

        <View style={styles.section}>
          <Text style={styles.fieldLabel}>NAME</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Example: Push Day A"
            placeholderTextColor={themeTokens.colors.textSecondary}
            style={styles.nameInput}
            autoCapitalize="words"
            autoCorrect={false}
            spellCheck={false}
            autoComplete="off"
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.fieldLabel}>DESCRIPTION</Text>
          <TextInput
            value={description}
            onChangeText={setDescription}
            placeholder="Optional"
            placeholderTextColor={themeTokens.colors.textSecondary}
            style={styles.descriptionInput}
            multiline
            numberOfLines={3}
          />
        </View>

        <View style={styles.section}>
          <View style={styles.exerciseHeader}>
            <Text style={styles.sectionTitle}>Exercise Sequence</Text>
            <Text style={styles.exerciseCount}>{exercises.length} EXERCISES</Text>
          </View>
          <View style={styles.exerciseList}>
            {exercises.map((exercise, index) => (
              <View key={exercise.localId} style={styles.exerciseCard}>
                <View style={styles.exerciseTopRow}>
                  <View style={styles.exerciseTitleWrap}>
                    <View style={styles.orderBadge}>
                      <Text style={styles.orderBadgeLabel}>{index + 1}</Text>
                    </View>
                    <Text style={styles.exerciseName}>{exercise.name}</Text>
                  </View>
                  <Pressable
                    onPress={() => {
                      onConfirmRemoveExercise(exercise);
                    }}
                    style={({ pressed }) => [
                      styles.removeButton,
                      pressed ? styles.removeButtonPressed : null,
                    ]}
                    hitSlop={8}
                  >
                    <Text style={styles.removeLabel}>REMOVE</Text>
                  </Pressable>
                </View>
                <Text style={styles.exerciseMeta}>
                  {exercise.muscleGroup.toUpperCase()} •{" "}
                  {exercise.equipmentType.toUpperCase()}
                </Text>
                <View style={styles.exerciseControls}>
                  <View style={styles.controlBlock}>
                    <Text style={styles.controlLabel}>ORDER</Text>
                    <View style={styles.reorderControls}>
                      <Pressable
                        style={[
                          styles.secondaryControl,
                          index === 0 ? styles.secondaryControlDisabled : null,
                        ]}
                        onPress={() => {
                          onMoveExercise(index, -1);
                        }}
                        disabled={index === 0}
                      >
                        <Text
                          style={[
                            styles.secondaryControlLabel,
                            index === 0 ? styles.secondaryControlLabelDisabled : null,
                          ]}
                        >
                          UP
                        </Text>
                      </Pressable>
                      <Pressable
                        style={[
                          styles.secondaryControl,
                          index === exercises.length - 1
                            ? styles.secondaryControlDisabled
                            : null,
                        ]}
                        onPress={() => {
                          onMoveExercise(index, 1);
                        }}
                        disabled={index === exercises.length - 1}
                      >
                        <Text
                          style={[
                            styles.secondaryControlLabel,
                            index === exercises.length - 1
                              ? styles.secondaryControlLabelDisabled
                              : null,
                          ]}
                        >
                          DOWN
                        </Text>
                      </Pressable>
                    </View>
                  </View>
                  <View style={styles.controlBlock}>
                    <Text style={styles.controlLabel}>REST (SEC)</Text>
                    <View style={styles.restInputGroup}>
                      <TextInput
                        value={String(exercise.restTimeSeconds)}
                        onChangeText={(value) => {
                          onUpdateRestTime(exercise.localId, value);
                        }}
                        keyboardType="number-pad"
                        style={styles.restInput}
                      />
                    </View>
                  </View>
                </View>
              </View>
            ))}
          </View>
          <Pressable style={styles.addExerciseButton} onPress={onOpenExercisePicker}>
            <Text style={styles.addExerciseLabel}>Add Exercise</Text>
          </Pressable>
        </View>

        {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
        {successMessage ? <Text style={styles.successText}>{successMessage}</Text> : null}

        <PrimaryButton
          label={isSaving ? "Saving..." : "Save Routine"}
          onPress={onSave}
          disabled={!canSave}
          style={styles.saveButton}
        />
      </ScrollView>

      <ConfirmationDialog
        visible={pendingRemoveExercise !== null}
        title="Remove Exercise?"
        message={
          pendingRemoveExercise
            ? `${pendingRemoveExercise.name} will be removed from this routine.`
            : ""
        }
        confirmLabel="Remove"
        onCancel={() => setPendingRemoveExercise(null)}
        onConfirm={() => {
          if (pendingRemoveExercise) {
            onRemoveExercise(pendingRemoveExercise.localId);
          }
          setPendingRemoveExercise(null);
        }}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: themeTokens.colors.background,
  },
  contentContainer: {
    padding: themeTokens.spacing.lg,
    paddingBottom: themeTokens.spacing.xxl,
    gap: themeTokens.spacing.lg,
  },
  centerState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: themeTokens.spacing.md,
    backgroundColor: themeTokens.colors.background,
  },
  stateText: {
    color: themeTokens.colors.textSecondary,
    fontSize: 14,
  },
  section: {
    gap: themeTokens.spacing.sm,
  },
  sectionEyebrow: {
    color: themeTokens.colors.accentPrimary,
    fontWeight: "700",
    letterSpacing: 1.2,
    fontSize: 11,
  },
  sectionTitle: {
    color: themeTokens.colors.textPrimary,
    fontSize: 26,
    lineHeight: 30,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  fieldLabel: {
    color: themeTokens.colors.textSecondary,
    fontWeight: "700",
    fontSize: 11,
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  nameInput: {
    backgroundColor: themeTokens.colors.surfaceLow,
    color: themeTokens.colors.textPrimary,
    borderRadius: themeTokens.radius.sm,
    paddingHorizontal: themeTokens.spacing.lg,
    paddingVertical: themeTokens.spacing.md,
    fontSize: 22,
    fontWeight: "700",
  },
  descriptionInput: {
    backgroundColor: themeTokens.colors.surfaceLow,
    color: themeTokens.colors.textPrimary,
    borderRadius: themeTokens.radius.sm,
    paddingHorizontal: themeTokens.spacing.lg,
    paddingVertical: themeTokens.spacing.md,
    fontSize: 14,
    lineHeight: 20,
    minHeight: 88,
    textAlignVertical: "top",
  },
  exerciseHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: themeTokens.spacing.md,
  },
  exerciseCount: {
    color: themeTokens.colors.accentPrimary,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1,
  },
  exerciseList: {
    gap: themeTokens.spacing.sm,
  },
  exerciseCard: {
    backgroundColor: themeTokens.colors.surfaceLow,
    borderRadius: themeTokens.radius.sm,
    padding: themeTokens.spacing.md,
    gap: themeTokens.spacing.sm,
  },
  exerciseTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: themeTokens.spacing.sm,
  },
  exerciseTitleWrap: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: themeTokens.spacing.sm,
  },
  orderBadge: {
    minWidth: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: themeTokens.colors.accentPrimary,
  },
  orderBadgeLabel: {
    color: themeTokens.colors.backgroundDeep,
    fontSize: 12,
    fontWeight: "900",
  },
  exerciseName: {
    flex: 1,
    color: themeTokens.colors.textPrimary,
    fontSize: 17,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  removeLabel: {
    color: "#FF8D7E",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.8,
  },
  removeButton: {
    minHeight: 28,
    borderRadius: themeTokens.radius.sm,
    paddingHorizontal: themeTokens.spacing.sm,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(230, 88, 74, 0.14)",
    borderWidth: 1,
    borderColor: "rgba(255, 141, 126, 0.32)",
  },
  removeButtonPressed: {
    opacity: 0.82,
  },
  exerciseMeta: {
    color: themeTokens.colors.textSecondary,
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 0.8,
  },
  exerciseControls: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    gap: themeTokens.spacing.md,
  },
  controlBlock: {
    flex: 1,
    gap: themeTokens.spacing.xs,
  },
  controlLabel: {
    color: themeTokens.colors.textSecondary,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.9,
    textTransform: "uppercase",
  },
  reorderControls: {
    flexDirection: "row",
    gap: themeTokens.spacing.xs,
  },
  secondaryControl: {
    minHeight: 36,
    minWidth: 60,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: themeTokens.colors.surfaceHighest,
    borderRadius: themeTokens.radius.sm,
    paddingHorizontal: themeTokens.spacing.sm,
  },
  secondaryControlDisabled: {
    opacity: 0.4,
  },
  secondaryControlLabel: {
    color: themeTokens.colors.textPrimary,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.8,
  },
  secondaryControlLabelDisabled: {
    color: themeTokens.colors.textSecondary,
  },
  restInputGroup: {
    minHeight: 36,
    justifyContent: "center",
  },
  restInput: {
    minWidth: 88,
    backgroundColor: themeTokens.colors.surfaceHighest,
    color: themeTokens.colors.textPrimary,
    borderRadius: themeTokens.radius.sm,
    textAlign: "center",
    paddingHorizontal: themeTokens.spacing.sm,
    paddingVertical: themeTokens.spacing.xs,
    fontSize: 15,
    fontWeight: "700",
  },
  addExerciseButton: {
    minHeight: 52,
    borderRadius: themeTokens.radius.sm,
    backgroundColor: themeTokens.colors.surfaceHigh,
    alignItems: "center",
    justifyContent: "center",
    marginTop: themeTokens.spacing.xs,
  },
  addExerciseLabel: {
    color: themeTokens.colors.accentPrimary,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 1,
    fontSize: 12,
  },
  errorText: {
    color: themeTokens.colors.danger,
    fontSize: 13,
    fontWeight: "600",
  },
  successText: {
    color: themeTokens.colors.accentPrimary,
    fontSize: 13,
    fontWeight: "700",
  },
  saveButton: {
    marginTop: themeTokens.spacing.sm,
  },
  startWorkoutButton: {
    marginTop: themeTokens.spacing.sm,
    minHeight: 56,
  },
});
