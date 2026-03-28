import {
  getAppSettings,
  updateAppSettings,
} from "../../db/repositories/app-settings-repository";
import { getDatabase } from "../../db/sqlite/database";
import type { AppSettings, AppSettingsUpdate } from "../../types/settings";

class AppSettingsService {
  private cache: AppSettings | null = null;

  async get(): Promise<AppSettings> {
    if (this.cache) {
      return this.cache;
    }

    const db = await getDatabase();
    const settings = await getAppSettings(db);
    this.cache = settings;

    return settings;
  }

  async refresh(): Promise<AppSettings> {
    const db = await getDatabase();
    const settings = await getAppSettings(db);
    this.cache = settings;

    return settings;
  }

  async update(update: AppSettingsUpdate): Promise<AppSettings> {
    const db = await getDatabase();
    const settings = await updateAppSettings(db, update);
    this.cache = settings;

    return settings;
  }

  clearCache(): void {
    this.cache = null;
  }
}

export const appSettingsService = new AppSettingsService();
