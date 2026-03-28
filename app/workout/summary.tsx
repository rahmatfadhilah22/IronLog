import { useLocalSearchParams, useRouter } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { themeTokens } from "../../src/core/theme";
import { WorkoutSummaryScreen } from "../../src/features/workouts";

export default function WorkoutSummaryRoute() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    workoutId?: string | string[];
  }>();
  const workoutId = asFirstString(params.workoutId);

  if (!workoutId) {
    return (
      <View style={styles.stateContainer}>
        <Text style={styles.errorText}>Workout ID tidak tersedia.</Text>
        <Pressable
          style={styles.backButton}
          onPress={() => {
            router.replace("/(tabs)");
          }}
        >
          <Text style={styles.backLabel}>Back To Home</Text>
        </Pressable>
      </View>
    );
  }

  return <WorkoutSummaryScreen workoutId={workoutId} />;
}

function asFirstString(value?: string | string[]): string | undefined {
  if (!value) {
    return undefined;
  }

  return Array.isArray(value) ? value[0] : value;
}

const styles = StyleSheet.create({
  stateContainer: {
    flex: 1,
    backgroundColor: themeTokens.colors.background,
    alignItems: "center",
    justifyContent: "center",
    gap: themeTokens.spacing.md,
    paddingHorizontal: themeTokens.spacing.lg,
  },
  errorText: {
    color: themeTokens.colors.danger,
    fontSize: 14,
    fontWeight: "700",
  },
  backButton: {
    minHeight: 44,
    backgroundColor: themeTokens.colors.accentPrimary,
    borderRadius: themeTokens.radius.sm,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: themeTokens.spacing.lg,
  },
  backLabel: {
    color: themeTokens.colors.backgroundDeep,
    fontWeight: "800",
    textTransform: "uppercase",
    fontSize: 12,
    letterSpacing: 0.8,
  },
});
