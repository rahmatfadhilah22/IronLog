import type { SQLiteDatabase } from "expo-sqlite";

import { nowIsoTimestamp } from "../../core/utils/time";
import type {
  AppSettings,
  AppSettingsUpdate,
  OneRmFormula,
  PreferredUnit,
} from "../../types/settings";

const SETTINGS_ID = 1;

type AppSettingsRow = {
  id: 1;
  preferred_unit: PreferredUnit;
  one_rm_formula: OneRmFormula;
  haptics_enabled: 0 | 1;
  auto_start_rest_timer: 0 | 1;
  updated_at: string;
};

export async function ensureAppSettingsRow(
  db: SQLiteDatabase,
): Promise<void> {
  await db.runAsync(
    `INSERT INTO app_settings (
      id,
      preferred_unit,
      one_rm_formula,
      haptics_enabled,
      auto_start_rest_timer,
      updated_at
    ) VALUES (?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO NOTHING`,
    SETTINGS_ID,
    "kg",
    "brzycki",
    1,
    1,
    nowIsoTimestamp(),
  );
}

export async function getAppSettings(db: SQLiteDatabase): Promise<AppSettings> {
  const row = await db.getFirstAsync<AppSettingsRow>(
    `SELECT
      id,
      preferred_unit,
      one_rm_formula,
      haptics_enabled,
      auto_start_rest_timer,
      updated_at
    FROM app_settings
    WHERE id = ?`,
    SETTINGS_ID,
  );

  if (!row) {
    await ensureAppSettingsRow(db);
    return getAppSettings(db);
  }

  return mapRow(row);
}

export async function updateAppSettings(
  db: SQLiteDatabase,
  update: AppSettingsUpdate,
): Promise<AppSettings> {
  const current = await getAppSettings(db);

  const next: AppSettings = {
    ...current,
    ...update,
    updatedAt: nowIsoTimestamp(),
  };

  await db.runAsync(
    `UPDATE app_settings
    SET preferred_unit = ?, one_rm_formula = ?, haptics_enabled = ?, auto_start_rest_timer = ?, updated_at = ?
    WHERE id = ?`,
    next.preferredUnit,
    next.oneRmFormula,
    next.hapticsEnabled ? 1 : 0,
    next.autoStartRestTimer ? 1 : 0,
    next.updatedAt,
    SETTINGS_ID,
  );

  return next;
}

function mapRow(row: AppSettingsRow): AppSettings {
  return {
    id: 1,
    preferredUnit: row.preferred_unit,
    oneRmFormula: row.one_rm_formula,
    hapticsEnabled: row.haptics_enabled === 1,
    autoStartRestTimer: row.auto_start_rest_timer === 1,
    updatedAt: row.updated_at,
  };
}
