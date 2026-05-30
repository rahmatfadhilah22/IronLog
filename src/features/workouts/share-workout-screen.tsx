import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import ViewShot from "react-native-view-shot";

import { themeTokens } from "../../core/theme";
import { workoutService } from "../../services/workouts";
import {
  captureShareCard,
  saveToGallery,
  shareImage,
} from "../../services/workouts/share-service";
import type { WorkoutSummary } from "../../types/workout";
import { ShareCard } from "./components/share-card";

type ShareWorkoutScreenProps = {
  workoutId: string;
};

export function ShareWorkoutScreen({ workoutId }: ShareWorkoutScreenProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const viewShotRef = useRef<ViewShot>(null);

  const [summary, setSummary] = useState<WorkoutSummary | null>(null);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSharing, setIsSharing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    let isActive = true;
    setIsLoading(true);
    setErrorMessage(null);

    workoutService
      .getWorkoutSummary(workoutId)
      .then((result) => {
        if (!isActive) return;
        if (!result) {
          setErrorMessage("Workout summary not found.");
          return;
        }
        setSummary(result);
      })
      .catch((error: unknown) => {
        if (isActive) {
          setErrorMessage(
            error instanceof Error ? error.message : "Failed to load summary.",
          );
        }
      })
      .finally(() => {
        if (isActive) setIsLoading(false);
      });

    return () => {
      isActive = false;
    };
  }, [workoutId]);

  async function handlePickPhoto() {
    setActionError(null);
    const permission = await ImagePicker.getMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      const result = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!result.granted) {
        setActionError("Photo library permission is required.");
        return;
      }
    }

    const pickerResult = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [3, 4],
      quality: 1,
    });

    if (!pickerResult.canceled && pickerResult.assets.length > 0) {
      setPhotoUri(pickerResult.assets[0].uri);
    }
  }

  async function handleShare() {
    setActionError(null);
    setIsSharing(true);
    try {
      const fileUri = await captureShareCard(viewShotRef);
      await shareImage(fileUri);
    } catch (error: unknown) {
      setActionError(
        error instanceof Error ? error.message : "Share failed.",
      );
    } finally {
      setIsSharing(false);
    }
  }

  async function handleSave() {
    setActionError(null);
    setIsSaving(true);
    try {
      const fileUri = await captureShareCard(viewShotRef);
      await saveToGallery(fileUri);
    } catch (error: unknown) {
      setActionError(
        error instanceof Error ? error.message : "Save failed.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return (
      <View style={styles.centerState}>
        <ActivityIndicator size="large" color={themeTokens.colors.accentPrimary} />
        <Text style={styles.stateLabel}>Loading...</Text>
      </View>
    );
  }

  if (!summary) {
    return (
      <View style={styles.centerState}>
        <Text style={styles.errorText}>{errorMessage ?? "Summary unavailable."}</Text>
        <Pressable
          style={styles.backButtonSmall}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonLabel}>Go Back</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[
        styles.contentContainer,
        { paddingTop: insets.top + themeTokens.spacing.md, paddingBottom: insets.bottom + themeTokens.spacing.xxl },
      ]}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.headerRow}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={22} color={themeTokens.colors.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>SHARE RESULT</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ViewShot
        ref={viewShotRef}
        options={{ format: "png", quality: 1 }}
        style={styles.viewShot}
      >
        <ShareCard summary={summary} photoUri={photoUri} />
      </ViewShot>

      {actionError ? (
        <Text style={styles.errorText}>{actionError}</Text>
      ) : null}

      <Pressable
        style={({ pressed }) => [
          styles.photoButton,
          pressed ? styles.photoButtonPressed : null,
        ]}
        onPress={handlePickPhoto}
      >
        <Ionicons name="images-outline" size={18} color={themeTokens.colors.textPrimary} />
        <Text style={styles.photoButtonLabel}>
          {photoUri ? "Change Photo" : "Upload Photo"}
        </Text>
      </Pressable>

      <Pressable
        style={({ pressed }) => [
          styles.shareButton,
          (pressed || isSharing) ? styles.shareButtonPressed : null,
        ]}
        onPress={handleShare}
        disabled={isSharing}
      >
        {isSharing ? (
          <ActivityIndicator size="small" color={themeTokens.colors.backgroundDeep} />
        ) : (
          <Text style={styles.shareButtonLabel}>Share Now</Text>
        )}
      </Pressable>

      <Pressable
        style={({ pressed }) => [
          styles.saveButton,
          (pressed || isSaving) ? styles.saveButtonPressed : null,
        ]}
        onPress={handleSave}
        disabled={isSaving}
      >
        {isSaving ? (
          <ActivityIndicator size="small" color={themeTokens.colors.textPrimary} />
        ) : (
          <Text style={styles.saveButtonLabel}>Save to Gallery</Text>
        )}
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: themeTokens.colors.background,
  },
  contentContainer: {
    paddingHorizontal: themeTokens.spacing.lg,
    gap: themeTokens.spacing.md,
    alignItems: "center",
  },
  centerState: {
    flex: 1,
    backgroundColor: themeTokens.colors.background,
    alignItems: "center",
    justifyContent: "center",
    gap: themeTokens.spacing.sm,
    paddingHorizontal: themeTokens.spacing.xl,
  },
  stateLabel: {
    color: themeTokens.colors.textSecondary,
    fontSize: 14,
    fontWeight: "600",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    marginBottom: themeTokens.spacing.sm,
  },
  backButton: {
    padding: themeTokens.spacing.sm,
  },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    color: themeTokens.colors.textPrimary,
    fontSize: 14,
    fontWeight: "800",
    letterSpacing: 2,
  },
  headerSpacer: {
    width: 38,
  },
  viewShot: {
    alignItems: "center",
    justifyContent: "center",
  },
  errorText: {
    color: themeTokens.colors.danger,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "700",
    textAlign: "center",
  },
  photoButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: themeTokens.spacing.sm,
    minHeight: 48,
    width: "100%",
    borderRadius: themeTokens.radius.sm,
    borderWidth: 1,
    borderColor: themeTokens.colors.surfaceHigh,
    backgroundColor: themeTokens.colors.surfaceLow,
  },
  photoButtonPressed: {
    opacity: 0.7,
  },
  photoButtonLabel: {
    color: themeTokens.colors.textPrimary,
    fontSize: 14,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  shareButton: {
    minHeight: 52,
    width: "100%",
    backgroundColor: themeTokens.colors.accentPrimary,
    borderRadius: themeTokens.radius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  shareButtonPressed: {
    opacity: 0.7,
  },
  shareButtonLabel: {
    color: themeTokens.colors.backgroundDeep,
    fontWeight: "800",
    fontSize: 14,
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  saveButton: {
    minHeight: 52,
    width: "100%",
    backgroundColor: themeTokens.colors.surfaceHigh,
    borderRadius: themeTokens.radius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  saveButtonPressed: {
    opacity: 0.7,
  },
  saveButtonLabel: {
    color: themeTokens.colors.textPrimary,
    fontWeight: "800",
    fontSize: 14,
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  backButtonSmall: {
    minHeight: 44,
    backgroundColor: themeTokens.colors.accentPrimary,
    borderRadius: themeTokens.radius.sm,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: themeTokens.spacing.lg,
  },
  backButtonLabel: {
    color: themeTokens.colors.backgroundDeep,
    fontWeight: "800",
    textTransform: "uppercase",
    fontSize: 12,
    letterSpacing: 0.8,
  },
});
