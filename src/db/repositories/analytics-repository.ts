import type { SQLiteDatabase } from "expo-sqlite";

import { convertWeight, estimateOneRm, nowIsoTimestamp } from "../../core/utils";
import type {
  ExerciseProgressDetail,
  ExerciseTrendPoint,
  ProgressExerciseSummary,
  ProgressRange,
} from "../../types/progress";
import type { OneRmFormula, PreferredUnit } from "../../types/settings";

type CompletedSetRow = {
  exercise_id: string;
  workout_id: string;
  weight: number;
  reps: number;
  unit: PreferredUnit;
  set_type: string;
  performed_at: string;
};

type ExerciseSummaryRow = {
  exercise_id: string;
  exercise_name: string;
  muscle_group: string;
  best_1rm: number;
  best_weight: number;
  best_volume: number;
  total_sessions: number;
  last_performed: string | null;
};

type ExerciseRow = {
  id: string;
  name: string;
  muscle_group: string;
  equipment_type: string;
};

type ExerciseStatsRow = {
  exercise_id: string;
  best_1rm: number;
  best_volume: number;
  best_weight: number;
  total_sessions: number;
  last_performed: string | null;
};

type CompletedWorkoutCountRow = {
  count: number;
};

type CompletedSetCountRow = {
  count: number;
};

type ExerciseAccumulator = {
  bestWeight: number;
  bestOneRm: number;
  lastPerformed: string | null;
  workoutVolume: Map<string, number>;
  sessionIds: Set<string>;
};

type SessionAccumulator = {
  workoutId: string;
  performedAt: string;
  topWeight: number;
  sessionVolume: number;
  estimatedOneRm: number;
  setCount: number;
};

