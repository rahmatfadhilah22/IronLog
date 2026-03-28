import type { Migration } from "./types";

export const migration002WorkoutTitleSnapshot: Migration = {
  version: 2,
  name: "002_workout_title_snapshot",
  statements: [
    `ALTER TABLE workouts ADD COLUMN title_snapshot TEXT`,
    `UPDATE workouts
    SET title_snapshot = COALESCE(
      (SELECT name FROM routines WHERE routines.id = workouts.routine_id),
      'Custom Workout'
    )
    WHERE title_snapshot IS NULL OR TRIM(title_snapshot) = ''`,
  ],
};
