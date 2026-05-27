import {
  getCompletedSetCount,
  getCompletedWorkoutCount,
  getCompletedWorkoutDatesByMonth,
  getExerciseProgressDetailById,
  getProgressTrackedExerciseCount,
  listProgressExerciseSummaries,
  listTopLiftSummaries,
  rebuildExerciseStatsCache,
} from "../../db/repositories";
import { getDatabase } from "../../db/sqlite";
import type {
  ExerciseProgressDetail,
  ProgressOverview,
  ProgressRange,
} from "../../types/progress";
import { appSettingsService } from "../settings";

class AnalyticsService {
  async rebuildExerciseStats(): Promise<number> {
    const db = await getDatabase();
    const settings = await appSettingsService.get();
    return rebuildExerciseStatsCache(
      db,
      settings.preferredUnit,
      settings.oneRmFormula,
    );
  }

  async getProgressOverview(search?: string): Promise<ProgressOverview> {
    const db = await getDatabase();
    const settings = await appSettingsService.get();

    // Fire-and-forget: rebuild cache in background so reads can start immediately.
    // Reads are not blocked by a stale cache — fresh data will be picked up on next visit.
    void this.rebuildExerciseStats();

    const [trackedExerciseCount, completedWorkoutCount, totalCompletedSets, topLifts, exercises] =
      await Promise.all([
        getProgressTrackedExerciseCount(db),
        getCompletedWorkoutCount(db),
        getCompletedSetCount(db),
        listTopLiftSummaries(db, 5),
        listProgressExerciseSummaries(db, search, 120),
      ]);

    return {
      preferredUnit: settings.preferredUnit,
      oneRmFormula: settings.oneRmFormula,
      trackedExerciseCount,
      completedWorkoutCount,
      totalCompletedSets,
      topLifts,
      exercises,
    };
  }

  async getExerciseProgressDetail(
    exerciseId: string,
    range: ProgressRange,
  ): Promise<ExerciseProgressDetail | null> {
    const db = await getDatabase();
    const settings = await appSettingsService.get();

    // Fire-and-forget: rebuild in background.
    void this.rebuildExerciseStats();

    return getExerciseProgressDetailById(
      db,
      exerciseId,
      settings.preferredUnit,
      settings.oneRmFormula,
      range,
    );
  }

  async getWorkoutCalendarByMonth(
    month: number,
    year: number,
  ): Promise<{ date: string }[]> {
    const db = await getDatabase();
    return getCompletedWorkoutDatesByMonth(db, month, year);
  }
}

export const analyticsService = new AnalyticsService();
