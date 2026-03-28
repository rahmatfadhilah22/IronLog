import type { Migration } from "./types";

export const migration003CustomExercises: Migration = {
  version: 3,
  name: "003_custom_exercises",
  statements: [
    `ALTER TABLE exercises ADD COLUMN is_custom INTEGER NOT NULL DEFAULT 0`,
  ],
};
