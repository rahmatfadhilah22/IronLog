import { StyleSheet, View } from "react-native";
import { themeTokens } from "../core/theme";

type Props = {
  filled: number;
  total?: number;
};

export function PinDots({ filled, total = 6 }: Props) {
  return (
    <View style={styles.row}>
      {Array.from({ length: total }, (_, i) => (
        <View
          key={i}
          style={[styles.dot, i < filled ? styles.dotFilled : styles.dotEmpty]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", gap: themeTokens.spacing.md },
  dot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
  },
  dotFilled: {
    backgroundColor: themeTokens.colors.accentPrimary,
    borderColor: themeTokens.colors.accentPrimary,
  },
  dotEmpty: {
    backgroundColor: "transparent",
    borderColor: themeTokens.colors.textSecondary,
  },
});