PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS app_settings (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    preferred_unit TEXT NOT NULL DEFAULT 'kg' CHECK (preferred_unit IN ('kg', 'lb')),
    one_rm_formula TEXT NOT NULL DEFAULT 'brzycki' CHECK (one_rm_formula IN ('brzycki', 'epley')),
    haptics_enabled INTEGER NOT NULL DEFAULT 1 CHECK (haptics_enabled IN (0, 1)),
    auto_start_rest_timer INTEGER NOT NULL DEFAULT 1 CHECK (auto_start_rest_timer IN (0, 1)),
    updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS exercises (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    muscle_group TEXT NOT NULL,
    equipment_type TEXT NOT NULL,
    is_favorite INTEGER NOT NULL DEFAULT 0 CHECK (is_favorite IN (0, 1))
);

CREATE TABLE IF NOT EXISTS routines (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT DEFAULT '',
    is_archived INTEGER NOT NULL DEFAULT 0 CHECK (is_archived IN (0, 1)),
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS routine_exercises (
    id TEXT PRIMARY KEY,
    routine_id TEXT NOT NULL,
    exercise_id TEXT NOT NULL,
    sort_order INTEGER NOT NULL CHECK (sort_order >= 0),
    rest_time_seconds INTEGER NOT NULL DEFAULT 90 CHECK (rest_time_seconds >= 0),
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (routine_id) REFERENCES routines(id) ON DELETE CASCADE,
    FOREIGN KEY (exercise_id) REFERENCES exercises(id) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS workouts (
    id TEXT PRIMARY KEY,
    routine_id TEXT,
    source_type TEXT NOT NULL DEFAULT 'routine' CHECK (source_type IN ('routine', 'custom')),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
    started_at TEXT NOT NULL,
    finished_at TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (routine_id) REFERENCES routines(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS workout_exercises (
    id TEXT PRIMARY KEY,
    workout_id TEXT NOT NULL,
    routine_exercise_id TEXT,
    exercise_id TEXT NOT NULL,
    display_name TEXT NOT NULL,
    sort_order INTEGER NOT NULL CHECK (sort_order >= 0),
    rest_time_seconds INTEGER NOT NULL DEFAULT 90 CHECK (rest_time_seconds >= 0),
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (workout_id) REFERENCES workouts(id) ON DELETE CASCADE,
    FOREIGN KEY (routine_exercise_id) REFERENCES routine_exercises(id) ON DELETE SET NULL,
    FOREIGN KEY (exercise_id) REFERENCES exercises(id) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS workout_sets (
    id TEXT PRIMARY KEY,
    workout_exercise_id TEXT NOT NULL,
    set_number INTEGER NOT NULL CHECK (set_number >= 1 AND set_number <= 20),
    weight REAL NOT NULL CHECK (weight >= 0),
    reps INTEGER NOT NULL CHECK (reps >= 0),
    rpe INTEGER CHECK (rpe IS NULL OR (rpe >= 1 AND rpe <= 10)),
    unit TEXT NOT NULL CHECK (unit IN ('kg', 'lb')),
    is_completed INTEGER NOT NULL DEFAULT 1 CHECK (is_completed IN (0, 1)),
    set_type TEXT NOT NULL DEFAULT 'working' CHECK (set_type IN ('working', 'warmup', 'dropset', 'failure')),
    completed_at TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (workout_exercise_id) REFERENCES workout_exercises(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS body_metrics (
    id TEXT PRIMARY KEY,
    weight REAL NOT NULL CHECK (weight >= 0),
    body_fat_percentage REAL CHECK (body_fat_percentage IS NULL OR (body_fat_percentage >= 0 AND body_fat_percentage <= 100)),
    recorded_at TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS exercise_stats (
    exercise_id TEXT PRIMARY KEY,
    best_1rm REAL NOT NULL DEFAULT 0 CHECK (best_1rm >= 0),
    best_volume REAL NOT NULL DEFAULT 0 CHECK (best_volume >= 0),
    best_weight REAL NOT NULL DEFAULT 0 CHECK (best_weight >= 0),
    total_sessions INTEGER NOT NULL DEFAULT 0 CHECK (total_sessions >= 0),
    last_performed TEXT,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (exercise_id) REFERENCES exercises(id) ON DELETE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_routine_exercises_routine_sort
    ON routine_exercises (routine_id, sort_order);

CREATE UNIQUE INDEX IF NOT EXISTS idx_workout_exercises_workout_sort
    ON workout_exercises (workout_id, sort_order);

CREATE UNIQUE INDEX IF NOT EXISTS idx_workout_sets_exercise_set_number
    ON workout_sets (workout_exercise_id, set_number);

CREATE INDEX IF NOT EXISTS idx_routines_archived_updated
    ON routines (is_archived, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_workouts_status_started
    ON workouts (status, started_at DESC);

CREATE INDEX IF NOT EXISTS idx_workouts_finished_at
    ON workouts (finished_at DESC);

CREATE INDEX IF NOT EXISTS idx_workout_exercises_workout_id
    ON workout_exercises (workout_id);

CREATE INDEX IF NOT EXISTS idx_workout_sets_completed_at
    ON workout_sets (completed_at DESC);

CREATE INDEX IF NOT EXISTS idx_exercises_muscle_group_name
    ON exercises (muscle_group, name);

CREATE INDEX IF NOT EXISTS idx_body_metrics_recorded_at
    ON body_metrics (recorded_at DESC);

INSERT INTO app_settings (id, preferred_unit, one_rm_formula, haptics_enabled, auto_start_rest_timer, updated_at)
VALUES (1, 'kg', 'brzycki', 1, 1, CURRENT_TIMESTAMP)
ON CONFLICT(id) DO NOTHING;
