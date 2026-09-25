# Aplikacja Android

Kod web jest pakowany przez [Capacitor 8](https://capacitorjs.com) jako statyczny SPA
(`GW_TARGET=mobile` włącza tryb SPA TanStack Start w `vite.config.ts`; zwykły build
dla Lovable się nie zmienia). Projekt natywny leży w `android/`.

## Build i instalacja

```sh
npm run build:mobile      # vite build (SPA) + cap sync android
npm run android:install   # + gradlew installDebug na telefon podłączony po USB
node scripts/build-mobile.mjs --release   # + assembleRelease (wymaga podpisu)
```

> Uwaga: `bun run build` nie działa pod runtime'em bun (Vite 8 / rolldown) — skrypty
> wołają Node bezpośrednio.

### POCO / Xiaomi (HyperOS)

Instalacja przez USB jest domyślnie zablokowana (`INSTALL_FAILED_USER_RESTRICTED`):

1. Ustawienia → Dodatkowe ustawienia → Opcje programisty → **Instaluj przez USB** (wymaga konta Xiaomi).
2. Przy instalacji potwierdź okno na telefonie.

Po instalacji warto w Ustawieniach systemu → Aplikacje → Kierunek → **Oszczędzanie baterii →
Brak ograniczeń** — HyperOS agresywnie usypia aplikacje, co może opóźniać powiadomienia.

## Powiadomienia

Plugin `@capacitor/local-notifications`, kanał `reminders` („Przypomnienia o celu”).

- `syncNative()` kasuje zaplanowane powiadomienia (id 1000–2999) i planuje nowe na
  **14 dni do przodu**: poranne `1000+i` („Cel na dziś”) i wieczorne `2000+i`
  („Wieczorna refleksja”). Okno przesuwa się przy każdym otwarciu aplikacji.
- Wieczorne na dziś jest pomijane, jeśli refleksja już zapisana.
- Poranne pokazuje `nextStep` z wczorajszej refleksji AI; bez niej — cel, liczbę dni
  i najbliższy kamień milowy (`morningMessage()` w `src/lib/motivation.ts`).
- Kliknięcie otwiera `/` lub `/refleksja` (`extra.route`, obsługa w `NativeBridge`).
- W tle aplikacja **nigdy nie prosi** o uprawnienia: prośba pada przy pierwszym
  uruchomieniu i z ekranu Ustawień.
- Dokładne godziny: manifest deklaruje `USE_EXACT_ALARM` (przyznawane automatycznie
  aplikacjom spoza Sklepu Play). Gdyby system go odebrał, Ustawienia pokażą przycisk
  do ekranu „Alarmy i przypomnienia”, a powiadomienia spadną do trybu nieprecyzyjnego.
- Po restarcie telefonu plugin sam przywraca zaplanowane alarmy.
- Test: Ustawienia → „Wyślij testowe powiadomienie” (za 5 s, treść jutrzejszego poranka).

## Widżet 4×1

Dodanie: przytrzymaj puste miejsce ekranu głównego → Widżety → **Kierunek**.

| Element                          | Źródło                                                                       |
| -------------------------------- | ---------------------------------------------------------------------------- |
| `42 DNI · NAZWA CELU` (bursztyn) | `targetDate` — dni liczy widżet, więc zmieniają się bez otwierania aplikacji |
| Tekst (serif, 2 linie)           | `pinned` (motywacja AI) do `pinnedUntil`, inaczej `lines[dzieńRoku % n]`     |
| `74% POSTĘP`                     | `progress`                                                                   |
| Stuknięcie                       | otwiera aplikację                                                            |

- JS → `GoalWidget.update(payload)` (`GoalWidgetPlugin.java`) → `SharedPreferences`
  → `GoalWidgetProvider.updateAll()`.
- Znacznik `{days}` w `lines` jest podstawiany w dniu wyświetlenia (TS i Java), więc liczba dni
  w tekście jest aktualna także bez otwierania aplikacji.
- Po aktualizacji aplikacji (`MY_PACKAGE_REPLACED`) widżet sam wysyła świeże widoki. Bez tego
  Lawnchair trzymał starą ścieżkę APK i pokazywał „Nie udało się załadować widżetu”.
- `updatePeriodMillis = 1h`: po północy tekst i liczba dni zmieniają się najpóźniej po godzinie.
- `lines` to „po co” celu, liczba dni, najbliższy kamień milowy, postęp i kilka stałych
  zdań (`goalLines()` w `motivation.ts`). Reguła wyboru musi być identyczna w
  `lineForDay()` (TS) i `GoalWidgetProvider.lineForDay()` (Java).
- Podgląd w aplikacji: Ustawienia → Widżet 4×1 (`WidgetPreview.tsx`).

## Ikona i motyw

Adaptacyjna ikona w wektorach (`res/drawable/ic_launcher_*.xml`), zgodna z UI:
tło atramentu `#23231E` z bursztynową poświatą u góry (jak `halo` w `AppShell`),
matowy szklany dysk, cienki pierścień i łuk postępu 75% w `#B07A41` (jak
`ProgressRing`), w środku punkt celu `#ECEAE1`. Wariant `monochrome` obsługuje ikony
tematyczne Androida 13+. Ta sama grafika jest na ekranie startowym, a
`ic_stat_kierunek.xml` to mała ikona powiadomień.

Kolory natywne (`res/values/colors.xml`) = tokeny z `src/styles.css`. Aplikacja jest
edge-to-edge (`SystemBars.insetsHandling: "css"`, `viewport-fit=cover`); odstępy od
pasków systemowych biorą się z `env(safe-area-inset-*)` w `AppShell` i `BottomNav`.

## Sieć

- `CapacitorHttp` przechwytuje `fetch` → żądania idą natywnie (brak CORS).
- `usesCleartextTraffic="true"`: gateway w Tailscale może być zwykłym `http://`
  (ruch szyfruje WireGuard). Na telefonie musi działać aplikacja Tailscale.
