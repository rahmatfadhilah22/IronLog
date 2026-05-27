import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
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

import { themeTokens } from "../../src/core/theme";
import { routineService } from "../../src/services/routines";
import { useExercisePickerStore } from "../../src/stores";
import type { Exercise } from "../../src/types/exercise";

const CUSTOM_MUSCLE_GROUP_OPTIONS = [
  "Arms",
  "Back",
  "Chest",
  "Core",
  "Legs",
  "Shoulders",
];

const CUSTOM_EQUIPMENT_TYPE_OPTIONS = [
  "Barbell",
  "Bodyweight",
  "Cable",
  "Dumbbell",
  "EZ Bar",
  "Machine",
];

export default function ExercisePickerScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{
    requestKey?: string | string[];
    excludeIds?: string | string[];
    selectionMode?: string | string[];
  }>();

  const requestKey = asFirstString(params.requestKey);
  const excludeIdsParam = asFirstString(params.excludeIds) ?? "";
  const selectionMode =
    asFirstString(params.selectionMode) === "multiple" ? "multiple" : "single";
  const pickExercise = useExercisePickerStore((state) => state.pickExercise);
  const submitExercises = useExercisePickerStore((state) => state.submitExercises);

  const [search, setSearch] = useState("");
  const [selectedMuscleGroup, setSelectedMuscleGroup] = useState<string>("ALL");
  const [isLoading, setIsLoading] = useState(true);
  const [isCreatingCustom, setIsCreatingCustom] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [muscleGroups, setMuscleGroups] = useState<string[]>([]);
  const [equipmentTypes, setEquipmentTypes] = useState<string[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [customName, setCustomName] = useState("");
  const [customMuscleGroup, setCustomMuscleGroup] = useState("");
  const [customEquipmentType, setCustomEquipmentType] = useState("");
  const [selectedExerciseIds, setSelectedExerciseIds] = useState<string[]>([]);

  const excludeIds = useMemo(() => {
    if (!excludeIdsParam.trim()) {
      return [];
    }

    return excludeIdsParam
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }, [excludeIdsParam]);

  const muscleGroupOptions = useMemo(() => {
    return Array.from(new Set([...CUSTOM_MUSCLE_GROUP_OPTIONS, ...muscleGroups]));
  }, [muscleGroups]);
  const equipmentTypeOptions = useMemo(() => {
    return Array.from(new Set([...CUSTOM_EQUIPMENT_TYPE_OPTIONS, ...equipmentTypes]));
  }, [equipmentTypes]);

  useEffect(() => {
    let isActive = true;
    setIsLoading(true);
    setError(null);

    routineService
      .listExercises({
        search: search.trim() || undefined,
        muscleGroup:
          selectedMuscleGroup === "ALL" ? undefined : selectedMuscleGroup,
        excludeIds,
        limit: 120,
      })
      .then((result) => {
        if (!isActive) {
          return;
        }
        setExercises(result.exercises);
        setMuscleGroups(result.muscleGroups);
        setEquipmentTypes(result.equipmentTypes);
      })
      .catch((requestError: unknown) => {
        if (isActive) {
          setError(
            requestError instanceof Error
              ? requestError.message
              : "Failed to load exercises.",
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
  }, [excludeIds, search, selectedMuscleGroup]);

  useEffect(() => {
    if (!showCreateForm) {
      return;
    }

    if (!customName.trim() && search.trim()) {
      setCustomName(search.trim());
    }

    if (!customMuscleGroup.trim()) {
      if (selectedMuscleGroup !== "ALL") {
        setCustomMuscleGroup(selectedMuscleGroup);
      } else if (muscleGroupOptions[0]) {
        setCustomMuscleGroup(muscleGroupOptions[0]);
      }
    }

    if (!customEquipmentType.trim() && equipmentTypeOptions[0]) {
      setCustomEquipmentType(equipmentTypeOptions[0]);
    }
  }, [
    customEquipmentType,
    customMuscleGroup,
    customName,
    equipmentTypeOptions,
    muscleGroupOptions,
    search,
    selectedMuscleGroup,
    showCreateForm,
  ]);

  const onSelectExercise = (exerciseId: string) => {
    if (!requestKey) {
      router.back();
      return;
    }

    if (selectionMode === "multiple") {
      setSelectedExerciseIds((current) =>
        current.includes(exerciseId)
          ? current.filter((item) => item !== exerciseId)
          : [...current, exerciseId],
      );
      return;
    }

    if (requestKey) {
      pickExercise(requestKey, exerciseId);
    }

    router.back();
  };

  const onSubmitSelectedExercises = () => {
    if (!requestKey || selectedExerciseIds.length === 0) {
      return;
    }

    submitExercises(requestKey, selectedExerciseIds);
    router.back();
  };

  const onToggleCreateForm = () => {
    setShowCreateForm((current) => !current);
    setError(null);
  };

  const onCreateCustomExercise = async () => {
    const nextName = collapseWhitespace(customName);
    const nextMuscleGroup = collapseWhitespace(customMuscleGroup);
    const nextEquipmentType = collapseWhitespace(customEquipmentType);

    if (!nextName) {
      setError("Exercise name is required.");
      return;
    }

    if (!nextMuscleGroup) {
      setError("Select a muscle group.");
      return;
    }

    if (!nextEquipmentType) {
      setError("Select an equipment type.");
      return;
    }

    setIsCreatingCustom(true);
    setError(null);

    try {
      const created = await routineService.createCustomExercise({
        name: nextName,
        muscleGroup: nextMuscleGroup,
        equipmentType: nextEquipmentType,
      });

      if (requestKey) {
        if (selectionMode === "multiple") {
          submitExercises(requestKey, [created.id]);
        } else {
          pickExercise(requestKey, created.id);
        }
      }

      router.back();
    } catch (requestError: unknown) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Failed to create a custom exercise.",
      );
    } finally {
      setIsCreatingCustom(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.keyboardWrap}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View
        style={[
          styles.container,
          {
            paddingTop: insets.top + themeTokens.spacing.xl,
            paddingBottom: insets.bottom + themeTokens.spacing.lg,
          },
        ]}
      >
        <View style={styles.topRow}>
          <Text style={styles.title}>Select Exercise</Text>
          <Pressable onPress={() => router.back()} style={styles.closeButton}>
            <Text style={styles.closeLabel}>CLOSE</Text>
          </Pressable>
        </View>

        <View style={styles.actionRow}>
          <Pressable
            onPress={onToggleCreateForm}
            style={[
              styles.actionButton,
              showCreateForm ? styles.actionButtonActive : null,
            ]}
          >
            <Text
              style={[
                styles.actionButtonLabel,
                showCreateForm ? styles.actionButtonLabelActive : null,
              ]}
            >
              {showCreateForm ? "HIDE CUSTOM FORM" : "CREATE CUSTOM EXERCISE"}
            </Text>
          </Pressable>
        </View>

        {selectionMode === "multiple" && !showCreateForm ? (
          <View style={styles.selectionSummary}>
            <Text style={styles.selectionSummaryText}>
              {selectedExerciseIds.length === 0
                ? "Tap exercises to select them for this routine."
                : `${selectedExerciseIds.length} selected`}
            </Text>
            <Pressable
              onPress={onSubmitSelectedExercises}
              disabled={selectedExerciseIds.length === 0}
              style={[
                styles.selectionSubmitButton,
                selectedExerciseIds.length === 0 ? styles.selectionSubmitButtonDisabled : null,
              ]}
            >
              <Text
                style={[
                  styles.selectionSubmitLabel,
                  selectedExerciseIds.length === 0 ? styles.selectionSubmitLabelDisabled : null,
                ]}
              >
                {selectedExerciseIds.length === 0
                  ? "Select Exercises"
                  : `Add ${selectedExerciseIds.length} Exercise${selectedExerciseIds.length > 1 ? "s" : ""}`}
              </Text>
            </Pressable>
          </View>
        ) : null}

        {error ? (
          <View style={styles.inlineMessage}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {showCreateForm ? (
          <View style={styles.createCard}>
            <Text style={styles.createTitle}>Custom Exercise</Text>
            <Text style={styles.createSubtitle}>
              Create a new exercise and add it straight into your routine or workout.
            </Text>

            <TextInput
              value={customName}
              onChangeText={setCustomName}
              placeholder="Exercise name"
              placeholderTextColor={themeTokens.colors.textSecondary}
              style={styles.textInput}
            />

            <Text style={styles.fieldLabel}>Muscle Group</Text>
            {muscleGroupOptions.length > 0 ? (
              <View style={styles.quickPickWrap}>
                {muscleGroupOptions.map((muscleGroup) => (
                  <QuickPickChip
                    key={muscleGroup}
                    label={muscleGroup}
                    selected={customMuscleGroup === muscleGroup}
                    onPress={() => setCustomMuscleGroup(muscleGroup)}
                  />
                ))}
              </View>
            ) : null}

            <Text style={styles.fieldLabel}>Equipment Type</Text>
            {equipmentTypeOptions.length > 0 ? (
              <View style={styles.quickPickWrap}>
                {equipmentTypeOptions.map((equipmentType) => (
                  <QuickPickChip
                    key={equipmentType}
                    label={equipmentType}
                    selected={customEquipmentType === equipmentType}
                    onPress={() => setCustomEquipmentType(equipmentType)}
                  />
                ))}
              </View>
            ) : null}

            <Pressable
              onPress={() => {
                void onCreateCustomExercise();
              }}
              disabled={isCreatingCustom}
              style={({ pressed }) => [
                styles.createButton,
                isCreatingCustom ? styles.createButtonDisabled : null,
                pressed && !isCreatingCustom ? styles.createButtonPressed : null,
              ]}
            >
              <Text style={styles.createButtonLabel}>
                {isCreatingCustom ? "CREATING..." : "SAVE AND ADD"}
              </Text>
            </Pressable>
          </View>
        ) : (
          <>
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Search exercise..."
              placeholderTextColor={themeTokens.colors.textSecondary}
              style={styles.searchInput}
            />

            <ScrollView
              horizontal
              style={styles.filterScroll}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filterRow}
              overScrollMode="never"
            >
              <FilterChip
                label="ALL"
                selected={selectedMuscleGroup === "ALL"}
                onPress={() => setSelectedMuscleGroup("ALL")}
              />
              {muscleGroups.map((muscleGroup) => (
                <FilterChip
                  key={muscleGroup}
                  label={muscleGroup.toUpperCase()}
                  selected={selectedMuscleGroup === muscleGroup}
                  onPress={() => setSelectedMuscleGroup(muscleGroup)}
                />
              ))}
            </ScrollView>

            {isLoading ? (
              <View style={styles.centerState}>
                <ActivityIndicator size="large" color={themeTokens.colors.accentPrimary} />
              </View>
            ) : exercises.length === 0 ? (
              <View style={styles.centerState}>
                <Text style={styles.emptyTitle}>No Exercise Found</Text>
                <Text style={styles.emptyText}>
                  Try a different keyword, switch the filter, or create a custom exercise.
                </Text>
              </View>
            ) : (
              <ScrollView
                style={styles.resultsScroll}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                overScrollMode="never"
              >
                {exercises.map((exercise) => (
                  <Pressable
                    key={exercise.id}
                    onPress={() => {
                      onSelectExercise(exercise.id);
                    }}
                    style={({ pressed }) => [
                      styles.exerciseRow,
                      selectedExerciseIds.includes(exercise.id)
                        ? styles.exerciseRowSelected
                        : null,
                      pressed ? styles.exerciseRowPressed : null,
                    ]}
                  >
                    <View style={styles.exerciseInfo}>
                      <View style={styles.exerciseHeader}>
                        <Text style={styles.exerciseName}>{exercise.name}</Text>
                        {exercise.isCustom ? (
                          <View style={styles.customBadge}>
                            <Text style={styles.customBadgeLabel}>CUSTOM</Text>
                          </View>
                        ) : null}
                      </View>
                      <Text style={styles.exerciseMeta}>
                        {exercise.muscleGroup.toUpperCase()} •{" "}
                        {exercise.equipmentType.toUpperCase()}
                      </Text>
                    </View>
                    <Text style={styles.pickLabel}>
                      {selectionMode === "multiple"
                        ? selectedExerciseIds.includes(exercise.id)
                          ? "SELECTED"
                          : "SELECT"
                        : "ADD"}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
            )}
          </>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

type FilterChipProps = {
  label: string;
  selected: boolean;
  onPress: () => void;
};

function FilterChip({ label, selected, onPress }: FilterChipProps) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.filterChip, selected ? styles.filterChipSelected : null]}
    >
      <Text
        style={[
          styles.filterChipLabel,
          selected ? styles.filterChipLabelSelected : null,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

type QuickPickChipProps = {
  label: string;
  selected: boolean;
  onPress: () => void;
};

function QuickPickChip({ label, selected, onPress }: QuickPickChipProps) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.quickPickChip, selected ? styles.quickPickChipSelected : null]}
    >
      <Text
        style={[
          styles.quickPickChipLabel,
          selected ? styles.quickPickChipLabelSelected : null,
        ]}
      >
        {label.toUpperCase()}
      </Text>
    </Pressable>
  );
}

function asFirstString(value?: string | string[]): string | undefined {
  if (!value) {
    return undefined;
  }

  return Array.isArray(value) ? value[0] : value;
}

function collapseWhitespace(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}

const styles = StyleSheet.create({
  keyboardWrap: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: themeTokens.colors.background,
    padding: themeTokens.spacing.lg,
    gap: themeTokens.spacing.md,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: themeTokens.spacing.md,
    marginBottom: themeTokens.spacing.sm,
  },
  title: {
    color: themeTokens.colors.textPrimary,
    fontSize: 26,
    lineHeight: 30,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  closeButton: {
    backgroundColor: themeTokens.colors.surfaceHighest,
    borderRadius: themeTokens.radius.sm,
    paddingHorizontal: themeTokens.spacing.md,
    paddingVertical: themeTokens.spacing.xs,
    alignSelf: "center",
  },
  closeLabel: {
    color: themeTokens.colors.textPrimary,
    fontWeight: "700",
    fontSize: 11,
    letterSpacing: 0.8,
  },
  searchInput: {
    backgroundColor: themeTokens.colors.surfaceLow,
    borderRadius: themeTokens.radius.sm,
    paddingHorizontal: themeTokens.spacing.lg,
    paddingVertical: themeTokens.spacing.md,
    color: themeTokens.colors.textPrimary,
    fontSize: 15,
  },
  actionRow: {
    flexDirection: "row",
  },
  selectionSummary: {
    backgroundColor: themeTokens.colors.surfaceLow,
    borderRadius: themeTokens.radius.sm,
    padding: themeTokens.spacing.md,
    gap: themeTokens.spacing.sm,
  },
  selectionSummaryText: {
    color: themeTokens.colors.textSecondary,
    fontSize: 13,
    fontWeight: "600",
  },
  selectionSubmitButton: {
    minHeight: 48,
    borderRadius: themeTokens.radius.sm,
    backgroundColor: themeTokens.colors.accentPrimary,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: themeTokens.spacing.md,
  },
  selectionSubmitButtonDisabled: {
    backgroundColor: themeTokens.colors.surfaceHighest,
  },
  selectionSubmitLabel: {
    color: themeTokens.colors.backgroundDeep,
    fontSize: 13,
    fontWeight: "900",
    letterSpacing: 0.7,
    textTransform: "uppercase",
  },
  selectionSubmitLabelDisabled: {
    color: themeTokens.colors.textSecondary,
  },
  actionButton: {
    backgroundColor: themeTokens.colors.surfaceHighest,
    borderRadius: themeTokens.radius.sm,
    paddingHorizontal: themeTokens.spacing.md,
    paddingVertical: themeTokens.spacing.sm,
  },
  actionButtonActive: {
    backgroundColor: themeTokens.colors.accentPrimary,
  },
  actionButtonLabel: {
    color: themeTokens.colors.textPrimary,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.8,
  },
  actionButtonLabelActive: {
    color: themeTokens.colors.backgroundDeep,
  },
  createCard: {
    backgroundColor: themeTokens.colors.surfaceLow,
    borderRadius: themeTokens.radius.md,
    padding: themeTokens.spacing.md,
    gap: themeTokens.spacing.sm,
    borderWidth: 1,
    borderColor: themeTokens.colors.surfaceHigh,
  },
  createTitle: {
    color: themeTokens.colors.textPrimary,
    fontSize: 16,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  createSubtitle: {
    color: themeTokens.colors.textSecondary,
    fontSize: 13,
    lineHeight: 18,
  },
  fieldLabel: {
    color: themeTokens.colors.textSecondary,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.8,
    marginTop: themeTokens.spacing.xs,
    textTransform: "uppercase",
  },
  textInput: {
    backgroundColor: themeTokens.colors.background,
    borderRadius: themeTokens.radius.sm,
    paddingHorizontal: themeTokens.spacing.md,
    paddingVertical: themeTokens.spacing.sm,
    color: themeTokens.colors.textPrimary,
    fontSize: 14,
  },
  quickPickWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: themeTokens.spacing.xs,
  },
  quickPickChip: {
    backgroundColor: themeTokens.colors.surfaceHighest,
    borderRadius: themeTokens.radius.sm,
    paddingHorizontal: themeTokens.spacing.sm,
    paddingVertical: 7,
  },
  quickPickChipSelected: {
    backgroundColor: themeTokens.colors.accentPrimary,
  },
  quickPickChipLabel: {
    color: themeTokens.colors.textPrimary,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  quickPickChipLabelSelected: {
    color: themeTokens.colors.backgroundDeep,
  },
  createButton: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: themeTokens.colors.accentPrimary,
    borderRadius: themeTokens.radius.sm,
    paddingHorizontal: themeTokens.spacing.md,
    paddingVertical: themeTokens.spacing.md,
    marginTop: themeTokens.spacing.xs,
  },
  createButtonPressed: {
    opacity: 0.84,
  },
  createButtonDisabled: {
    opacity: 0.6,
  },
  createButtonLabel: {
    color: themeTokens.colors.backgroundDeep,
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 0.8,
  },
  filterScroll: {
    flexGrow: 0,
    maxHeight: 40,
  },
  filterRow: {
    gap: themeTokens.spacing.xs,
    alignItems: "center",
    paddingVertical: 2,
    paddingRight: themeTokens.spacing.lg,
  },
  filterChip: {
    alignSelf: "flex-start",
    height: 32,
    minWidth: 58,
    borderRadius: themeTokens.radius.sm,
    backgroundColor: themeTokens.colors.surfaceHigh,
    paddingHorizontal: themeTokens.spacing.sm,
    paddingVertical: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  filterChipSelected: {
    backgroundColor: themeTokens.colors.accentPrimary,
  },
  filterChipLabel: {
    color: themeTokens.colors.textPrimary,
    fontSize: 10,
    lineHeight: 10,
    fontWeight: "700",
    letterSpacing: 0.2,
    textAlign: "center",
  },
  filterChipLabelSelected: {
    color: themeTokens.colors.backgroundDeep,
  },
  inlineMessage: {
    backgroundColor: themeTokens.colors.surfaceLow,
    borderRadius: themeTokens.radius.sm,
    paddingHorizontal: themeTokens.spacing.md,
    paddingVertical: themeTokens.spacing.sm,
  },
  centerState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: themeTokens.spacing.sm,
  },
  resultsScroll: {
    flex: 1,
    backgroundColor: themeTokens.colors.background,
  },
  errorText: {
    color: themeTokens.colors.danger,
    fontWeight: "700",
  },
  emptyTitle: {
    color: themeTokens.colors.textPrimary,
    fontSize: 18,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  emptyText: {
    color: themeTokens.colors.textSecondary,
    textAlign: "center",
  },
  listContent: {
    gap: themeTokens.spacing.xs,
    paddingBottom: themeTokens.spacing.xxl + themeTokens.spacing.md,
  },
  exerciseRow: {
    backgroundColor: themeTokens.colors.surfaceLow,
    borderRadius: themeTokens.radius.sm,
    paddingHorizontal: themeTokens.spacing.md,
    paddingVertical: themeTokens.spacing.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: themeTokens.spacing.md,
  },
  exerciseRowSelected: {
    backgroundColor: themeTokens.colors.surfaceHigh,
    borderWidth: 1,
    borderColor: themeTokens.colors.accentPrimary,
  },
  exerciseRowPressed: {
    backgroundColor: themeTokens.colors.surfaceHigh,
  },
  exerciseInfo: {
    flex: 1,
    gap: 4,
  },
  exerciseHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: themeTokens.spacing.xs,
  },
  exerciseName: {
    color: themeTokens.colors.textPrimary,
    fontSize: 16,
    fontWeight: "700",
    flexShrink: 1,
  },
  customBadge: {
    backgroundColor: themeTokens.colors.surfaceHighest,
    borderRadius: themeTokens.radius.sm,
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  customBadgeLabel: {
    color: themeTokens.colors.accentPrimary,
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 0.6,
  },
  exerciseMeta: {
    color: themeTokens.colors.textSecondary,
    fontSize: 11,
    letterSpacing: 0.8,
    fontWeight: "600",
  },
  pickLabel: {
    color: themeTokens.colors.accentPrimary,
    fontWeight: "800",
    letterSpacing: 1,
    fontSize: 11,
  },
});
