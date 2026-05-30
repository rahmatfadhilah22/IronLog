import { Redirect } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";

import { themeTokens } from "../../src/core/theme";
import { pinAuthService } from "../../src/services/auth";
import { useAuthStore } from "../../src/stores/auth-store";

type AuthEntryState = "loading" | "setup" | "login" | "ready";

export default function AuthIndexScreen() {
  const isUnlocked = useAuthStore((s) => s.isUnlocked);
  const [entryState, setEntryState] = useState<AuthEntryState>("loading");

  useEffect(() => {
    let isCancelled = false;

    pinAuthService
      .hasPin()
      .then((hasPin) => {
        if (!isCancelled) {
          setEntryState(isUnlocked ? "ready" : hasPin ? "login" : "setup");
        }
      })
      .catch(() => {
        if (!isCancelled) {
          setEntryState("setup");
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [isUnlocked]);

  if (entryState === "loading") {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={themeTokens.colors.accentPrimary} />
      </View>
    );
  }

  if (entryState === "ready") {
    return <Redirect href="/" />;
  }

  return <Redirect href={entryState === "setup" ? "/auth/setup" : "/auth/login"} />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: themeTokens.colors.background,
  },
});
