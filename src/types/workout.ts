import type { PreferredUnit } from "./settings";

export type WorkoutStatus = "active" | "completed" | "cancelled";
export type WorkoutSourceType = "routine" | "custom";

export type WorkoutSet = {
  id: string;
  workoutExerciseId: string;
  setNumber: number;
  weight: number;
  reps: number;
  rpe: number | null;
  unit: PreferredUnit;
  isCompleted: boolean;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type WorkoutExerciseDetail = {
  id: string;
  workoutId: string;
  routineExerciseId: string | null;
  exerciseId: string;
  displayName: string;
  sortOrder: number;
  restTimeSeconds: number;
  equipmentType?: string;
  muscleGroup?: string;
  sets: WorkoutSet[];
  totalVolume: number;
};

export type WorkoutDetail = {
  id: string;
  routineId: string | null;
  sourceType: WorkoutSourceType;
  status: WorkoutStatus;
  routineName: string | null;
  title: string;
  startedAt: string;
  finishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  exercises: WorkoutExerciseDetail[];
};

export type ActiveWorkoutReference = {
  id: string;
  routineId: string | null;
  title: string;
  startedAt: string;
};

export type CompletedWorkoutReference = {
  id: string;
  title: string;
  finishedAt: string;
};

export type StartWorkoutResult = {
  workoutId: string;
  reusedActiveWorkout: boolean;
};

export type WorkoutSetInput = {
  workoutExerciseId: string;
  weight: number;
  reps: number;
  rpe?: number | null;
  unit: PreferredUnit;
};

export type WorkoutSetUpdateInput = {
  workoutSetId: string;
  weight: number;
  reps: number;
  rpe?: number | null;
  unit: PreferredUnit;
};

export type TopSetSummary = {
  exerciseId: string;
  exerciseName: string;
  weight: number;
  reps: number;
  rpe: number | null;
  unit: PreferredUnit;
};

export type WorkoutSummary = {
  workoutId: string;
  title: string;
  startedAt: string;
  finishedAt: string | null;
  durationSeconds: number;
  totalSets: number;
  totalVolume: number;
  totalVolumeUnit: PreferredUnit;
  topSet: TopSetSummary | null;
};
