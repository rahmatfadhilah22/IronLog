import type { SQLiteDatabase } from "expo-sqlite";

import { createId, nowIsoTimestamp } from "../../core/utils";
import type { CreateCustomExercisePayload, Exercise } from "../../types/exercise";
import type {
  ExerciseFilterResult,
  ExerciseQuery,
  RoutineDetail,
  RoutineSummary,
  RoutineUpsertPayload,
} from "../../types/routine";

type RoutineSummaryRow = {
  id: string;
  name: string;
  description: string;
  updated_at: string;
  exercise_count: number;
};

type RoutineRow = {
  id: string;
  name: string;
  description: string;
  is_archived: 0 | 1;
  created_at: string;
  updated_at: string;
};

type RoutineExerciseRow = {
  routine_exercise_id: string;
  exercise_id: string;
  name: string;
  muscle_group: string;
  equipment_type: string;
  rest_time_seconds: number;
  sort_order: number;
};

type ExerciseRow = {
  id: string;
  name: string;
  muscle_group: string;
  equipment_type: string;
  is_favorite: 0 | 1;
  is_custom: 0 | 1;
};

type MuscleGroupRow = {
  muscle_group: string;
};

type EquipmentTypeRow = {
  equipment_type: string;
};

export async function listRoutineSummaries(
  db: SQLiteDatabase,
  limit = 50,
): Promise<RoutineSummary[]> {
  const rows = await db.getAllAsync<RoutineSummaryRow>(
    `SELECT
      routines.id,
      routines.name,
      routines.description,
      routines.updated_at,
      COUNT(routine_exercises.id) AS exercise_count
    FROM routines
    LEFT JOIN routine_exercises
      ON routine_exercises.routine_id = routines.id
    WHERE routines.is_archived = 0
    GROUP BY routines.id
    ORDER BY routines.updated_at DESC
    LIMIT ?`,
    limit,
  );

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    description: row.description,
    exerciseCount: row.exercise_count,
    updatedAt: row.updated_at,
  }));
}

export async function getRoutineDetailById(
  db: SQLiteDatabase,
  routineId: string,
): Promise<RoutineDetail | null> {
  const routine = await db.getFirstAsync<RoutineRow>(
    `SELECT
      id,
      name,
      description,
      is_archived,
      created_at,
      updated_at
    FROM routines
    WHERE id = ?`,
    routineId,
  );

  if (!routine) {
    return null;
  }

  const exerciseRows = await db.getAllAsync<RoutineExerciseRow>(
    `SELECT
      routine_exercises.id AS routine_exercise_id,
      routine_exercises.exercise_id,
      exercises.name,
      exercises.muscle_group,
      exercises.equipment_type,
      routine_exercises.rest_time_seconds,
      routine_exercises.sort_order
    FROM routine_exercises
    INNER JOIN exercises ON exercises.id = routine_exercises.exercise_id
    WHERE routine_exercises.routine_id = ?
    ORDER BY routine_exercises.sort_order ASC`,
    routineId,
  );

  return {
    id: routine.id,
    name: routine.name,
    description: routine.description,
    isArchived: routine.is_archived === 1,
    createdAt: routine.created_at,
    updatedAt: routine.updated_at,
    exercises: exerciseRows.map((row) => ({
      localId: row.routine_exercise_id,
      exerciseId: row.exercise_id,
      name: row.name,
      muscleGroup: row.muscle_group,
      equipmentType: row.equipment_type,
      restTimeSeconds: row.rest_time_seconds,
    })),
  };
}

export async function createRoutine(
  db: SQLiteDatabase,
  payload: RoutineUpsertPayload,
): Promise<string> {
  const routineId = createId();
  const now = nowIsoTimestamp();

  await db.withTransactionAsync(async () => {
    await db.runAsync(
      `INSERT INTO routines (id, name, description, is_archived, created_at, updated_at)
      VALUES (?, ?, ?, 0, ?, ?)`,
      routineId,
      payload.name,
      payload.description,
      now,
      now,
    );

    await insertRoutineExercises(db, routineId, payload, now);
  });

  return routineId;
}

export async function updateRoutine(
  db: SQLiteDatabase,
  routineId: string,
  payload: RoutineUpsertPayload,
): Promise<void> {
  const now = nowIsoTimestamp();

  await db.withTransactionAsync(async () => {
    await db.runAsync(
      `UPDATE routines
      SET name = ?, description = ?, updated_at = ?
      WHERE id = ?`,
      payload.name,
      payload.description,
      now,
      routineId,
    );

    await db.runAsync("DELETE FROM routine_exercises WHERE routine_id = ?", routineId);
    await insertRoutineExercises(db, routineId, payload, now);
  });
}

