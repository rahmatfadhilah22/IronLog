import type { SQLiteDatabase } from "expo-sqlite";

import seedExercises from "../../../db/seed-exercises.json";

import type { ExerciseSeed } from "../../types/exercise";

type CountRow = {
  count: number;
};

const EXERCISE_SEED = seedExercises as ExerciseSeed[];

export async function seedExercisesIfEmpty(
  db: SQLiteDatabase,
): Promise<number> {
  const row = await db.getFirstAsync<CountRow>(
    "SELECT COUNT(1) AS count FROM exercises",
  );

  if ((row?.count ?? 0) > 0) {
    return 0;
  }

  await db.withTransactionAsync(async () => {
    for (const exercise of EXERCISE_SEED) {
      await db.runAsync(
        `INSERT INTO exercises (id, name, muscle_group, equipment_type, is_favorite)
        VALUES (?, ?, ?, ?, ?)`,
        exercise.id,
        exercise.name,
        exercise.muscle_group,
        exercise.equipment_type,
        exercise.is_favorite,
      );
    }
  });

  return EXERCISE_SEED.length;
}
