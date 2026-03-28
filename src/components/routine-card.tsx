import { Pressable, StyleSheet, Text, View } from "react-native";

import { themeTokens } from "../core/theme";
import type { RoutineSummary } from "../types/routine";

type RoutineCardProps = {
  routine: RoutineSummary;
  onPress: (routineId: string) => void;
};

export function RoutineCard({ routine, onPress }: RoutineCardProps) {
  return (
    <Pressable
      onPress={() => {
        onPress(routine.id);
      }}
      style={({ pressed }) => [styles.card, pressed ? styles.cardPressed : null]}
    >
      <View style={styles.topRow}>
        <Text style={styles.title}>{routine.name}</Text>
        <Text style={styles.count}>{routine.exerciseCount} EX</Text>
      </View>
      {routine.description ? (
        <Text style={styles.description}>{routine.description}</Text>
      ) : (
        <Text style={styles.descriptionMuted}>No description</Text>
      )}
      <Text style={styles.meta}>
        UPDATED {new Date(routine.updatedAt).toLocaleDateString()}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: themeTokens.colors.surfaceLow,
    borderRadius: themeTokens.radius.sm,
    padding: themeTokens.spacing.lg,
    gap: themeTokens.spacing.sm,
  },
  cardPressed: {
    backgroundColor: themeTokens.colors.surfaceHigh,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: themeTokens.spacing.md,
  },
  title: {
    flex: 1,
    color: themeTokens.colors.textPrimary,
    fontSize: 20,
    lineHeight: 24,
    fontWeight: "700",
    letterSpacing: 0.2,
    textTransform: "uppercase",
  },
  count: {
    color: themeTokens.colors.accentPrimary,
    fontWeight: "700",
    fontSize: 11,
    letterSpacing: 1,
  },
  description: {
    color: themeTokens.colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
  },
  descriptionMuted: {
    color: themeTokens.colors.textSecondary,
    opacity: 0.6,
    fontSize: 14,
    lineHeight: 20,
  },
  meta: {
    color: themeTokens.colors.textSecondary,
    opacity: 0.8,
    fontSize: 11,
    letterSpacing: 1,
    fontWeight: "700",
  },
});
