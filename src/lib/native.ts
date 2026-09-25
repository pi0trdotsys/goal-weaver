import { Capacitor, registerPlugin } from "@capacitor/core";

import { addDaysISO, entryForDate, reflectionDateISO, todayISO } from "@/lib/goals";
import {
  eveningMessage,
  morningMessage,
  widgetPayload,
  type WidgetPayload,
} from "@/lib/motivation";
import type { AppData } from "@/types/goals";

/**
 * Most do Androida: zaplanowane powiadomienia („Cel na dziś” i „Wieczorna
 * refleksja”) oraz widżet 4x1. W przeglądarce wszystko jest no-opem.
 * Szczegóły: docs/android.md
 */

export const isNative = (): boolean => Capacitor.isNativePlatform();

/** Natywny plugin z android/app/src/main/java/com/devqube/kierunek/GoalWidgetPlugin.java */
interface GoalWidgetPlugin {
  update(payload: WidgetPayload): Promise<void>;
}
const GoalWidget = registerPlugin<GoalWidgetPlugin>("GoalWidget");

export const CHANNEL_ID = "reminders";
const MORNING_BASE_ID = 1000;
const EVENING_BASE_ID = 2000;
const TEST_ID = 9000;
/** Tyle dni do przodu planujemy — okno przesuwa się przy każdym otwarciu aplikacji. */
const DAYS_AHEAD = 14;

// Uwaga: plugin to proxy, które odpowiada na każdą właściwość — także `then`.
// Nie wolno go zwracać wprost z Promise (Android rzuci „then() is not implemented”),
// dlatego opakowujemy go w zwykły obiekt.
async function loadNotifications() {
  const { LocalNotifications } = await import("@capacitor/local-notifications");
  return { LocalNotifications };
}

function at(date: string, time: string): Date {
  const [h = "0", m = "0"] = time.split(":");
  const d = new Date(`${date}T00:00:00`);
  d.setHours(Number(h), Number(m), 0, 0);
  return d;
}

export async function ensureChannel(): Promise<void> {
  if (!isNative()) return;
  const { LocalNotifications } = await loadNotifications();
  await LocalNotifications.createChannel({
    id: CHANNEL_ID,
    name: "Przypomnienia o celu",
    description: "Poranny „Cel na dziś” i „Wieczorna refleksja”",
    importance: 4,
    visibility: 1,
    lights: true,
    vibration: true,
  });
}

async function scheduleReminders(data: AppData): Promise<void> {
  const { LocalNotifications } = await loadNotifications();

  const pending = await LocalNotifications.getPending();
  const ours = pending.notifications.filter((n) => n.id >= MORNING_BASE_ID && n.id < TEST_ID);
  if (ours.length)
    await LocalNotifications.cancel({ notifications: ours.map((n) => ({ id: n.id })) });

  if (!data.settings.notificationsEnabled || data.goals.length === 0) return;
  // W tle nigdy nie pytamy o uprawnienia — o to prosi ekran Ustawień.
  if ((await LocalNotifications.checkPermissions()).display !== "granted") return;
  const exact =
    (await LocalNotifications.checkExactNotificationSetting()).exact_alarm === "granted";

  const now = Date.now();
  const today = todayISO();
  const reflectionDay = reflectionDateISO();
  const notifications = [];

  for (let i = 0; i < DAYS_AHEAD; i++) {
    const date = addDaysISO(today, i);

    const morning = morningMessage(data, date);
    const morningAt = at(date, data.settings.morningTime);
    if (morning && morningAt.getTime() > now) {
      notifications.push({
        id: MORNING_BASE_ID + i,
        title: morning.title,
        body: morning.body,
        largeBody: morning.body,
        schedule: { at: morningAt, allowWhileIdle: true },
        channelId: CHANNEL_ID,
        smallIcon: "ic_stat_kierunek",
        iconColor: "#B07A41",
        autoCancel: true,
        isExactNotification: exact,
        extra: { route: "/" },
      });
    }

    const evening = eveningMessage(data);
    const eveningAt = at(date, data.settings.eveningTime);
    const alreadyReflected = date === reflectionDay && entryForDate(data.entries, date);
    if (evening && eveningAt.getTime() > now && !alreadyReflected) {
      notifications.push({
        id: EVENING_BASE_ID + i,
        title: evening.title,
        body: evening.body,
        largeBody: evening.body,
        schedule: { at: eveningAt, allowWhileIdle: true },
        channelId: CHANNEL_ID,
        smallIcon: "ic_stat_kierunek",
        iconColor: "#B07A41",
        autoCancel: true,
        isExactNotification: exact,
        extra: { route: "/refleksja" },
      });
    }
  }

  if (notifications.length) await LocalNotifications.schedule({ notifications });
}

/** Wywoływane po każdej zmianie danych i przy powrocie aplikacji na pierwszy plan. */
export async function syncNative(data: AppData): Promise<void> {
  if (!isNative()) return;
  try {
    await GoalWidget.update(widgetPayload(data));
  } catch (error) {
    console.error("Widżet: aktualizacja nieudana", error);
  }
  try {
    await scheduleReminders(data);
  } catch (error) {
    console.error("Powiadomienia: planowanie nieudane", error);
  }
}

export interface ReminderPermissions {
  notifications: "granted" | "denied" | "prompt";
  exactAlarms: boolean;
}

export async function getReminderPermissions(): Promise<ReminderPermissions | null> {
  if (!isNative()) return null;
  const { LocalNotifications } = await loadNotifications();
  const display = (await LocalNotifications.checkPermissions()).display;
  const exact =
    (await LocalNotifications.checkExactNotificationSetting()).exact_alarm === "granted";
  return {
    notifications: display === "granted" ? "granted" : display === "denied" ? "denied" : "prompt",
    exactAlarms: exact,
  };
}

/** Prosi o zgodę na powiadomienia (Android 13+). Zwraca true, gdy przyznana. */
export async function requestNotificationPermission(): Promise<boolean> {
  if (!isNative()) return false;
  const { LocalNotifications } = await loadNotifications();
  return (await LocalNotifications.requestPermissions()).display === "granted";
}

/** Otwiera systemowy ekran „Alarmy i przypomnienia”. */
export async function openExactAlarmSettings(): Promise<void> {
  if (!isNative()) return;
  const { LocalNotifications } = await loadNotifications();
  await LocalNotifications.changeExactNotificationSetting();
}

/** Testowe powiadomienie za 5 sekund, z treścią jutrzejszego „Celu na dziś”. */
export async function sendTestNotification(data: AppData): Promise<void> {
  if (!isNative()) return;
  const { LocalNotifications } = await loadNotifications();
  const message = morningMessage(data, addDaysISO(todayISO(), 1)) ?? {
    title: "Kierunek",
    body: "Powiadomienia działają.",
  };
  await LocalNotifications.schedule({
    notifications: [
      {
        id: TEST_ID,
        title: message.title,
        body: message.body,
        largeBody: message.body,
        schedule: { at: new Date(Date.now() + 5000), allowWhileIdle: true },
        channelId: CHANNEL_ID,
        smallIcon: "ic_stat_kierunek",
        iconColor: "#B07A41",
        isExactNotification: false,
        extra: { route: "/" },
      },
    ],
  });
}
