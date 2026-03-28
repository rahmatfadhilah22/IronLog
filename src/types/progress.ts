import type { OneRmFormula, PreferredUnit } from "./settings";

export type ProgressExerciseSummary = {
  exerciseId: string;
  exerciseName: string;
  muscleGroup: string;
  bestOneRm: number;
  bestWeight: number;
  bestVolume: number;
  totalSessions: number;
  lastPerformed: string | null;
};

export type ProgressOverview = {
  preferredUnit: PreferredUnit;
  oneRmFormula: OneRmFormula;
  trackedExerciseCount: number;
  completedWorkoutCount: number;
  totalCompletedSets: number;
  topLifts: ProgressExerciseSummary[];
  exercises: ProgressExerciseSummary[];
};

export type ProgressRange = "30d" | "90d" | "all";

export type ExerciseTrendPoint = {
  workoutId: string;
  performedAt: string;
  topWeight: number;
  sessionVolume: number;
  estimatedOneRm: number;
  setCount: number;
};

export type ExerciseProgressDetail = {
  exerciseId: string;
  exerciseName: string;
  muscleGroup: string;
  equipmentType: string;
  preferredUnit: PreferredUnit;
  oneRmFormula: OneRmFormula;
  bestOneRm: number;
  bestWeight: number;
  bestVolume: number;
  totalSessions: number;
  lastPerformed: string | null;
  trend: ExerciseTrendPoint[];
};
