package com.devqube.kierunek;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.view.View;
import android.widget.RemoteViews;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.util.Calendar;
import java.util.Locale;
import java.util.TimeZone;

/**
 * Widżet 4x1 z motywującym tekstem o głównym celu.
 *
 * Dane przychodzą z aplikacji przez {@link GoalWidgetPlugin} (payload budowany w
 * src/lib/motivation.ts → widgetPayload). Pozostałe dni i tekst dnia są liczone
 * tutaj, więc widżet zmienia się codziennie także bez otwierania aplikacji.
 * Reguła wyboru tekstu = lineForDay() w src/lib/motivation.ts.
 */
public class GoalWidgetProvider extends AppWidgetProvider {

    static final String PREFS = "goal_widget";
    static final String KEY_PAYLOAD = "payload";

    @Override
    public void onUpdate(Context context, AppWidgetManager manager, int[] appWidgetIds) {
        RemoteViews views = buildViews(context);
        for (int id : appWidgetIds) {
            manager.updateAppWidget(id, views);
        }
    }

    /**
     * Po aktualizacji aplikacji APK ląduje w nowym katalogu. Launcher (np. Lawnchair)
     * potrafi trzymać starą ścieżkę i pokazywać „Nie udało się załadować widżetu” —
     * świeże RemoteViews wysłane od razu po aktualizacji niosą aktualne ApplicationInfo.
     */
    @Override
    public void onReceive(Context context, Intent intent) {
        super.onReceive(context, intent);
        if (Intent.ACTION_MY_PACKAGE_REPLACED.equals(intent.getAction())) {
            updateAll(context);
        }
    }

    /** Odświeża wszystkie instancje widżetu na ekranie głównym. */
    static void updateAll(Context context) {
        AppWidgetManager manager = AppWidgetManager.getInstance(context);
        int[] ids = manager.getAppWidgetIds(new ComponentName(context, GoalWidgetProvider.class));
        if (ids.length == 0) return;
        RemoteViews views = buildViews(context);
        for (int id : ids) {
            manager.updateAppWidget(id, views);
        }
    }

    static void savePayload(Context context, String json) {
        prefs(context).edit().putString(KEY_PAYLOAD, json).apply();
    }

    private static SharedPreferences prefs(Context context) {
        return context.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
    }

    private static RemoteViews buildViews(Context context) {
        RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.widget_goal);

        Intent open = new Intent(context, MainActivity.class);
        open.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        PendingIntent pending = PendingIntent.getActivity(
            context,
            0,
            open,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );
        views.setOnClickPendingIntent(R.id.widget_root, pending);

        JSONObject payload;
        try {
            payload = new JSONObject(prefs(context).getString(KEY_PAYLOAD, "{}"));
        } catch (JSONException e) {
            payload = new JSONObject();
        }

        String today = todayIso();
        boolean hasGoal = payload.optBoolean("hasGoal", false);

        if (!hasGoal) {
            views.setTextViewText(R.id.widget_label, context.getString(R.string.widget_label_default));
            views.setTextViewText(R.id.widget_line, lineForDay(payload, today, context.getString(R.string.widget_empty)));
            views.setViewVisibility(R.id.widget_progress_box, View.GONE);
            return views;
        }

        String title = payload.optString("goalTitle", "");
        long left = daysBetween(today, payload.optString("targetDate", today));
        String label = (left + " " + (left == 1 ? "dzień" : "dni") + " · " + title).toUpperCase(new Locale("pl", "PL"));

        views.setTextViewText(R.id.widget_label, label);
        views.setTextViewText(R.id.widget_line, lineForDay(payload, today, title));
        views.setTextViewText(R.id.widget_progress, payload.optInt("progress", 0) + "%");
        views.setViewVisibility(R.id.widget_progress_box, View.VISIBLE);
        return views;
    }

    private static String lineForDay(JSONObject payload, String today, String fallback) {
        String pinned = payload.optString("pinned", "");
        String pinnedUntil = payload.optString("pinnedUntil", "");
        if (!pinned.isEmpty() && today.compareTo(pinnedUntil) <= 0) return pinned;

        JSONArray lines = payload.optJSONArray("lines");
        if (lines == null || lines.length() == 0) return fallback;
        int index = Calendar.getInstance().get(Calendar.DAY_OF_YEAR) % lines.length();
        String line = lines.optString(index, fallback);
        // {days} = pozostałe dni liczone dziś — jak DAYS_TOKEN w src/lib/motivation.ts.
        long left = daysBetween(today, payload.optString("targetDate", today));
        return line.replace("{days}", left + " " + (left == 1 ? "dzień" : "dni"));
    }

    private static String todayIso() {
        Calendar c = Calendar.getInstance();
        return String.format(
            Locale.ROOT,
            "%04d-%02d-%02d",
            c.get(Calendar.YEAR),
            c.get(Calendar.MONTH) + 1,
            c.get(Calendar.DAY_OF_MONTH)
        );
    }

    /** Liczba dni kalendarzowych od `from` do `to` (min. 0) — jak daysLeft() w src/lib/goals.ts. */
    private static long daysBetween(String from, String to) {
        long diff = (utcMidnight(to) - utcMidnight(from)) / 86_400_000L;
        return Math.max(0, diff);
    }

    private static long utcMidnight(String iso) {
        try {
            String[] parts = iso.split("-");
            Calendar c = Calendar.getInstance(TimeZone.getTimeZone("UTC"));
            c.clear();
            c.set(Integer.parseInt(parts[0]), Integer.parseInt(parts[1]) - 1, Integer.parseInt(parts[2]));
            return c.getTimeInMillis();
        } catch (RuntimeException e) {
            return 0;
        }
    }
}
