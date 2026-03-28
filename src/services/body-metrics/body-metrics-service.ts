import {
  createBodyMetric,
  getLatestBodyMetric,
  listBodyMetrics,
} from "../../db/repositories";
import { convertWeight } from "../../core/utils";
import { getDatabase } from "../../db/sqlite";
import type { BodyMetricCreateInput, BodyMetricEntry } from "../../types/body-metrics";
import type { PreferredUnit } from "../../types/settings";
import { appSettingsService } from "../settings";

class BodyMetricsService {
  async addMetric(input: BodyMetricCreateInput): Promise<string> {
    const db = await getDatabase();
    const settings = await appSettingsService.get();
    const payload = sanitizeCreateInput(input, settings.preferredUnit);
    return createBodyMetric(db, payload);
  }

  async listMetrics(limit?: number): Promise<BodyMetricEntry[]> {
    const db = await getDatabase();
    const settings = await appSettingsService.get();
    const metrics = await listBodyMetrics(db, limit ?? 60);
    return metrics.map((entry) => mapMetricToPreferredUnit(entry, settings.preferredUnit));
  }

  async getLatestMetric(): Promise<BodyMetricEntry | null> {
    const db = await getDatabase();
    const settings = await appSettingsService.get();
    const entry = await getLatestBodyMetric(db);
    return entry ? mapMetricToPreferredUnit(entry, settings.preferredUnit) : null;
  }
}

export const bodyMetricsService = new BodyMetricsService();

function sanitizeCreateInput(
  input: BodyMetricCreateInput,
  preferredUnit: PreferredUnit,
): BodyMetricCreateInput {
  const weight = convertWeight(Math.max(0, input.weight), preferredUnit, "kg");

  let bodyFatPercentage: number | null | undefined = null;
  if (input.bodyFatPercentage !== null && input.bodyFatPercentage !== undefined) {
    const clamped = Math.max(0, Math.min(100, input.bodyFatPercentage));
    bodyFatPercentage = Math.round(clamped * 100) / 100;
  }

  return {
    weight: Math.round(weight * 100) / 100,
    bodyFatPercentage,
    recordedAt: input.recordedAt,
  };
}

function mapMetricToPreferredUnit(
  entry: BodyMetricEntry,
  preferredUnit: PreferredUnit,
): BodyMetricEntry {
  return {
    ...entry,
    weight: Math.round(convertWeight(entry.weight, "kg", preferredUnit) * 100) / 100,
  };
}
