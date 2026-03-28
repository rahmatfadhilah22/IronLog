import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";

import { APP_NAME } from "../../core/constants";
import { nowIsoTimestamp } from "../../core/utils";
import { getDatabase } from "../../db/sqlite";
import type {
  BackupExportResult,
  IronLogBackupPayload,
  ParsedBackupFile,
} from "../../types/backup";
import { analyticsService } from "../analytics";
import { appSettingsService } from "../settings";

const BACKUP_SCHEMA_VERSION = 1;
const BACKUP_FOLDER_NAME = "ironlog-backups";

const TABLE_NAMES = [
  "app_settings",
  "exercises",
  "routines",
  "routine_exercises",
  "workouts",
  "workout_exercises",
  "workout_sets",
  "body_metrics",
  "exercise_stats",
] as const;

type TableName = (typeof TABLE_NAMES)[number];

type CsvRow = {
  workout_id: string;
  workout_title: string | null;
  started_at: string;
  finished_at: string | null;
  exercise_id: string;
  exercise_name: string;
  set_number: number;
  weight: number;
  reps: number;
  rpe: number | null;
  unit: string;
  completed_at: string | null;
};

class BackupService {
  async exportJsonBackup(): Promise<BackupExportResult> {
    const payload = await this.createBackupPayload();
    const exportedAt = new Date(payload.exportedAt);
    const fileName = `ironlog-backup-${toTimestampFilePart(exportedAt)}.json`;
    const fileUri = await writeTextFile(fileName, JSON.stringify(payload, null, 2));
    return { fileUri, fileName };
  }

  async exportCsvAnalytics(): Promise<BackupExportResult> {
    const db = await getDatabase();
    const rows = await db.getAllAsync<CsvRow>(
      `SELECT
        workouts.id AS workout_id,
        workouts.title_snapshot AS workout_title,
        workouts.started_at,
        workouts.finished_at,
        workout_exercises.exercise_id,
        workout_exercises.display_name AS exercise_name,
        workout_sets.set_number,
        workout_sets.weight,
        workout_sets.reps,
        workout_sets.rpe,
        workout_sets.unit,
        workout_sets.completed_at
      FROM workouts
      INNER JOIN workout_exercises
        ON workout_exercises.workout_id = workouts.id
      INNER JOIN workout_sets
        ON workout_sets.workout_exercise_id = workout_exercises.id
      WHERE workouts.status = 'completed'
      ORDER BY workouts.finished_at DESC, workout_exercises.sort_order ASC, workout_sets.set_number ASC`,
    );

    const header = [
      "workout_id",
      "workout_title",
      "started_at",
      "finished_at",
      "exercise_id",
      "exercise_name",
      "set_number",
      "weight",
      "reps",
      "rpe",
      "unit",
      "volume",
      "completed_at",
    ];

    const lines = rows.map((row) =>
      toCsvLine([
        row.workout_id,
        row.workout_title ?? "",
        row.started_at,
        row.finished_at ?? "",
        row.exercise_id,
        row.exercise_name,
        String(row.set_number),
        String(row.weight),
        String(row.reps),
        row.rpe === null ? "" : String(row.rpe),
        row.unit,
        String(row.weight * row.reps),
        row.completed_at ?? "",
      ]),
    );

    const csvContent = [toCsvLine(header), ...lines].join("\n");
    const fileName = `ironlog-analytics-${toTimestampFilePart(new Date())}.csv`;
    const fileUri = await writeTextFile(fileName, csvContent);
    return { fileUri, fileName };
  }

  async shareFile(fileUri: string): Promise<void> {
    const isAvailable = await Sharing.isAvailableAsync();
    if (!isAvailable) {
      throw new Error("Share tidak tersedia di device ini.");
    }
    await Sharing.shareAsync(fileUri);
  }

  async pickAndParseJsonBackup(): Promise<ParsedBackupFile | null> {
    const picked = await DocumentPicker.getDocumentAsync({
      type: "*/*",
      copyToCacheDirectory: true,
      multiple: false,
    });

    if (picked.canceled || !picked.assets?.[0]) {
      return null;
    }

    const asset = picked.assets[0];
    const rawText = await FileSystem.readAsStringAsync(asset.uri);
    let parsed: unknown;

    try {
      parsed = JSON.parse(rawText);
    } catch {
      throw new Error("File JSON tidak valid.");
    }

    const payload = validateBackupPayload(parsed);
    return {
      payload,
      sourceName: asset.name ?? "backup.json",
    };
  }

