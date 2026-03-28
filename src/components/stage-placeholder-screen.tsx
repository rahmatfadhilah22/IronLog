import { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";

import { themeTokens } from "../core/theme";

type StagePlaceholderScreenProps = {
  title: string;
  description: string;
  children?: ReactNode;
};

export function StagePlaceholderScreen({
  title,
  description,
  children,
}: StagePlaceholderScreenProps) {
  return (
    <View style={styles.container}>
      <View style={styles.panel}>
        <Text style={styles.label}>STAGE 1 FOUNDATION</Text>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.description}>{description}</Text>
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: themeTokens.colors.background,
    padding: themeTokens.spacing.lg,
    gap: themeTokens.spacing.lg,
  },
  panel: {
    backgroundColor: themeTokens.colors.surfaceLow,
    borderRadius: themeTokens.radius.md,
    padding: themeTokens.spacing.lg,
    gap: themeTokens.spacing.sm,
  },
  label: {
    color: themeTokens.colors.accentPrimary,
    fontSize: themeTokens.typography.label.fontSize,
    lineHeight: themeTokens.typography.label.lineHeight,
    letterSpacing: themeTokens.typography.label.letterSpacing,
    fontWeight: "700",
  },
  title: {
    color: themeTokens.colors.textPrimary,
    fontSize: themeTokens.typography.title.fontSize,
    lineHeight: themeTokens.typography.title.lineHeight,
    letterSpacing: themeTokens.typography.title.letterSpacing,
    fontWeight: "700",
  },
  description: {
    color: themeTokens.colors.textSecondary,
    fontSize: themeTokens.typography.body.fontSize,
    lineHeight: themeTokens.typography.body.lineHeight,
    letterSpacing: themeTokens.typography.body.letterSpacing,
  },
});
