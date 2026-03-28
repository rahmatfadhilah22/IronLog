export type BodyMetricEntry = {
  id: string;
  weight: number;
  bodyFatPercentage: number | null;
  recordedAt: string;
  createdAt: string;
  updatedAt: string;
};

export type BodyMetricCreateInput = {
  weight: number;
  bodyFatPercentage?: number | null;
  recordedAt?: string;
};
