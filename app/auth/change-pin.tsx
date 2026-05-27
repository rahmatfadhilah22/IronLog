import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { NumericKeypad } from "../../src/components/numeric-keypad";
import { PinDots } from "../../src/components/pin-dots";
import { pinAuthService } from "../../src/services/auth";
import { themeTokens } from "../../src/core/theme";
import * as Haptics from "expo-haptics";

type Phase = "verify" | "newPin" | "confirm";

export default function ChangePinScreen() {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("verify");
  const [currentPin, setCurrentPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const onDigit = async (digit: string) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setError("");

    if (phase === "verify" && currentPin.length < 6) {
      const next = currentPin + digit;
      setCurrentPin(next);
      if (next.length === 6) {
        const valid = await pinAuthService.verifyPin(next);
        if (valid) {
          void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          setPhase("newPin");
        } else {
          void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          setError("PIN salah");
          setCurrentPin("");
        }
      }
    } else if (phase === "newPin" && newPin.length < 6) {
      const next = newPin + digit;
      setNewPin(next);
      if (next.length === 6) setTimeout(() => setConfirmPin(""), 80);
    } else if (phase === "confirm" && confirmPin.length < 6) {
      const next = confirmPin + digit;
      setConfirmPin(next);
      if (next.length === 6) {
        if (next === newPin) {
          setSaving(true);
          void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          try {
            await pinAuthService.changePin(currentPin, next);
            router.back();
          } catch {
            setError("Gagal menyimpan. Coba lagi.");
            setSaving(false);
          }
        } else {
          void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          setError("PIN tidak cocok");
          setNewPin("");
          setConfirmPin("");
          setPhase("newPin");
        }
      }
    }
  };

  const onBackspace = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (phase === "confirm" && confirmPin.length > 0) setConfirmPin((p) => p.slice(0, -1));
    else if (phase === "confirm" && confirmPin.length === 0 && newPin.length > 0) setNewPin((p) => p.slice(0, -1));
    else if (phase === "newPin" && newPin.length > 0) setNewPin((p) => p.slice(0, -1));
    else if (phase === "verify" && currentPin.length > 0) setCurrentPin((p) => p.slice(0, -1));
  };

  const filled = phase === "verify" ? currentPin.length : phase === "newPin" ? newPin.length : confirmPin.length;
  const label = phase === "verify" ? "Masukkan PIN saat ini" : phase === "newPin" ? "Masukkan PIN baru" : "Konfirmasi PIN baru";
  const eyebrow = phase === "verify" ? "VERIFIKASI PIN" : phase === "newPin" ? "PIN BARU" : "KONFIRMASI";

  return (
    <View style={styles.container}>
      <View style={styles.topArea}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backLabel}>← Batal</Text>
        </Pressable>
        <Text style={styles.eyebrow}>{eyebrow}</Text>
        <Text style={styles.title}>{label}</Text>
        <PinDots filled={filled} />
        {error ? <Text style={styles.error}>{error}</Text> : null}
        {saving ? <Text style={styles.info}>Menyimpan...</Text> : null}
      </View>
      <View style={styles.keypadArea}>
        <NumericKeypad onDigit={onDigit} onBackspace={onBackspace} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: themeTokens.colors.background, paddingTop: 60 },
  topArea: { alignItems: "center", gap: 12, paddingHorizontal: 24 },
  backBtn: { position: "absolute", top: 12, left: 12 },
  backLabel: { color: themeTokens.colors.textSecondary, fontSize: 12, fontWeight: "700", letterSpacing: 1, textTransform: "uppercase" },
  eyebrow: { color: themeTokens.colors.accentPrimary, fontSize: 11, fontWeight: "700", letterSpacing: 1.5, textTransform: "uppercase", marginTop: 20 },
  title: { color: themeTokens.colors.textPrimary, fontSize: 22, fontWeight: "800", textTransform: "uppercase" },
  error: { color: themeTokens.colors.danger, fontSize: 12, fontWeight: "700", textTransform: "uppercase" },
  info: { color: themeTokens.colors.textSecondary, fontSize: 12, fontWeight: "700", textTransform: "uppercase" },
  keypadArea: { flex: 1, justifyContent: "flex-end", alignItems: "center", paddingBottom: 48 },
});