  async restoreFromBackup(payload: IronLogBackupPayload): Promise<void> {
    const db = await getDatabase();
    const normalized = normalizeBackupPayload(payload);

    await db.withTransactionAsync(async () => {
      for (const tableName of getDeleteOrder()) {
        await db.execAsync(`DELETE FROM ${tableName}`);
      }

      await restoreAppSettings(db, normalized.data.app_settings);
      await restoreExercises(db, normalized.data.exercises);
      await restoreRoutines(db, normalized.data.routines);
      await restoreRoutineExercises(db, normalized.data.routine_exercises);
      await restoreWorkouts(db, normalized.data.workouts);
      await restoreWorkoutExercises(db, normalized.data.workout_exercises);
      await restoreWorkoutSets(db, normalized.data.workout_sets);
      await restoreBodyMetrics(db, normalized.data.body_metrics);
      await restoreExerciseStats(db, normalized.data.exercise_stats);
    });

    appSettingsService.clearCache();
    await appSettingsService.refresh();
    await analyticsService.rebuildExerciseStats();
  }

  private async createBackupPayload(): Promise<IronLogBackupPayload> {
    const db = await getDatabase();
    const dataEntries = await Promise.all(
      TABLE_NAMES.map(async (tableName) => {
        const rows = await db.getAllAsync<Record<string, unknown>>(
          `SELECT * FROM ${tableName}`,
        );
        return [tableName, rows] as const;
      }),
    );

    const data = Object.fromEntries(dataEntries) as IronLogBackupPayload["data"];

    return {
      format: "ironlog-backup",
      schemaVersion: BACKUP_SCHEMA_VERSION,
      exportedAt: nowIsoTimestamp(),
      data,
    };
  }
}

export const backupService = new BackupService();

function getDeleteOrder(): TableName[] {
  return [
    "workout_sets",
    "workout_exercises",
    "workouts",
    "routine_exercises",
    "exercise_stats",
    "body_metrics",
    "routines",
    "app_settings",
    "exercises",
  ];
}

async function writeTextFile(
  fileName: string,
  content: string,
): Promise<string> {
  const baseDirectory = FileSystem.documentDirectory ?? FileSystem.cacheDirectory;
  if (!baseDirectory) {
    throw new Error("Directory lokal tidak tersedia untuk menyimpan file backup.");
  }

  const folderUri = `${baseDirectory}${BACKUP_FOLDER_NAME}`;
  const folderInfo = await FileSystem.getInfoAsync(folderUri);
  if (!folderInfo.exists) {
    await FileSystem.makeDirectoryAsync(folderUri, { intermediates: true });
  }

  const fileUri = `${folderUri}/${fileName}`;
  await FileSystem.writeAsStringAsync(fileUri, content);
  return fileUri;
}

function toTimestampFilePart(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");
  return `${year}${month}${day}-${hours}${minutes}${seconds}`;
}

function toCsvLine(fields: string[]): string {
  return fields
    .map((field) => {
      if (field.includes(",") || field.includes('"') || field.includes("\n")) {
        return `"${field.replace(/"/g, '""')}"`;
      }
      return field;
    })
    .join(",");
}

function validateBackupPayload(raw: unknown): IronLogBackupPayload {
  if (!isObjectRecord(raw)) {
    throw new Error("Struktur backup tidak valid.");
  }

  if (raw.format !== "ironlog-backup") {
    throw new Error("Format backup tidak dikenali.");
  }

  if (typeof raw.schemaVersion !== "number") {
    throw new Error("Schema version backup tidak valid.");
  }

  if (raw.schemaVersion !== BACKUP_SCHEMA_VERSION) {
    throw new Error(
      `Backup schema version ${String(raw.schemaVersion)} tidak didukung oleh versi app ini.`,
    );
  }

  if (typeof raw.exportedAt !== "string") {
    throw new Error("Timestamp backup tidak valid.");
  }

  if (!isObjectRecord(raw.data)) {
    throw new Error("Data backup tidak valid.");
  }

  for (const tableName of TABLE_NAMES) {
    if (!Array.isArray(raw.data[tableName])) {
      throw new Error(`Data table "${tableName}" tidak ditemukan di backup.`);
    }
  }

  return raw as IronLogBackupPayload;
}

