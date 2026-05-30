import * as FileSystem from "expo-file-system/legacy";
import * as MediaLibrary from "expo-media-library";
import * as Sharing from "expo-sharing";
import type ViewShot from "react-native-view-shot";

function tempFileUri(): string {
  const base = FileSystem.cacheDirectory ?? FileSystem.documentDirectory;
  const timestamp = Date.now();
  return `${base}ironlog-share-${timestamp}.png`;
}

export async function captureShareCard(
  viewShotRef: React.RefObject<ViewShot | null>,
): Promise<string> {
  if (!viewShotRef.current?.capture) {
    throw new Error("ViewShot ref is not attached.");
  }

  const uri = await viewShotRef.current.capture();
  return uri;
}

export async function shareImage(fileUri: string): Promise<void> {
  const isAvailable = await Sharing.isAvailableAsync();
  if (!isAvailable) {
    throw new Error("Sharing is not available on this device.");
  }

  await Sharing.shareAsync(fileUri);
}

export async function saveToGallery(fileUri: string): Promise<void> {
  const { status } = await MediaLibrary.requestPermissionsAsync();

  if (status !== "granted") {
    throw new Error("Gallery permission denied.");
  }

  await MediaLibrary.saveToLibraryAsync(fileUri);
}
