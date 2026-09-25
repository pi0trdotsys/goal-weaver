package com.devqube.kierunek;

import android.os.Bundle;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    @Override
    public void onCreate(Bundle savedInstanceState) {
        // Lokalny plugin musi być zarejestrowany przed startem mostu.
        registerPlugin(GoalWidgetPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
