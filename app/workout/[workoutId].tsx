import { useLocalSearchParams } from "expo-router";

import { StagePlaceholderScreen } from "../../src/components";

export default function ActiveWorkoutScreen() {
  const { workoutId } = useLocalSearchParams<{ workoutId: string }>();

  return (
    <StagePlaceholderScreen
      title="Active Workout Placeholder"
      description={`route param workoutId: ${workoutId ?? "-"}`}
    />
  );
}