export async function rebuildExerciseStatsCache(
  db: SQLiteDatabase,
  preferredUnit: PreferredUnit,
  formula: OneRmFormula,
): Promise<number> {
  const rows = await db.getAllAsync<CompletedSetRow>(
    `SELECT
      workout_exercises.exercise_id,
      workouts.id AS workout_id,
      workout_sets.weight,
      workout_sets.reps,
      workout_sets.unit,
      workout_sets.set_type,
      COALESCE(
        workout_sets.completed_at,
        workouts.finished_at,
        workouts.started_at,
        workouts.updated_at
      ) AS performed_at
    FROM workouts
    INNER JOIN workout_exercises
      ON workout_exercises.workout_id = workouts.id
    INNER JOIN workout_sets
      ON workout_sets.workout_exercise_id = workout_exercises.id
    WHERE workouts.status = 'completed'
      AND workout_sets.is_completed = 1
      AND workout_sets.reps > 0`,
  );

  const byExercise = new Map<string, ExerciseAccumulator>();

  for (const row of rows) {
    const convertedWeight = convertWeight(row.weight, row.unit, preferredUnit);
    const reps = Math.max(0, Math.floor(row.reps));
    const setVolume = convertedWeight * reps;

    const current =
      byExercise.get(row.exercise_id) ??
      ({
        bestWeight: 0,
        bestOneRm: 0,
        lastPerformed: null,
        workoutVolume: new Map<string, number>(),
        sessionIds: new Set<string>(),
      } satisfies ExerciseAccumulator);

    current.sessionIds.add(row.workout_id);
    current.workoutVolume.set(
      row.workout_id,
      (current.workoutVolume.get(row.workout_id) ?? 0) + setVolume,
    );

    if (row.set_type !== "warmup") {
      const estimated = estimateOneRm(convertedWeight, reps, formula);
      current.bestWeight = Math.max(current.bestWeight, convertedWeight);
      current.bestOneRm = Math.max(current.bestOneRm, estimated);
    }

    if (!current.lastPerformed || row.performed_at > current.lastPerformed) {
      current.lastPerformed = row.performed_at;
    }

    byExercise.set(row.exercise_id, current);
  }

  const now = nowIsoTimestamp();

  await db.withTransactionAsync(async () => {
    await db.runAsync("DELETE FROM exercise_stats");

    for (const [exerciseId, aggregate] of byExercise.entries()) {
      const bestVolume = getMaxValue(aggregate.workoutVolume);

      await db.runAsync(
        `INSERT INTO exercise_stats (
          exercise_id,
          best_1rm,
          best_volume,
          best_weight,
          total_sessions,
          last_performed,
          updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        exerciseId,
        roundMetric(aggregate.bestOneRm),
        roundMetric(bestVolume),
        roundMetric(aggregate.bestWeight),
        aggregate.sessionIds.size,
        aggregate.lastPerformed,
        now,
      );
    }
  });

  return byExercise.size;
}

export async function listProgressExerciseSummaries(
  db: SQLiteDatabase,
  search?: string,
  limit = 100,
): Promise<ProgressExerciseSummary[]> {
  const hasSearch = Boolean(search?.trim());
  const rows = hasSearch
    ? await db.getAllAsync<ExerciseSummaryRow>(
        `SELECT
          exercise_stats.exercise_id,
          exercises.name AS exercise_name,
          exercises.muscle_group,
          exercise_stats.best_1rm,
          exercise_stats.best_weight,
          exercise_stats.best_volume,
          exercise_stats.total_sessions,
          exercise_stats.last_performed
        FROM exercise_stats
        INNER JOIN exercises ON exercises.id = exercise_stats.exercise_id
        WHERE exercises.name LIKE ? OR exercises.muscle_group LIKE ?
        ORDER BY exercise_stats.last_performed DESC, exercise_stats.total_sessions DESC
        LIMIT ?`,
        `%${search?.trim()}%`,
        `%${search?.trim()}%`,
        limit,
      )
    : await db.getAllAsync<ExerciseSummaryRow>(
        `SELECT
          exercise_stats.exercise_id,
          exercises.name AS exercise_name,
          exercises.muscle_group,
          exercise_stats.best_1rm,
          exercise_stats.best_weight,
          exercise_stats.best_volume,
          exercise_stats.total_sessions,
          exercise_stats.last_performed
        FROM exercise_stats
        INNER JOIN exercises ON exercises.id = exercise_stats.exercise_id
        ORDER BY exercise_stats.last_performed DESC, exercise_stats.total_sessions DESC
        LIMIT ?`,
        limit,
      );

  return rows.map(mapExerciseSummaryRow);
}

export async function listTopLiftSummaries(
  db: SQLiteDatabase,
  limit = 5,
): Promise<ProgressExerciseSummary[]> {
  const rows = await db.getAllAsync<ExerciseSummaryRow>(
    `SELECT
      exercise_stats.exercise_id,
      exercises.name AS exercise_name,
      exercises.muscle_group,
      exercise_stats.best_1rm,
      exercise_stats.best_weight,
      exercise_stats.best_volume,
      exercise_stats.total_sessions,
      exercise_stats.last_performed
    FROM exercise_stats
    INNER JOIN exercises ON exercises.id = exercise_stats.exercise_id
    ORDER BY exercise_stats.best_weight DESC, exercise_stats.best_1rm DESC
    LIMIT ?`,
    limit,
  );

  return rows.map(mapExerciseSummaryRow);
}

export async function getProgressTrackedExerciseCount(
  db: SQLiteDatabase,
): Promise<number> {
  const row = await db.getFirstAsync<CompletedWorkoutCountRow>(
    "SELECT COUNT(1) AS count FROM exercise_stats",
  );
  return row?.count ?? 0;
}

export async function getCompletedWorkoutCount(
  db: SQLiteDatabase,
): Promise<number> {
  const row = await db.getFirstAsync<CompletedWorkoutCountRow>(
    "SELECT COUNT(1) AS count FROM workouts WHERE status = 'completed'",
  );
  return row?.count ?? 0;
}

export async function getCompletedSetCount(db: SQLiteDatabase): Promise<number> {
  const row = await db.getFirstAsync<CompletedSetCountRow>(
    `SELECT COUNT(workout_sets.id) AS count
    FROM workout_sets
    INNER JOIN workout_exercises
      ON workout_exercises.id = workout_sets.workout_exercise_id
    INNER JOIN workouts
      ON workouts.id = workout_exercises.workout_id
    WHERE workouts.status = 'completed'
      AND workout_sets.is_completed = 1`,
  );
  return row?.count ?? 0;
}

export async function getExerciseProgressDetailById(
  db: SQLiteDatabase,
  exerciseId: string,
  preferredUnit: PreferredUnit,
  formula: OneRmFormula,
  range: ProgressRange,
): Promise<ExerciseProgressDetail | null> {
  const exercise = await db.getFirstAsync<ExerciseRow>(
    `SELECT id, name, muscle_group, equipment_type
    FROM exercises
    WHERE id = ?`,
    exerciseId,
  );

  if (!exercise) {
    return null;
  }

  const stats = await db.getFirstAsync<ExerciseStatsRow>(
    `SELECT
      exercise_id,
      best_1rm,
      best_volume,
      best_weight,
      total_sessions,
      last_performed
    FROM exercise_stats
    WHERE exercise_id = ?`,
    exerciseId,
  );

  const cutoff = getRangeCutoff(range);
  const trendRows =
    cutoff === null
      ? await db.getAllAsync<CompletedSetRow>(
          `SELECT
            workout_exercises.exercise_id,
            workouts.id AS workout_id,
            workout_sets.weight,
            workout_sets.reps,
            workout_sets.unit,
            workout_sets.set_type,
            COALESCE(
              workout_sets.completed_at,
              workouts.finished_at,
              workouts.started_at,
              workouts.updated_at
            ) AS performed_at
          FROM workouts
          INNER JOIN workout_exercises
            ON workout_exercises.workout_id = workouts.id
          INNER JOIN workout_sets
            ON workout_sets.workout_exercise_id = workout_exercises.id
          WHERE workouts.status = 'completed'
            AND workout_sets.is_completed = 1
            AND workout_sets.reps > 0
            AND workout_exercises.exercise_id = ?
          ORDER BY performed_at ASC, workout_sets.set_number ASC`,
          exerciseId,
        )
      : await db.getAllAsync<CompletedSetRow>(
          `SELECT
            workout_exercises.exercise_id,
            workouts.id AS workout_id,
            workout_sets.weight,
            workout_sets.reps,
            workout_sets.unit,
            workout_sets.set_type,
            COALESCE(
              workout_sets.completed_at,
              workouts.finished_at,
              workouts.started_at,
              workouts.updated_at
            ) AS performed_at
          FROM workouts
          INNER JOIN workout_exercises
            ON workout_exercises.workout_id = workouts.id
          INNER JOIN workout_sets
            ON workout_sets.workout_exercise_id = workout_exercises.id
          WHERE workouts.status = 'completed'
            AND workout_sets.is_completed = 1
            AND workout_sets.reps > 0
            AND workout_exercises.exercise_id = ?
            AND COALESCE(
              workout_sets.completed_at,
              workouts.finished_at,
              workouts.started_at,
              workouts.updated_at
            ) >= ?
          ORDER BY performed_at ASC, workout_sets.set_number ASC`,
          exerciseId,
          cutoff,
        );

  const trendMap = new Map<string, SessionAccumulator>();

  for (const row of trendRows) {
    const convertedWeight = convertWeight(row.weight, row.unit, preferredUnit);
    const reps = Math.max(0, Math.floor(row.reps));
    const session = trendMap.get(row.workout_id) ?? {
      workoutId: row.workout_id,
      performedAt: row.performed_at,
      topWeight: 0,
      sessionVolume: 0,
      estimatedOneRm: 0,
      setCount: 0,
    };

    session.sessionVolume += convertedWeight * reps;
    session.setCount += 1;
    if (row.set_type !== "warmup") {
      session.topWeight = Math.max(session.topWeight, convertedWeight);
      session.estimatedOneRm = Math.max(
        session.estimatedOneRm,
        estimateOneRm(convertedWeight, reps, formula),
      );
    }

    if (row.performed_at > session.performedAt) {
      session.performedAt = row.performed_at;
    }

    trendMap.set(row.workout_id, session);
  }

  const trend = [...trendMap.values()]
    .sort((left, right) => left.performedAt.localeCompare(right.performedAt))
    .map<ExerciseTrendPoint>((entry) => ({
      workoutId: entry.workoutId,
      performedAt: entry.performedAt,
      topWeight: roundMetric(entry.topWeight),
      sessionVolume: roundMetric(entry.sessionVolume),
      estimatedOneRm: roundMetric(entry.estimatedOneRm),
      setCount: entry.setCount,
    }));

  return {
    exerciseId: exercise.id,
    exerciseName: exercise.name,
    muscleGroup: exercise.muscle_group,
    equipmentType: exercise.equipment_type,
    preferredUnit,
    oneRmFormula: formula,
    bestOneRm: roundMetric(stats?.best_1rm ?? 0),
    bestWeight: roundMetric(stats?.best_weight ?? 0),
    bestVolume: roundMetric(stats?.best_volume ?? 0),
    totalSessions: stats?.total_sessions ?? 0,
    lastPerformed: stats?.last_performed ?? null,
    trend,
  };
}

function mapExerciseSummaryRow(row: ExerciseSummaryRow): ProgressExerciseSummary {
  return {
    exerciseId: row.exercise_id,
    exerciseName: row.exercise_name,
    muscleGroup: row.muscle_group,
    bestOneRm: roundMetric(row.best_1rm),
    bestWeight: roundMetric(row.best_weight),
    bestVolume: roundMetric(row.best_volume),
    totalSessions: row.total_sessions,
    lastPerformed: row.last_performed,
  };
}

function getMaxValue(values: Map<string, number>): number {
  let max = 0;
  for (const value of values.values()) {
    if (value > max) {
      max = value;
    }
  }
  return max;
}

function roundMetric(value: number): number {
  return Math.round(value * 100) / 100;
}

function getRangeCutoff(range: ProgressRange): string | null {
  if (range === "all") {
    return null;
  }

  const days = range === "30d" ? 30 : 90;
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString();
}
