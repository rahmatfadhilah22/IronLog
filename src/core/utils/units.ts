import type { PreferredUnit } from "../../types/settings";

const LB_TO_KG = 0.45359237;
const KG_TO_LB = 2.2046226218;

export function convertWeight(
  value: number,
  fromUnit: PreferredUnit,
  toUnit: PreferredUnit,
): number {
  if (!Number.isFinite(value)) {
    return 0;
  }

  if (fromUnit === toUnit) {
    return value;
  }

  return fromUnit === "kg" ? value * KG_TO_LB : value * LB_TO_KG;
}

export function convertVolume(
  value: number,
  fromUnit: PreferredUnit,
  toUnit: PreferredUnit,
): number {
  return convertWeight(value, fromUnit, toUnit);
}