function normalizeBackupPayload(payload: IronLogBackupPayload): IronLogBackupPayload {
  const clone: IronLogBackupPayload = JSON.parse(JSON.stringify(payload));

  clone.data.app_settings = clone.data.app_settings.filter(
    (row) => isObjectRecord(row) && Number(row.id) === 1,
  );

  if (clone.data.app_settings.length === 0) {
    clone.data.app_settings = [
      {
        id: 1,
        preferred_unit: "kg",
        one_rm_formula: "brzycki",
        haptics_enabled: 1,
        auto_start_rest_timer: 1,
        updated_at: nowIsoTimestamp(),
      },
    ];
  }

  return clone;
}

async function restoreAppSettings(
  db: Awaited<ReturnType<typeof getDatabase>>,
  rows: Record<string, unknown>[],
): Promise<void> {
  for (const raw of rows) {
    if (!isObjectRecord(raw)) {
      continue;
    }

    await db.runAsync(
      `INSERT INTO app_settings (
        id,
        preferred_unit,
        one_rm_formula,
        haptics_enabled,
        auto_start_rest_timer,
        updated_at
      ) VALUES (?, ?, ?, ?, ?, ?)`,
      Number(raw.id ?? 1),
      String(raw.preferred_unit ?? "kg"),
      String(raw.one_rm_formula ?? "brzycki"),
      Number(raw.haptics_enabled ?? 1),
      Number(raw.auto_start_rest_timer ?? 1),
      String(raw.updated_at ?? nowIsoTimestamp()),
    );
  }
}

async function restoreExercises(
  db: Awaited<ReturnType<typeof getDatabase>>,
  rows: Record<string, unknown>[],
): Promise<void> {
  for (const raw of rows) {
    if (!isObjectRecord(raw)) {
      continue;
    }

    await db.runAsync(
      `INSERT INTO exercises (
        id,
        name,
        muscle_group,
        equipment_type,
        is_favorite,
        is_custom
      )
      VALUES (?, ?, ?, ?, ?, ?)`,
      String(raw.id),
      String(raw.name ?? ""),
      String(raw.muscle_group ?? ""),
      String(raw.equipment_type ?? ""),
      Number(raw.is_favorite ?? 0),
      Number(raw.is_custom ?? 0),
    );
  }
}

async function restoreRoutines(
  db: Awaited<ReturnType<typeof getDatabase>>,
  rows: Record<string, unknown>[],
): Promise<void> {
  for (const raw of rows) {
    if (!isObjectRecord(raw)) {
      continue;
    }

    await db.runAsync(
      `INSERT INTO routines (id, name, description, is_archived, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?)`,
      String(raw.id),
      String(raw.name ?? ""),
      String(raw.description ?? ""),
      Number(raw.is_archived ?? 0),
      String(raw.created_at ?? nowIsoTimestamp()),
      String(raw.updated_at ?? nowIsoTimestamp()),
    );
  }
}

async function restoreRoutineExercises(
  db: Awaited<ReturnType<typeof getDatabase>>,
  rows: Record<string, unknown>[],
): Promise<void> {
  for (const raw of rows) {
    if (!isObjectRecord(raw)) {
      continue;
    }

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
      String(raw.id),
      String(raw.routine_id),
      String(raw.exercise_id),
      Number(raw.sort_order ?? 0),
      Number(raw.rest_time_seconds ?? 90),
      String(raw.created_at ?? nowIsoTimestamp()),
      String(raw.updated_at ?? nowIsoTimestamp()),
    );
  }
}

