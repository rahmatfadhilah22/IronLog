export type PreferredUnit = "kg" | "lb";
export type OneRmFormula = "brzycki" | "epley";

export type AppSettings = {
  id: 1;
  preferredUnit: PreferredUnit;
  oneRmFormula: OneRmFormula;
  hapticsEnabled: boolean;
  autoStartRestTimer: boolean;
  updatedAt: string;
};

export type AppSettingsUpdate = Partial<
  Pick<
    AppSettings,
    "preferredUnit" | "oneRmFormula" | "hapticsEnabled" | "autoStartRestTimer"
  >
>;
