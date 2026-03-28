import { Pressable, StyleSheet, Text, View } from "react-native";

import { themeTokens } from "../core/theme";

type EmptyStateProps = {
  title: string;
  description: string;
  actionLabel: string;
  onPress: () => void;
};

export function EmptyState({
  title,
  description,
  actionLabel,
  onPress,
}: EmptyStateProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>
      <Pressable style={styles.action} onPress={onPress}>
        <Text style={styles.actionLabel}>{actionLabel}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: themeTokens.colors.surfaceLow,
    borderRadius: themeTokens.radius.md,
    padding: themeTokens.spacing.xl,
    gap: themeTokens.spacing.md,
    alignItems: "flex-start",
  },
  title: {
    color: themeTokens.colors.textPrimary,
    fontSize: 22,
    lineHeight: 28,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  description: {
    color: themeTokens.colors.textSecondary,
    fontSize: themeTokens.typography.body.fontSize,
    lineHeight: themeTokens.typography.body.lineHeight,
  },
  action: {
    backgroundColor: themeTokens.colors.accentPrimary,
    borderRadius: themeTokens.radius.sm,
    paddingHorizontal: themeTokens.spacing.lg,
    paddingVertical: themeTokens.spacing.sm,
  },
  actionLabel: {
    color: themeTokens.colors.backgroundDeep,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    fontSize: 12,
  },
});
