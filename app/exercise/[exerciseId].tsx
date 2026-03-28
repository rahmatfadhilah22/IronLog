import { useLocalSearchParams } from "expo-router";

import { StagePlaceholderScreen } from "../../src/components";

export default function ExerciseProgressScreen() {
  const { exerciseId } = useLocalSearchParams<{ exerciseId: string }>();

  return (
    <StagePlaceholderScreen
      title="Exercise Progress Placeholder"
      description={`route param exerciseId: ${exerciseId ?? "-"}`}
    />
  );
}
