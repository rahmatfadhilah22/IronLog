import { useLocalSearchParams } from "expo-router";
import { Text, View } from "react-native";

import { themeTokens } from "../../src/core/theme";
import { RoutineEditorScreen } from "../../src/features/routines/routine-editor-screen";

export default function RoutineDetailScreen() {
  const params = useLocalSearchParams<{
    routineId?: string | string[];
  }>();
  const routineId = asFirstString(params.routineId);

  if (!routineId) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: themeTokens.colors.background,
          alignItems: "center",
          justifyContent: "center",
          padding: themeTokens.spacing.lg,
        }}
      >
        <Text style={{ color: themeTokens.colors.danger, fontWeight: "700" }}>
          Invalid routine ID.
        </Text>
      </View>
    );
  }

  return <RoutineEditorScreen mode="edit" routineId={routineId} />;
}

function asFirstString(value?: string | string[]): string | undefined {
  if (!value) {
    return undefined;
  }

  return Array.isArray(value) ? value[0] : value;
}
