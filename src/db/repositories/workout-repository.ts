import type { SQLiteDatabase } from "expo-sqlite";

import { createId, nowIsoTimestamp } from "../../core/utils";
import type { PreferredUnit } from "../../types/settings";
import type {
  ActiveWorkoutReference,
  StartWorkoutResult,
  WorkoutDetail,
  WorkoutExerciseDetail,
  WorkoutSet,
  WorkoutSetInput,
  WorkoutSetUpdateInput,
  WorkoutStatus,
  WorkoutSummary,
} from "../../types/workout";

type ActiveWorkoutRow = {
  id: string;
  routine_id: string | null;
  title_snapshot: string | null;
  routine_name: string | null;
  started_at: string;
};

type RoutineRow = {
  id: string;
  name: string;
  is_archived: 0 | 1;
};

type RoutineExerciseSnapshotRow = {
  routine_exercise_id: string;
  exercise_id: string;
  display_name: string;
  sort_order: number;
  rest_time_seconds: number;
};

type WorkoutRow = {
  id: string;
  routine_id: string | null;
  source_type: "routine" | "custom";
  status: WorkoutStatus;
  started_at: string;
  finished_at: string | null;
  created_at: string;
  updated_at: string;
  title_snapshot: string | null;
  routine_name: string | null;
};

type WorkoutExerciseRow = {
  id: string;
  workout_id: string;
  routine_exercise_id: string | null;
  exercise_id: string;
  display_name: string;
  sort_order: number;
  rest_time_seconds: number;
};

type WorkoutSetRow = {
  id: string;
  workout_exercise_id: string;
  set_number: number;
  weight: number;
  reps: number;
  rpe: number | null;
  unit: PreferredUnit;
  is_completed: 0 | 1;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
};

type NextSetNumberRow = {
  max_set_number: number;
};

type WorkoutSetMetaRow = {
  workout_set_id: string;
  workout_exercise_id: string;
  workout_id: string;
  set_number: number;
  workout_status: WorkoutStatus;
};

type WorkoutExerciseMetaRow = {
  id: string;
  workout_id: string;
  routine_exercise_id: string | null;
  exercise_id: string;
  display_name: string;
  sort_order: number;
  rest_time_seconds: number;
  workout_status: WorkoutStatus;
};

type ExerciseRow = {
  id: string;
  name: string;
};

type MaxSortOrderRow = {
  max_sort_order: number;
};

type RestTimeRow = {
  rest_time_seconds: number;
};

type SummaryTotalsRow = {
  total_sets: number;
  total_volume: number | null;
};

type TopSetRow = {
  exercise_id: string;
  exercise_name: string;
  weight: number;
  reps: number;
  rpe: number | null;
  unit: PreferredUnit;
};

type WorkoutStatusRow = {
  status: WorkoutStatus;
};

const DEFAULT_REST_SECONDS = 90;
const MAX_SETS_PER_EXERCISE = 20;

export async function getActiveWorkout(
  db: SQLiteDatabase,
): Promise<ActiveWorkoutReference | null> {
  const row = await db.getFirstAsync<ActiveWorkoutRow>(
    `SELECT
      workouts.id,
      workouts.routine_id,
      workouts.title_snapshot,
      routines.name AS routine_name,
      workouts.started_at
    FROM workouts
    LEFT JOIN routines ON routines.id = workouts.routine_id
    WHERE workouts.status = 'active'
    ORDER BY workouts.started_at DESC
    LIMIT 1`,
  );

  if (!row) {
    return null;
  }

  return {
    id: row.id,
    routineId: row.routine_id,
    title: row.title_snapshot ?? row.routine_name ?? "Custom Workout",
    startedAt: row.started_at,
  };
}