export async function archiveRoutine(
  db: SQLiteDatabase,
  routineId: string,
): Promise<void> {
  await db.runAsync(
    `UPDATE routines
    SET is_archived = 1, updated_at = ?
    WHERE id = ?`,
    nowIsoTimestamp(),
    routineId,
  );
}

export async function getExerciseById(
  db: SQLiteDatabase,
  exerciseId: string,
): Promise<Exercise | null> {
  const row = await db.getFirstAsync<ExerciseRow>(
    `SELECT id, name, muscle_group, equipment_type, is_favorite, is_custom
    FROM exercises
    WHERE id = ?`,
    exerciseId,
  );

  if (!row) {
    return null;
  }

  return mapExerciseRow(row);
}

export async function createCustomExercise(
  db: SQLiteDatabase,
  payload: CreateCustomExercisePayload,
): Promise<Exercise> {
  const duplicate = await db.getFirstAsync<ExerciseRow>(
    `SELECT id, name, muscle_group, equipment_type, is_favorite, is_custom
    FROM exercises
    WHERE LOWER(TRIM(name)) = LOWER(TRIM(?))
    LIMIT 1`,
    payload.name,
  );

  if (duplicate) {
    throw new Error("An exercise with the same name already exists.");
  }

  const exerciseId = createId();

  await db.runAsync(
    `INSERT INTO exercises (
      id,
      name,
      muscle_group,
      equipment_type,
      is_favorite,
      is_custom
    ) VALUES (?, ?, ?, ?, 0, 1)`,
    exerciseId,
    payload.name,
    payload.muscleGroup,
    payload.equipmentType,
  );

  return {
    id: exerciseId,
    name: payload.name,
    muscleGroup: payload.muscleGroup,
    equipmentType: payload.equipmentType,
    isFavorite: false,
    isCustom: true,
  };
}

export async function listExercisesForPicker(
  db: SQLiteDatabase,
  query: ExerciseQuery,
): Promise<ExerciseFilterResult> {
  const whereClauses: string[] = [];
  const params: Array<string | number> = [];

  if (query.search) {
    whereClauses.push("(name LIKE ? OR muscle_group LIKE ?)");
    const pattern = `%${query.search.trim()}%`;
    params.push(pattern, pattern);
  }

  if (query.muscleGroup) {
    whereClauses.push("muscle_group = ?");
    params.push(query.muscleGroup);
  }

  if (query.excludeIds && query.excludeIds.length > 0) {
    const placeholders = query.excludeIds.map(() => "?").join(", ");
    whereClauses.push(`id NOT IN (${placeholders})`);
    params.push(...query.excludeIds);
  }

  const whereSql =
    whereClauses.length > 0 ? `WHERE ${whereClauses.join(" AND ")}` : "";
  const limit = query.limit ?? 80;

  const exerciseRows = await db.getAllAsync<ExerciseRow>(
    `SELECT
      id,
      name,
      muscle_group,
      equipment_type,
      is_favorite,
      is_custom
    FROM exercises
    ${whereSql}
    ORDER BY is_custom DESC, name ASC
    LIMIT ?`,
    ...params,
    limit,
  );

  const muscleGroupRows = await db.getAllAsync<MuscleGroupRow>(
    `SELECT DISTINCT muscle_group
    FROM exercises
    ORDER BY muscle_group ASC`,
  );

  const equipmentTypeRows = await db.getAllAsync<EquipmentTypeRow>(
    `SELECT DISTINCT equipment_type
    FROM exercises
    ORDER BY equipment_type ASC`,
  );

  return {
    exercises: exerciseRows.map(mapExerciseRow),
    muscleGroups: muscleGroupRows.map((row) => row.muscle_group),
    equipmentTypes: equipmentTypeRows.map((row) => row.equipment_type),
  };
}

async function insertRoutineExercises(
  db: SQLiteDatabase,
  routineId: string,
  payload: RoutineUpsertPayload,
  now: string,
): Promise<void> {
  for (let index = 0; index < payload.exercises.length; index += 1) {
    const exercise = payload.exercises[index];
    await db.runAsync(
      `INSERT INTO routine_exercises (
        id,
        routine_id,
        exercise_id,
        sort_order,
        rest_time_seconds,
        created_at,
        updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      createId(),
      routineId,
      exercise.exerciseId,
      index,
      exercise.restTimeSeconds,
      now,
      now,
    );
  }
}

function mapExerciseRow(row: ExerciseRow): Exercise {
  return {
    id: row.id,
    name: row.name,
    muscleGroup: row.muscle_group,
    equipmentType: row.equipment_type,
    isFavorite: row.is_favorite === 1,
    isCustom: row.is_custom === 1,
  };
}
