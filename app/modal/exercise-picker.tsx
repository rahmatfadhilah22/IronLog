import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
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

import { themeTokens } from "../../src/core/theme";
import { routineService } from "../../src/services/routines";
import { useExercisePickerStore } from "../../src/stores";
import type { Exercise } from "../../src/types/exercise";

export default function ExercisePickerScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{
    requestKey?: string | string[];
    excludeIds?: string | string[];
  }>();

  const requestKey = asFirstString(params.requestKey);
  const excludeIdsParam = asFirstString(params.excludeIds) ?? "";
  const pickExercise = useExercisePickerStore((state) => state.pickExercise);

  const [search, setSearch] = useState("");
  const [selectedMuscleGroup, setSelectedMuscleGroup] = useState<string>("ALL");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [muscleGroups, setMuscleGroups] = useState<string[]>([]);

  const excludeIds = useMemo(() => {
    if (!excludeIdsParam.trim()) {
      return [];
    }

    return excludeIdsParam
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }, [excludeIdsParam]);

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
      })
      .catch((requestError: unknown) => {
        if (isActive) {
          setError(
            requestError instanceof Error
              ? requestError.message
              : "Gagal memuat daftar exercise.",
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

  const onSelectExercise = (exerciseId: string) => {
    if (requestKey) {
      pickExercise(requestKey, exerciseId);
    }

    router.back();
  };

  return (
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
      ) : error ? (
        <View style={styles.centerState}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : exercises.length === 0 ? (
        <View style={styles.centerState}>
          <Text style={styles.emptyTitle}>No Exercise Found</Text>
          <Text style={styles.emptyText}>Coba ubah kata kunci atau filter.</Text>
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
                pressed ? styles.exerciseRowPressed : null,
              ]}
            >
              <View style={styles.exerciseInfo}>
                <Text style={styles.exerciseName}>{exercise.name}</Text>
                <Text style={styles.exerciseMeta}>
                  {exercise.muscleGroup.toUpperCase()} •{" "}
                  {exercise.equipmentType.toUpperCase()}
                </Text>
              </View>
              <Text style={styles.pickLabel}>ADD</Text>
            </Pressable>
          ))}
        </ScrollView>
      )}
    </View>
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

function asFirstString(value?: string | string[]): string | undefined {
  if (!value) {
    return undefined;
  }

  return Array.isArray(value) ? value[0] : value;
}

const styles = StyleSheet.create({
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
  exerciseRowPressed: {
    backgroundColor: themeTokens.colors.surfaceHigh,
  },
  exerciseInfo: {
    flex: 1,
    gap: 4,
  },
  exerciseName: {
    color: themeTokens.colors.textPrimary,
    fontSize: 16,
    fontWeight: "700",
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