export async function startWorkoutFromRoutine(
  db: SQLiteDatabase,
  routineId: string,
): Promise<StartWorkoutResult> {
  const activeWorkout = await getActiveWorkout(db);

  if (activeWorkout) {
    return {
      workoutId: activeWorkout.id,
      reusedActiveWorkout: true,
    };
  }

  const routine = await db.getFirstAsync<RoutineRow>(
    `SELECT id, name, is_archived
    FROM routines
    WHERE id = ?`,
    routineId,
  );

  if (!routine || routine.is_archived === 1) {
    throw new Error("Routine tidak ditemukan atau sudah diarsipkan.");
  }

  const snapshots = await db.getAllAsync<RoutineExerciseSnapshotRow>(
    `SELECT
      routine_exercises.id AS routine_exercise_id,
      routine_exercises.exercise_id,
      exercises.name AS display_name,
      routine_exercises.sort_order,
      routine_exercises.rest_time_seconds
    FROM routine_exercises
    INNER JOIN exercises ON exercises.id = routine_exercises.exercise_id
    WHERE routine_exercises.routine_id = ?
    ORDER BY routine_exercises.sort_order ASC`,
    routineId,
  );

  if (snapshots.length === 0) {
    throw new Error("Routine belum memiliki exercise.");
  }

  const workoutId = createId();
  const now = nowIsoTimestamp();

  await db.withTransactionAsync(async () => {
    await db.runAsync(
      `INSERT INTO workouts (
        id,
        routine_id,
        source_type,
        status,
        title_snapshot,
        started_at,
        finished_at,
        created_at,
        updated_at
      ) VALUES (?, ?, 'routine', 'active', ?, ?, NULL, ?, ?)`,
      workoutId,
      routineId,
      routine.name,
      now,
      now,
      now,
    );

    for (const snapshot of snapshots) {
      await db.runAsync(
        `INSERT INTO workout_exercises (
          id,
          workout_id,
          routine_exercise_id,
          exercise_id,
          display_name,
          sort_order,
          rest_time_seconds,
          created_at,
          updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        createId(),
        workoutId,
        snapshot.routine_exercise_id,
        snapshot.exercise_id,
        snapshot.display_name,
        snapshot.sort_order,
        snapshot.rest_time_seconds,
        now,
        now,
      );
    }
  });

  return {
    workoutId,
    reusedActiveWorkout: false,
  };
}

export async function getWorkoutDetailById(
  db: SQLiteDatabase,
  workoutId: string,
): Promise<WorkoutDetail | null> {
  const workout = await db.getFirstAsync<WorkoutRow>(
    `SELECT
      workouts.id,
      workouts.routine_id,
      workouts.source_type,
      workouts.status,
      workouts.title_snapshot,
      workouts.started_at,
      workouts.finished_at,
      workouts.created_at,
      workouts.updated_at,
      routines.name AS routine_name
    FROM workouts
    LEFT JOIN routines ON routines.id = workouts.routine_id
    WHERE workouts.id = ?`,
    workoutId,
  );

  if (!workout) {
    return null;
  }

  const exerciseRows = await db.getAllAsync<WorkoutExerciseRow>(
    `SELECT
      id,
      workout_id,
      routine_exercise_id,
      exercise_id,
      display_name,
      sort_order,
      rest_time_seconds
    FROM workout_exercises
    WHERE workout_id = ?
    ORDER BY sort_order ASC`,
    workoutId,
  );

  const setRows = await db.getAllAsync<WorkoutSetRow>(
    `SELECT
      workout_sets.id,
      workout_sets.workout_exercise_id,
      workout_sets.set_number,
      workout_sets.weight,
      workout_sets.reps,
      workout_sets.rpe,
      workout_sets.unit,
      workout_sets.is_completed,
      workout_sets.completed_at,
      workout_sets.created_at,
      workout_sets.updated_at
    FROM workout_sets
    INNER JOIN workout_exercises
      ON workout_exercises.id = workout_sets.workout_exercise_id
    WHERE workout_exercises.workout_id = ?
    ORDER BY workout_exercises.sort_order ASC, workout_sets.set_number ASC`,
    workoutId,
  );

  const setsByExerciseId = new Map<string, WorkoutSet[]>();

  for (const row of setRows) {
    const mappedSet = mapWorkoutSetRow(row);
    const existing = setsByExerciseId.get(row.workout_exercise_id);
    if (existing) {
      existing.push(mappedSet);
    } else {
      setsByExerciseId.set(row.workout_exercise_id, [mappedSet]);
    }
  }

  const exercises: WorkoutExerciseDetail[] = exerciseRows.map((row) => {
    const sets = setsByExerciseId.get(row.id) ?? [];
    const totalVolume = sets.reduce(
      (sum, current) => sum + current.weight * current.reps,
      0,
    );

    return {
      id: row.id,
      workoutId: row.workout_id,
      routineExerciseId: row.routine_exercise_id,
      exerciseId: row.exercise_id,
      displayName: row.display_name,
      sortOrder: row.sort_order,
      restTimeSeconds: row.rest_time_seconds,
      sets,
      totalVolume,
    };
  });

  return {
      id: workout.id,
      routineId: workout.routine_id,
      sourceType: workout.source_type,
      status: workout.status,
      routineName: workout.routine_name,
      title: workout.title_snapshot ?? workout.routine_name ?? "Custom Workout",
      startedAt: workout.started_at,
    finishedAt: workout.finished_at,
    createdAt: workout.created_at,
    updatedAt: workout.updated_at,
    exercises,
  };
}

export async function addWorkoutSet(
  db: SQLiteDatabase,
  input: WorkoutSetInput,
): Promise<void> {
  const weight = Math.max(0, input.weight);
  const reps = Math.max(0, Math.floor(input.reps));
  const rpe = sanitizeRpe(input.rpe);
  const now = nowIsoTimestamp();

  await db.withTransactionAsync(async () => {
    const workoutExercise = await db.getFirstAsync<WorkoutExerciseRow>(
      `SELECT
        workout_exercises.id,
        workout_exercises.workout_id,
        workout_exercises.routine_exercise_id,
        workout_exercises.exercise_id,
        workout_exercises.display_name,
        workout_exercises.sort_order,
        workout_exercises.rest_time_seconds,
        workouts.status AS workout_status
      FROM workout_exercises
      INNER JOIN workouts ON workouts.id = workout_exercises.workout_id
      WHERE workout_exercises.id = ?`,
      input.workoutExerciseId,
    ) as WorkoutExerciseMetaRow | null;

    if (!workoutExercise) {
      throw new Error("Exercise workout tidak ditemukan.");
    }

    if (workoutExercise.workout_status !== "active") {
      throw new Error("Workout sudah selesai dan tidak bisa diubah.");
    }

    const nextSetRow = await db.getFirstAsync<NextSetNumberRow>(
      `SELECT COALESCE(MAX(set_number), 0) AS max_set_number
      FROM workout_sets
      WHERE workout_exercise_id = ?`,
      input.workoutExerciseId,
    );

    const nextSetNumber = (nextSetRow?.max_set_number ?? 0) + 1;

    if (nextSetNumber > MAX_SETS_PER_EXERCISE) {
      throw new Error("Maksimal 20 set per exercise tercapai.");
    }

    await db.runAsync(
      `INSERT INTO workout_sets (
        id,
        workout_exercise_id,
        set_number,
        weight,
        reps,
        rpe,
        unit,
        is_completed,
        completed_at,
        created_at,
        updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?)`,
      createId(),
      input.workoutExerciseId,
      nextSetNumber,
      weight,
      reps,
      rpe,
      input.unit,
      now,
      now,
      now,
    );

    await db.runAsync(
      `UPDATE workouts
      SET updated_at = ?
      WHERE id = ?`,
      now,
      workoutExercise.workout_id,
    );
  });
}

export async function updateWorkoutSet(
  db: SQLiteDatabase,
  input: WorkoutSetUpdateInput,
): Promise<void> {
  const weight = Math.max(0, input.weight);
  const reps = Math.max(0, Math.floor(input.reps));
  const rpe = sanitizeRpe(input.rpe);
  const now = nowIsoTimestamp();

  await db.withTransactionAsync(async () => {
    const meta = await db.getFirstAsync<WorkoutSetMetaRow>(
      `SELECT
        workout_sets.id AS workout_set_id,
        workout_sets.workout_exercise_id,
        workout_exercises.workout_id,
        workout_sets.set_number,
        workouts.status AS workout_status
      FROM workout_sets
      INNER JOIN workout_exercises
        ON workout_exercises.id = workout_sets.workout_exercise_id
      INNER JOIN workouts ON workouts.id = workout_exercises.workout_id
      WHERE workout_sets.id = ?`,
      input.workoutSetId,
    );

    if (!meta) {
      throw new Error("Set tidak ditemukan.");
    }

    if (meta.workout_status !== "active") {
      throw new Error("Workout sudah selesai dan tidak bisa diubah.");
    }

    await db.runAsync(
      `UPDATE workout_sets
      SET weight = ?, reps = ?, rpe = ?, unit = ?, updated_at = ?
      WHERE id = ?`,
      weight,
      reps,
      rpe,
      input.unit,
      now,
      input.workoutSetId,
    );

    await db.runAsync(
      `UPDATE workouts
      SET updated_at = ?
      WHERE id = ?`,
      now,
      meta.workout_id,
    );
  });
}

export async function deleteWorkoutSet(
  db: SQLiteDatabase,
  workoutSetId: string,
): Promise<void> {
  const now = nowIsoTimestamp();

  await db.withTransactionAsync(async () => {
    const meta = await db.getFirstAsync<WorkoutSetMetaRow>(
      `SELECT
        workout_sets.id AS workout_set_id,
        workout_sets.workout_exercise_id,
        workout_exercises.workout_id,
        workout_sets.set_number,
        workouts.status AS workout_status
      FROM workout_sets
      INNER JOIN workout_exercises
        ON workout_exercises.id = workout_sets.workout_exercise_id
      INNER JOIN workouts ON workouts.id = workout_exercises.workout_id
      WHERE workout_sets.id = ?`,
      workoutSetId,
    );

    if (!meta) {
      return;
    }

    if (meta.workout_status !== "active") {
      throw new Error("Workout sudah selesai dan tidak bisa diubah.");
    }

    await db.runAsync("DELETE FROM workout_sets WHERE id = ?", workoutSetId);

    await db.runAsync(
      `UPDATE workout_sets
      SET set_number = set_number - 1, updated_at = ?
      WHERE workout_exercise_id = ? AND set_number > ?`,
      now,
      meta.workout_exercise_id,
      meta.set_number,
    );

    await db.runAsync(
      `UPDATE workouts
      SET updated_at = ?
      WHERE id = ?`,
      now,
      meta.workout_id,
    );
  });
}

export async function addWorkoutExerciseBlock(
  db: SQLiteDatabase,
  workoutId: string,
  exerciseId: string,
): Promise<void> {
  const now = nowIsoTimestamp();

  await db.withTransactionAsync(async () => {
    const workoutStatus = await db.getFirstAsync<WorkoutStatusRow>(
      "SELECT status FROM workouts WHERE id = ?",
      workoutId,
    );

    if (!workoutStatus) {
      throw new Error("Workout tidak ditemukan.");
    }

    if (workoutStatus.status !== "active") {
      throw new Error("Workout sudah selesai dan tidak bisa diubah.");
    }

    const exercise = await db.getFirstAsync<ExerciseRow>(
      "SELECT id, name FROM exercises WHERE id = ?",
      exerciseId,
    );

    if (!exercise) {
      throw new Error("Exercise tidak ditemukan.");
    }

    const maxSort = await db.getFirstAsync<MaxSortOrderRow>(
      `SELECT COALESCE(MAX(sort_order), -1) AS max_sort_order
      FROM workout_exercises
      WHERE workout_id = ?`,
      workoutId,
    );

    const restRow = await db.getFirstAsync<RestTimeRow>(
      `SELECT rest_time_seconds
      FROM workout_exercises
      WHERE workout_id = ? AND exercise_id = ?
      ORDER BY sort_order DESC
      LIMIT 1`,
      workoutId,
      exerciseId,
    );

    await db.runAsync(
      `INSERT INTO workout_exercises (
        id,
        workout_id,
        routine_exercise_id,
        exercise_id,
        display_name,
        sort_order,
        rest_time_seconds,
        created_at,
        updated_at
      ) VALUES (?, ?, NULL, ?, ?, ?, ?, ?, ?)`,
      createId(),
      workoutId,
      exercise.id,
      exercise.name,
      (maxSort?.max_sort_order ?? -1) + 1,
      restRow?.rest_time_seconds ?? DEFAULT_REST_SECONDS,
      now,
      now,
    );

    await db.runAsync(
      `UPDATE workouts
      SET updated_at = ?
      WHERE id = ?`,
      now,
      workoutId,
    );
  });
}

export async function finishWorkout(
  db: SQLiteDatabase,
  workoutId: string,
): Promise<void> {
  const workoutStatus = await db.getFirstAsync<WorkoutStatusRow>(
    "SELECT status FROM workouts WHERE id = ?",
    workoutId,
  );

  if (!workoutStatus) {
    throw new Error("Workout tidak ditemukan.");
  }

  if (workoutStatus.status !== "active") {
    return;
  }

  const now = nowIsoTimestamp();

  await db.runAsync(
    `UPDATE workouts
    SET status = 'completed', finished_at = ?, updated_at = ?
    WHERE id = ?`,
    now,
    now,
    workoutId,
  );
}

export async function getWorkoutSummaryById(
  db: SQLiteDatabase,
  workoutId: string,
  preferredUnit: PreferredUnit,
): Promise<WorkoutSummary | null> {
  const workout = await db.getFirstAsync<WorkoutRow>(
    `SELECT
      workouts.id,
      workouts.routine_id,
      workouts.source_type,
      workouts.status,
      workouts.title_snapshot,
      workouts.started_at,
      workouts.finished_at,
      workouts.created_at,
      workouts.updated_at,
      routines.name AS routine_name
    FROM workouts
    LEFT JOIN routines ON routines.id = workouts.routine_id
    WHERE workouts.id = ?`,
    workoutId,
  );

  if (!workout) {
    return null;
  }

  const totals = await db.getFirstAsync<SummaryTotalsRow>(
    `SELECT
      COUNT(workout_sets.id) AS total_sets,
      COALESCE(SUM(
        CASE
          WHEN workout_sets.unit = '${preferredUnit}' THEN workout_sets.weight * workout_sets.reps
          WHEN workout_sets.unit = 'kg' THEN workout_sets.weight * workout_sets.reps * 2.2046226218
          ELSE workout_sets.weight * workout_sets.reps * 0.45359237
        END
      ), 0) AS total_volume
    FROM workout_sets
    INNER JOIN workout_exercises
      ON workout_exercises.id = workout_sets.workout_exercise_id
    WHERE workout_exercises.workout_id = ?
      AND workout_sets.is_completed = 1`,
    workoutId,
  );

  const topSet = await db.getFirstAsync<TopSetRow>(
    `SELECT
      workout_exercises.exercise_id,
      workout_exercises.display_name AS exercise_name,
      workout_sets.weight,
      workout_sets.reps,
      workout_sets.rpe,
      workout_sets.unit
    FROM workout_sets
    INNER JOIN workout_exercises
      ON workout_exercises.id = workout_sets.workout_exercise_id
    WHERE workout_exercises.workout_id = ?
      AND workout_sets.is_completed = 1
    ORDER BY workout_sets.weight DESC, workout_sets.reps DESC, workout_sets.updated_at DESC
    LIMIT 1`,
    workoutId,
  );

  const endTimestamp = workout.finished_at ?? nowIsoTimestamp();
  const durationSeconds = Math.max(
    0,
    Math.floor((Date.parse(endTimestamp) - Date.parse(workout.started_at)) / 1000),
  );

  return {
    workoutId: workout.id,
    title: workout.title_snapshot ?? workout.routine_name ?? "Custom Workout",
    startedAt: workout.started_at,
    finishedAt: workout.finished_at,
    durationSeconds,
    totalSets: totals?.total_sets ?? 0,
    totalVolume: totals?.total_volume ?? 0,
    totalVolumeUnit: preferredUnit,
    topSet: topSet
      ? {
          exerciseId: topSet.exercise_id,
          exerciseName: topSet.exercise_name,
          weight: topSet.weight,
          reps: topSet.reps,
          rpe: topSet.rpe,
          unit: topSet.unit,
        }
      : null,
  };
}

function mapWorkoutSetRow(row: WorkoutSetRow): WorkoutSet {
  return {
    id: row.id,
    workoutExerciseId: row.workout_exercise_id,
    setNumber: row.set_number,
    weight: row.weight,
    reps: row.reps,
    rpe: row.rpe,
    unit: row.unit,
    isCompleted: row.is_completed === 1,
    completedAt: row.completed_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
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
  if (rounded < 1 || rounded > 10) {
    return null;
  }

  return rounded;
}
