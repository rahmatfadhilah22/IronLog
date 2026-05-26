import type { SQLiteDatabase } from "expo-sqlite";

import { migration001Init } from "./001_init";
import { migration002WorkoutTitleSnapshot } from "./002_workout_title_snapshot";
import { migration003CustomExercises } from "./003_custom_exercises";
import { migration004SetType } from "./004_set_type";
import type { Migration } from "./types";

const migrations: Migration[] = [
  migration001Init,
  migration002WorkoutTitleSnapshot,
  migration003CustomExercises,
  migration004SetType,
].sort((left, right) => left.version - right.version);

type UserVersionRow = {
  user_version: number;
};

export async function runMigrations(db: SQLiteDatabase): Promise<void> {
  const currentVersion = await getCurrentUserVersion(db);

  for (const migration of migrations) {
    if (migration.version <= currentVersion) {
      continue;
    }

    await db.withTransactionAsync(async () => {
      for (const statement of migration.statements) {
        await db.execAsync(statement);
      }

      await db.execAsync(`PRAGMA user_version = ${migration.version}`);
    });
  }
}

async function getCurrentUserVersion(db: SQLiteDatabase): Promise<number> {
  const row = await db.getFirstAsync<UserVersionRow>("PRAGMA user_version");
  return row?.user_version ?? 0;
}
