import { useNavigate, useRouter } from "@tanstack/react-router";
import { useEffect, useRef } from "react";

import { useAppState } from "@/context/app-state";
import { ensureChannel, isNative, requestNotificationPermission, syncNative } from "@/lib/native";

const PERMISSION_ASKED_KEY = "goal-weaver:notification-permission-asked";

/**
 * Integracja z Androidem, montowana raz w __root:
 * - kliknięcie w powiadomienie otwiera właściwy ekran (np. /refleksja),
 * - systemowy „Wstecz” cofa w historii, a na ekranie głównym zamyka aplikację,
 * - powrót na pierwszy plan odświeża widżet i okno zaplanowanych powiadomień,
 * - przy pierwszym uruchomieniu prosi o zgodę na powiadomienia.
 */
export function NativeBridge() {
  const { data } = useAppState();
  const navigate = useNavigate();
  const router = useRouter();
  const dataRef = useRef(data);
  dataRef.current = data;

  useEffect(() => {
    if (!isNative()) return;
    const cleanups: Array<() => void> = [];
    let cancelled = false;

    void (async () => {
      const [{ LocalNotifications }, { App }] = await Promise.all([
        import("@capacitor/local-notifications"),
        import("@capacitor/app"),
      ]);
      if (cancelled) return;

      await ensureChannel();

      const tap = await LocalNotifications.addListener(
        "localNotificationActionPerformed",
        (action) => {
          const route: unknown = action.notification.extra?.route;
          if (route === "/refleksja" || route === "/") void navigate({ to: route });
        },
      );
      const back = await App.addListener("backButton", ({ canGoBack }) => {
        if (canGoBack && router.state.location.pathname !== "/") router.history.back();
        else void App.exitApp();
      });
      const resume = await App.addListener("resume", () => void syncNative(dataRef.current));
      cleanups.push(
        () => void tap.remove(),
        () => void back.remove(),
        () => void resume.remove(),
      );

      let asked = false;
      try {
        asked = window.localStorage.getItem(PERMISSION_ASKED_KEY) === "1";
      } catch {
        // brak dostępu do storage — zapytamy ponownie przy następnym uruchomieniu
      }
      if (!asked) {
        const granted = await requestNotificationPermission();
        try {
          window.localStorage.setItem(PERMISSION_ASKED_KEY, "1");
        } catch {
          // jw.
        }
        if (granted) void syncNative(dataRef.current);
      }
    })();

    return () => {
      cancelled = true;
      cleanups.forEach((fn) => fn());
    };
  }, [navigate, router]);

  return null;
}
