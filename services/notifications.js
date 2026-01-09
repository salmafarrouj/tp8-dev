import * as Notifications from "expo-notifications";
import * as Permissions from "expo-permissions";

export async function requestNotificationPermissionAsync() {
  try {
    const { status } = await Notifications.getPermissionsAsync();
    if (status !== "granted") {
      const res = await Notifications.requestPermissionsAsync();
      return res.status === "granted";
    }
    return true;
  } catch (e) {
    console.warn("permission error", e);
    return false;
  }
}

export async function scheduleNotification(title, body, timestamp) {
  // timestamp in ms
  const trigger = new Date(timestamp);
  if (trigger <= new Date()) {
    // do not schedule past notifications
    return null;
  }
  const id = await Notifications.scheduleNotificationAsync({
    content: { title: title || "Rappel", body: body || "Il est temps" },
    trigger,
  });
  return id;
}

export async function cancelNotification(notificationId) {
  try {
    if (!notificationId) return;
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  } catch (e) {
    console.warn("cancelNotification error", e);
  }
}

export default {
  requestNotificationPermissionAsync,
  scheduleNotification,
  cancelNotification,
};
