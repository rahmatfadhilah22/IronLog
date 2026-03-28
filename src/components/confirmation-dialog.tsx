import { Modal, Pressable, StyleSheet, Text, View } from "react-native";

import { themeTokens } from "../core/theme";

type ConfirmationDialogProps = {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel?: string;
  tone?: "danger" | "accent";
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmationDialog({
  visible,
  title,
  message,
  confirmLabel,
  cancelLabel = "Cancel",
  tone = "danger",
  onConfirm,
  onCancel,
}: ConfirmationDialogProps) {
  const isAccent = tone === "accent";

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onCancel}
    >
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onCancel} />
        <View style={styles.dialog}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>

          <View style={styles.actions}>
            <Pressable onPress={onCancel} style={styles.cancelButton}>
              <Text style={styles.cancelLabel}>{cancelLabel}</Text>
            </Pressable>
            <Pressable
              onPress={onConfirm}
              style={[
                styles.confirmButton,
                isAccent ? styles.confirmButtonAccent : styles.confirmButtonDanger,
              ]}
            >
              <Text
                style={[
                  styles.confirmLabel,
                  isAccent ? styles.confirmLabelAccent : styles.confirmLabelDanger,
                ]}
              >
                {confirmLabel}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(8, 8, 8, 0.72)",
    alignItems: "center",
    justifyContent: "center",
    padding: themeTokens.spacing.lg,
  },
  dialog: {
    width: "100%",
    maxWidth: 420,
    backgroundColor: themeTokens.colors.surfaceLow,
    borderRadius: themeTokens.radius.md,
    borderWidth: 1,
    borderColor: themeTokens.colors.surfaceHighest,
    padding: themeTokens.spacing.lg,
    gap: themeTokens.spacing.md,
  },
  title: {
    color: themeTokens.colors.textPrimary,
    fontSize: 22,
    lineHeight: 26,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  message: {
    color: themeTokens.colors.textSecondary,
    fontSize: 14,
    lineHeight: 21,
  },
  actions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: themeTokens.spacing.sm,
  },
  cancelButton: {
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: themeTokens.radius.sm,
    paddingHorizontal: themeTokens.spacing.md,
    paddingVertical: themeTokens.spacing.sm,
    backgroundColor: themeTokens.colors.surfaceHighest,
  },
  cancelLabel: {
    color: themeTokens.colors.textPrimary,
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  confirmButton: {
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: themeTokens.radius.sm,
    paddingHorizontal: themeTokens.spacing.md,
    paddingVertical: themeTokens.spacing.sm,
    borderWidth: 1,
  },
  confirmButtonDanger: {
    backgroundColor: "rgba(230, 88, 74, 0.16)",
    borderColor: "rgba(255, 141, 126, 0.38)",
  },
  confirmButtonAccent: {
    backgroundColor: themeTokens.colors.accentPrimary,
    borderColor: themeTokens.colors.accentPrimary,
  },
  confirmLabel: {
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  confirmLabelDanger: {
    color: "#FF8D7E",
  },
  confirmLabelAccent: {
    color: themeTokens.colors.backgroundDeep,
  },
});
