import {
  archiveRoutine,
  createRoutine,
  getExerciseById,
  getRoutineDetailById,
  listExercisesForPicker,
  listRoutineSummaries,
  updateRoutine,
} from "../../db/repositories";
import { getDatabase } from "../../db/sqlite";
import type { Exercise } from "../../types/exercise";
import type {
  ExerciseFilterResult,
  ExerciseQuery,
  RoutineDetail,
  RoutineSummary,
  RoutineUpsertPayload,
} from "../../types/routine";

class RoutineService {
  async listRoutines(limit?: number): Promise<RoutineSummary[]> {
    const db = await getDatabase();
    return listRoutineSummaries(db, limit ?? 50);
  }

  async getRoutineById(routineId: string): Promise<RoutineDetail | null> {
    const db = await getDatabase();
    return getRoutineDetailById(db, routineId);
  }

  async createRoutine(payload: RoutineUpsertPayload): Promise<string> {
    const db = await getDatabase();
    return createRoutine(db, sanitizePayload(payload));
  }

  async updateRoutine(routineId: string, payload: RoutineUpsertPayload): Promise<void> {
    const db = await getDatabase();
    await updateRoutine(db, routineId, sanitizePayload(payload));
  }

  async archiveRoutine(routineId: string): Promise<void> {
    const db = await getDatabase();
    await archiveRoutine(db, routineId);
  }

  async listExercises(query: ExerciseQuery): Promise<ExerciseFilterResult> {
    const db = await getDatabase();
    return listExercisesForPicker(db, query);
  }

  async getExerciseById(exerciseId: string): Promise<Exercise | null> {
    const db = await getDatabase();
    return getExerciseById(db, exerciseId);
  }
}

export const routineService = new RoutineService();

function sanitizePayload(payload: RoutineUpsertPayload): RoutineUpsertPayload {
  return {
    name: payload.name.trim(),
    description: payload.description.trim(),
    exercises: payload.exercises.map((exercise) => ({
      exerciseId: exercise.exerciseId,
      restTimeSeconds: Math.max(0, Math.floor(exercise.restTimeSeconds)),
    })),
  };
}
