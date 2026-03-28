import {
  addWorkoutExerciseBlock,
  addWorkoutSet,
  deleteWorkoutSet,
  finishWorkout,
  getActiveWorkout,
  getLatestCompletedWorkout,
  getWorkoutDetailById,
  getWorkoutSummaryById,
  startWorkoutFromRoutine,
  updateWorkoutSet,
} from "../../db/repositories";
import { appSettingsService } from "../settings/app-settings-service";
import { getDatabase } from "../../db/sqlite";
import type {
  ActiveWorkoutReference,
  CompletedWorkoutReference,
  StartWorkoutResult,
  WorkoutDetail,
  WorkoutSetInput,
  WorkoutSetUpdateInput,
  WorkoutSummary,
} from "../../types/workout";

class WorkoutService {
  async getActiveWorkout(): Promise<ActiveWorkoutReference | null> {
    const db = await getDatabase();
    return getActiveWorkout(db);
  }

  async getLatestCompletedWorkout(): Promise<CompletedWorkoutReference | null> {
    const db = await getDatabase();
    return getLatestCompletedWorkout(db);
  }

  async startWorkoutFromRoutine(routineId: string): Promise<StartWorkoutResult> {
    const db = await getDatabase();
    return startWorkoutFromRoutine(db, routineId);
  }

  async getWorkoutById(workoutId: string): Promise<WorkoutDetail | null> {
    const db = await getDatabase();
    return getWorkoutDetailById(db, workoutId);
  }

  async addSet(input: WorkoutSetInput): Promise<void> {
    const db = await getDatabase();
    await addWorkoutSet(db, sanitizeSetInput(input));
  }

  async updateSet(input: WorkoutSetUpdateInput): Promise<void> {
    const db = await getDatabase();
    await updateWorkoutSet(db, sanitizeSetUpdateInput(input));
  }

  async deleteSet(workoutSetId: string): Promise<void> {
    const db = await getDatabase();
    await deleteWorkoutSet(db, workoutSetId);
  }

  async addExerciseBlock(workoutId: string, exerciseId: string): Promise<void> {
    const db = await getDatabase();
    await addWorkoutExerciseBlock(db, workoutId, exerciseId);
  }

  async finishWorkout(workoutId: string): Promise<void> {
    const db = await getDatabase();
    await finishWorkout(db, workoutId);
  }

  async getWorkoutSummary(workoutId: string): Promise<WorkoutSummary | null> {
    const db = await getDatabase();
    const settings = await appSettingsService.get();
    return getWorkoutSummaryById(db, workoutId, settings.preferredUnit);
  }
}

export const workoutService = new WorkoutService();

function sanitizeSetInput(input: WorkoutSetInput): WorkoutSetInput {
  return {
    workoutExerciseId: input.workoutExerciseId,
    weight: Math.max(0, input.weight),
    reps: Math.max(0, Math.floor(input.reps)),
    rpe: sanitizeRpe(input.rpe),
    unit: input.unit,
  };
}

function sanitizeSetUpdateInput(input: WorkoutSetUpdateInput): WorkoutSetUpdateInput {
  return {
    workoutSetId: input.workoutSetId,
    weight: Math.max(0, input.weight),
    reps: Math.max(0, Math.floor(input.reps)),
    rpe: sanitizeRpe(input.rpe),
    unit: input.unit,
  };
}

function sanitizeRpe(value?: number | null): number | null {
  if (value === null || value === undefined) {
    return null;
  }

  if (!Number.isFinite(value)) {
    return null;
  }

  const rounded = Math.round(value);
  return rounded >= 1 && rounded <= 10 ? rounded : null;
}
