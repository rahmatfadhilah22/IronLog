import { getDatabase, resetDatabaseInstance } from "./database";

let bootstrapPromise: Promise<void> | null = null;

export function bootstrapDatabase(): Promise<void> {
  if (!bootstrapPromise) {
    bootstrapPromise = runBootstrap().catch((error: unknown) => {
      bootstrapPromise = null;
      throw error;
    });
  }

  return bootstrapPromise;
}

async function runBootstrap(): Promise<void> {
  await getDatabase();
}

export function retryBootstrapDatabase(): Promise<void> {
  bootstrapPromise = null;
  resetDatabaseInstance();
  return bootstrapDatabase();
}
