package com.devqube.kierunek;

import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/**
 * Most JS → widżet. Wywoływany z src/lib/native.ts (GoalWidget.update) po każdej
 * zmianie danych i przy powrocie aplikacji na pierwszy plan.
 */
@CapacitorPlugin(name = "GoalWidget")
public class GoalWidgetPlugin extends Plugin {

    @PluginMethod
    public void update(PluginCall call) {
        GoalWidgetProvider.savePayload(getContext(), call.getData().toString());
        GoalWidgetProvider.updateAll(getContext());
        call.resolve();
    }
}
