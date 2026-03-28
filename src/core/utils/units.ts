import type { OneRmFormula, PreferredUnit } from "../../types/settings";

const KG_TO_LB_FACTOR = 2.2046226218;

export function convertWeight(
  weight: number,
  fromUnit: PreferredUnit,
  toUnit: PreferredUnit,
): number {
  if (!Number.isFinite(weight)) {
    return 0;
  }

  if (fromUnit === toUnit) {
    return weight;
  }

  if (fromUnit === "kg" && toUnit === "lb") {
    return weight * KG_TO_LB_FACTOR;
  }

  return weight / KG_TO_LB_FACTOR;
}

export function estimateOneRm(
  weight: number,
  reps: number,
  formula: OneRmFormula,
): number {
  if (!Number.isFinite(weight) || weight <= 0) {
    return 0;
  }

  if (!Number.isFinite(reps) || reps <= 1) {
    return weight;
  }

  if (formula === "epley") {
    return weight * (1 + reps / 30);
  }

  if (reps >= 37) {
    return weight;
  }

  return (weight * 36) / (37 - reps);
}
