import Constants from "expo-constants";
import * as Haptics from "expo-haptics";
import { Platform } from "react-native";

const REST_TIMER_CHANNEL_ID = "rest-timer";
const REST_TIMER_CHANNEL_NAME = "Rest Timer";

let isNotificationHandlerInitialized = false;
let notificationChannelPromise: Promise<void> | null = null;
let notificationsModulePromise: Promise<typeof import("expo-notifications") | null> | null = null;

type ScheduleRestTimerNotificationParams = {
  endsAt: number;
  exerciseName: string;
};

export function initializeRestTimerNotifications(): void {
  if (isNotificationHandlerInitialized) {
    return;
  }

  void getNotificationsModule().then((Notifications) => {
    if (!Notifications || isNotificationHandlerInitialized) {
      return;
    }

    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      }),
    });

    isNotificationHandlerInitialized = true;
  });
}

export async function scheduleRestTimerCompletionNotification(
  params: ScheduleRestTimerNotificationParams,
): Promise<string | null> {
  initializeRestTimerNotifications();

  if (params.endsAt <= Date.now()) {
    return null;
  }

  const Notifications = await getNotificationsModule();
  if (!Notifications) {
    return null;
  }

  const hasPermission = await ensureNotificationPermission(Notifications);
  if (!hasPermission) {
    return null;
  }

  await ensureAndroidRestTimerChannel(Notifications);

  return Notifications.scheduleNotificationAsync({
    content: {
      title: "Rest complete",
      body: `${params.exerciseName} is ready. Start the next set.`,
      sound: "default",
      priority: Notifications.AndroidNotificationPriority.MAX,
      color: "#F97316",
      data: {
        tag: "rest-timer",
        endsAt: params.endsAt,
        exerciseName: params.exerciseName,
      },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: new Date(params.endsAt),
      channelId: REST_TIMER_CHANNEL_ID,
    },
  });
}

export async function cancelRestTimerNotification(
  notificationId: string | null | undefined,
): Promise<void> {
  if (!notificationId) {
    return;
  }

  const Notifications = await getNotificationsModule();
  if (!Notifications) {
    return;
  }

  try {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  } catch (error) {
    console.warn("[notifications] failed to cancel scheduled rest timer", error);
  }
}

export async function playRestTimerCompletionHaptic(
  isEnabled: boolean,
): Promise<void> {
  if (!isEnabled) {
    return;
  }

  try {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  } catch (error) {
    console.warn("[notifications] failed to play rest timer haptic", error);
  }
}

async function getNotificationsModule(): Promise<typeof import("expo-notifications") | null> {
  if (isExpoGo()) {
    return null;
  }

  if (!notificationsModulePromise) {
    notificationsModulePromise = import("expo-notifications").catch((error) => {
      console.warn("[notifications] expo-notifications unavailable in this runtime", error);
      return null;
    });
  }

  return notificationsModulePromise;
}

async function ensureNotificationPermission(
  Notifications: typeof import("expo-notifications"),
): Promise<boolean> {
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) {
    return true;
  }

  const requested = await Notifications.requestPermissionsAsync();
  return requested.granted;
}

async function ensureAndroidRestTimerChannel(
  Notifications: typeof import("expo-notifications"),
): Promise<void> {
  if (Platform.OS !== "android") {
    return;
  }

  if (!notificationChannelPromise) {
    notificationChannelPromise = Notifications.setNotificationChannelAsync(
      REST_TIMER_CHANNEL_ID,
      {
        name: REST_TIMER_CHANNEL_NAME,
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 150, 250],
        enableVibrate: true,
        sound: "default",
        lightColor: "#F97316",
      },
    ).then(() => undefined);
  }

  await notificationChannelPromise;
}

function isExpoGo(): boolean {
  return Constants.appOwnership === "expo";
}
