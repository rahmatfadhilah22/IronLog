import type { Migration } from "./types";

export const migration004SetType: Migration = {
  version: 4,
  name: "004_set_type",
  statements: [
    `ALTER TABLE workout_sets ADD COLUMN set_type TEXT NOT NULL DEFAULT 'working' CHECK (set_type IN ('working', 'warmup', 'dropset', 'failure'))`,
  ],
};
