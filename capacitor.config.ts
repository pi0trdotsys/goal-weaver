import type { CapacitorConfig } from "@capacitor/cli";

// Aplikacja Android — patrz docs/android.md.
const config: CapacitorConfig = {
  appId: "com.devqube.kierunek",
  appName: "Kierunek",
  // Statyczny build SPA z `npm run build:mobile`.
  webDir: ".output/public",
  android: {
    backgroundColor: "#23231E",
  },
  plugins: {
    // fetch → natywny HTTP: brak CORS, działa zwykłe http:// do gatewaya w Tailscale.
    CapacitorHttp: { enabled: true },
    SystemBars: { insetsHandling: "css", style: "DARK", initialViewportFitValueHint: "cover" },
    LocalNotifications: { smallIcon: "ic_stat_kierunek", iconColor: "#B07A41" },
  },
};

export default config;
