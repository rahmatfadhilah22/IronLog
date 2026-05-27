import { Pressable, StyleSheet, Text, View } from "react-native";
import { themeTokens } from "../core/theme";

type Props = {
  onDigit: (digit: string) => void;
  onBackspace: () => void;
};

const rows = [
  ["1", "2", "3"],
  ["4", "5", "6"],
  ["7", "8", "9"],
  ["", "0", "back"],
];

export function NumericKeypad({ onDigit, onBackspace }: Props) {
  return (
    <View style={styles.grid}>
      {rows.map((row, ri) => (
        <View key={ri} style={styles.row}>
          {row.map((key, ki) => {
            if (key === "") {
              return <View key={ki} style={styles.keyEmpty} />;
            }
            if (key === "back") {
              return (
                <Pressable
                  key={ki}
                  style={styles.key}
                  onPress={onBackspace}
                  accessibilityLabel="Backspace"
                >
                  <Text style={styles.keyText}>⌫</Text>
                </Pressable>
              );
            }
            return (
              <Pressable
                key={ki}
                style={styles.key}
                onPress={() => onDigit(key)}
                accessibilityLabel={key}
              >
                <Text style={styles.keyText}>{key}</Text>
              </Pressable>
            );
          })}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { gap: themeTokens.spacing.sm },
  row: { flexDirection: "row", justifyContent: "center", gap: themeTokens.spacing.sm },
  key: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: themeTokens.colors.surfaceLow,
    alignItems: "center",
    justifyContent: "center",
  },
  keyEmpty: { width: 72, height: 72 },
  keyText: {
    color: themeTokens.colors.textPrimary,
    fontSize: 26,
    fontWeight: "600",
  },
});