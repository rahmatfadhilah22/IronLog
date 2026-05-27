import type { Migration } from "./types";

export const migration004ExerciseNotes: Migration = {
  version: 4,
  name: "004_exercise_notes",
  statements: [
    `ALTER TABLE workout_exercises ADD COLUMN notes TEXT DEFAULT ''`,
  ],
};