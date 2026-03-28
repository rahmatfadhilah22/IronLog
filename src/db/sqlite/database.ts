import { Platform } from "react-native";
import { openDatabaseAsync, type SQLiteDatabase } from "expo-sqlite";

import { DATABASE_NAME } from "../../core/constants/app";
import { runMigrations } from "../migrations/runner";
import { ensureAppSettingsRow } from "../repositories/app-settings-repository";
import { seedExercisesIfEmpty } from "../repositories/exercise-repository";

let databasePromise: Promise<SQLiteDatabase> | null = null;
const BOOTSTRAP_TIMEOUT_MS = 15000;

export async function getDatabase(): Promise<SQLiteDatabase> {
  if (!databasePromise) {
    databasePromise = initializeDatabase().catch((error: unknown) => {
      databasePromise = null;
      throw error;
    });
  }

  return databasePromise;
}

export function resetDatabaseInstance(): void {
  databasePromise = null;
}

async function initializeDatabase(): Promise<SQLiteDatabase> {
  const db = await runBootstrapStep("openDatabase", () =>
    openDatabaseAsync(DATABASE_NAME),
  );

  await runBootstrapStep("enableForeignKeys", () =>
    db.execAsync("PRAGMA foreign_keys = ON"),
  );

  if (Platform.OS !== "web") {
    try {
      await runBootstrapStep("enableWalMode", () =>
        db.execAsync("PRAGMA journal_mode = WAL"),
      );
    } catch (error) {
      console.warn("[sqlite] Unable to enable WAL mode; continuing without it.", error);
    }
  } else {
    console.info("[sqlite] Skipping WAL mode on web.");
  }

  await runBootstrapStep("runMigrations", () => runMigrations(db));
  await runBootstrapStep("ensureAppSettingsRow", () => ensureAppSettingsRow(db));
  await runBootstrapStep("seedExercisesIfEmpty", () => seedExercisesIfEmpty(db));

  return db;
}

async function runBootstrapStep<T>(
  stepName: string,
  operation: () => Promise<T>,
): Promise<T> {
  console.info(`[sqlite] ${stepName}:start`);

  try {
    const result = await withTimeout(operation(), stepName);
    console.info(`[sqlite] ${stepName}:success`);
    return result;
  } catch (error) {
    console.error(`[sqlite] ${stepName}:error`, error);
    throw error;
  }
}

function withTimeout<T>(promise: Promise<T>, stepName: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      reject(
        new Error(
          `Database bootstrap timed out during "${stepName}" after ${BOOTSTRAP_TIMEOUT_MS}ms.`,
        ),
      );
    }, BOOTSTRAP_TIMEOUT_MS);

    promise
      .then((value) => {
        clearTimeout(timeoutId);
        resolve(value);
      })
      .catch((error: unknown) => {
        clearTimeout(timeoutId);
        reject(error);
      });
  });
}
