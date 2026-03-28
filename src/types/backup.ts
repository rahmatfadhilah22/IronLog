export type BackupTableData = {
  app_settings: Record<string, unknown>[];
  exercises: Record<string, unknown>[];
  routines: Record<string, unknown>[];
  routine_exercises: Record<string, unknown>[];
  workouts: Record<string, unknown>[];
  workout_exercises: Record<string, unknown>[];
  workout_sets: Record<string, unknown>[];
  body_metrics: Record<string, unknown>[];
  exercise_stats: Record<string, unknown>[];
};

export type IronLogBackupPayload = {
  format: "ironlog-backup";
  schemaVersion: number;
  exportedAt: string;
  data: BackupTableData;
};

export type BackupExportResult = {
  fileUri: string;
  fileName: string;
};

export type ParsedBackupFile = {
  payload: IronLogBackupPayload;
  sourceName: string;
};
