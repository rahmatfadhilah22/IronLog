import type { SQLiteDatabase } from "expo-sqlite";

import { createId, nowIsoTimestamp } from "../../core/utils";
import type { BodyMetricCreateInput, BodyMetricEntry } from "../../types/body-metrics";

type BodyMetricRow = {
  id: string;
  weight: number;
  body_fat_percentage: number | null;
  recorded_at: string;
  created_at: string;
  updated_at: string;
};

export async function createBodyMetric(
  db: SQLiteDatabase,
  input: BodyMetricCreateInput,
): Promise<string> {
  const metricId = createId();
  const now = nowIsoTimestamp();
  const recordedAt = input.recordedAt ?? now;

  await db.runAsync(
    `INSERT INTO body_metrics (
      id,
      weight,
      body_fat_percentage,
      recorded_at,
      created_at,
      updated_at
    ) VALUES (?, ?, ?, ?, ?, ?)`,
    metricId,
    input.weight,
    input.bodyFatPercentage ?? null,
    recordedAt,
    now,
    now,
  );

  return metricId;
}

export async function listBodyMetrics(
  db: SQLiteDatabase,
  limit = 60,
): Promise<BodyMetricEntry[]> {
  const rows = await db.getAllAsync<BodyMetricRow>(
    `SELECT
      id,
      weight,
      body_fat_percentage,
      recorded_at,
      created_at,
      updated_at
    FROM body_metrics
    ORDER BY recorded_at DESC, created_at DESC
    LIMIT ?`,
    limit,
  );

  return rows.map(mapBodyMetricRow);
}

export async function getLatestBodyMetric(
  db: SQLiteDatabase,
): Promise<BodyMetricEntry | null> {
  const row = await db.getFirstAsync<BodyMetricRow>(
    `SELECT
      id,
      weight,
      body_fat_percentage,
      recorded_at,
      created_at,
      updated_at
    FROM body_metrics
    ORDER BY recorded_at DESC, created_at DESC
    LIMIT 1`,
  );

  if (!row) {
    return null;
  }

  return mapBodyMetricRow(row);
}

function mapBodyMetricRow(row: BodyMetricRow): BodyMetricEntry {
  return {
    id: row.id,
    weight: row.weight,
    bodyFatPercentage: row.body_fat_percentage,
    recordedAt: row.recorded_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