async function restoreWorkouts(
  db: Awaited<ReturnType<typeof getDatabase>>,
  rows: Record<string, unknown>[],
): Promise<void> {
  for (const raw of rows) {
    if (!isObjectRecord(raw)) {
      continue;
    }

    const routineId =
      raw.routine_id === null ||
      raw.routine_id === undefined ||
      String(raw.routine_id).trim() === ""
        ? null
        : String(raw.routine_id);

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
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      String(raw.id),
      routineId,
      String(raw.source_type ?? "routine"),
      String(raw.status ?? "completed"),
      raw.title_snapshot === null || raw.title_snapshot === undefined
        ? null
        : String(raw.title_snapshot),
      String(raw.started_at ?? nowIsoTimestamp()),
      raw.finished_at === null || raw.finished_at === undefined
        ? null
        : String(raw.finished_at),
      String(raw.created_at ?? nowIsoTimestamp()),
      String(raw.updated_at ?? nowIsoTimestamp()),
    );
  }
}

async function restoreWorkoutExercises(
  db: Awaited<ReturnType<typeof getDatabase>>,
  rows: Record<string, unknown>[],
): Promise<void> {
  for (const raw of rows) {
    if (!isObjectRecord(raw)) {
      continue;
    }

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
      String(raw.id),
      String(raw.workout_id),
      raw.routine_exercise_id === null || raw.routine_exercise_id === undefined
        ? null
        : String(raw.routine_exercise_id),
      String(raw.exercise_id),
      String(raw.display_name ?? ""),
      Number(raw.sort_order ?? 0),
      Number(raw.rest_time_seconds ?? 90),
      String(raw.created_at ?? nowIsoTimestamp()),
      String(raw.updated_at ?? nowIsoTimestamp()),
    );
  }
}

async function restoreWorkoutSets(
  db: Awaited<ReturnType<typeof getDatabase>>,
  rows: Record<string, unknown>[],
): Promise<void> {
  for (const raw of rows) {
    if (!isObjectRecord(raw)) {
      continue;
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
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      String(raw.id),
      String(raw.workout_exercise_id),
      Number(raw.set_number ?? 1),
      Number(raw.weight ?? 0),
      Number(raw.reps ?? 0),
      raw.rpe === null || raw.rpe === undefined ? null : Number(raw.rpe),
      String(raw.unit ?? "kg"),
      Number(raw.is_completed ?? 1),
      raw.completed_at === null || raw.completed_at === undefined
        ? null
        : String(raw.completed_at),
      String(raw.created_at ?? nowIsoTimestamp()),
      String(raw.updated_at ?? nowIsoTimestamp()),
    );
  }
}

async function restoreBodyMetrics(
  db: Awaited<ReturnType<typeof getDatabase>>,
  rows: Record<string, unknown>[],
): Promise<void> {
  for (const raw of rows) {
    if (!isObjectRecord(raw)) {
      continue;
    }

    await db.runAsync(
      `INSERT INTO body_metrics (
        id,
        weight,
        body_fat_percentage,
        recorded_at,
        created_at,
        updated_at
      ) VALUES (?, ?, ?, ?, ?, ?)`,
      String(raw.id),
      Number(raw.weight ?? 0),
      raw.body_fat_percentage === null || raw.body_fat_percentage === undefined
        ? null
        : Number(raw.body_fat_percentage),
      String(raw.recorded_at ?? nowIsoTimestamp()),
      String(raw.created_at ?? nowIsoTimestamp()),
      String(raw.updated_at ?? nowIsoTimestamp()),
    );
  }
}

async function restoreExerciseStats(
  db: Awaited<ReturnType<typeof getDatabase>>,
  rows: Record<string, unknown>[],
): Promise<void> {
  for (const raw of rows) {
    if (!isObjectRecord(raw)) {
      continue;
    }

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
      String(raw.exercise_id),
      Number(raw.best_1rm ?? 0),
      Number(raw.best_volume ?? 0),
      Number(raw.best_weight ?? 0),
      Number(raw.total_sessions ?? 0),
      raw.last_performed === null || raw.last_performed === undefined
        ? null
        : String(raw.last_performed),
      String(raw.updated_at ?? nowIsoTimestamp()),
    );
  }
}

function isObjectRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function getBackupWarningText(): string {
  return `${APP_NAME} restore akan mengganti seluruh data lokal saat ini dengan isi backup terpilih.`;
}
