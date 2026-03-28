import type { Exercise } from "./exercise";

export type RoutineExerciseDraft = {
  localId: string;
  exerciseId: string;
  name: string;
  muscleGroup: string;
  equipmentType: string;
  restTimeSeconds: number;
};

export type RoutineSummary = {
  id: string;
  name: string;
  description: string;
  exerciseCount: number;
  updatedAt: string;
};

export type RoutineDetail = {
  id: string;
  name: string;
  description: string;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
  exercises: RoutineExerciseDraft[];
};

export type RoutineUpsertPayload = {
  name: string;
  description: string;
  exercises: Array<{
    exerciseId: string;
    restTimeSeconds: number;
  }>;
};

export type ExerciseQuery = {
  search?: string;
  muscleGroup?: string;
  excludeIds?: string[];
  limit?: number;
};

export type ExerciseFilterResult = {
  exercises: Exercise[];
  muscleGroups: string[];
};
