# Kierunek — tracker celów długofalowych

Prosty, minimalistyczny tracker celów na 3 miesiące, 6 miesięcy, rok i dwa lata.
Codziennie rano przypomina, dokąd zmierzasz („Cel na dziś”), a wieczorem pyta,
czy dzień Cię do celu przybliżył („Wieczorna refleksja”). Po refleksji model AI
na Twoim serwerze (ThinkCentre, przez Tailscale) pisze krótkie podsumowanie dnia
i jeden konkretny krok na jutro. Na ekranie głównym telefonu widżet 4×1 pokazuje
motywujący tekst o celu.

Aplikacja działa w dwóch trybach z jednego kodu:

| Tryb          | Build                  | Gdzie                                               |
| ------------- | ---------------------- | --------------------------------------------------- |
| Web (Lovable) | `npm run build`        | SSR na Cloudflare, podgląd w Lovable                |
| Android       | `npm run build:mobile` | statyczny SPA w Capacitor, instalowany na telefonie |

## Szybki start

```sh
bun install                # albo npm i
npm run dev                # http://localhost:5173
npm run android:install    # build + instalacja na telefonie podłączonym po USB
npm run mock:gateway       # atrapa AI Gateway do testów (docs/ai-gateway.md)
```

Wymagania dla Androida: Node 20+, JDK 21, Android SDK (platform 36, build-tools 35+),
`ANDROID_HOME` ustawione. Szczegóły: [android.md](android.md).

## Jak to działa

```
            ┌──────────── src/context/app-state.tsx ────────────┐
 ekrany ──▶ │ stan AppData  ─▶ localStorage (src/lib/storage.ts)  │
            │               ─▶ syncNative()  (src/lib/native.ts)  │
            └─────────────────────────┬──────────────────────────┘
                                      │ tylko na Androidzie
              ┌───────────────────────┼─────────────────────────┐
              ▼                       ▼                         ▼
   LocalNotifications        GoalWidget (plugin Java)    fetch → CapacitorHttp
   14 dni do przodu:         SharedPreferences →         → AI Gateway (Tailscale)
   „Cel na dziś”,            GoalWidgetProvider          src/lib/ai.ts
   „Wieczorna refleksja”     (widżet 4×1)
```

- **Dane** są tylko na telefonie (localStorage WebView, objęty kopią zapasową Androida).
  `normalize()` w `storage.ts` uzupełnia brakujące pola, więc zmiany modelu nie psują starszych zapisów.
- **Każda zmiana danych** (i każdy powrót aplikacji na pierwszy plan) wywołuje `syncNative()`:
  odświeża widżet i przeplanowuje powiadomienia na 14 dni do przodu.
- **Pętla dnia**: wieczorna refleksja → AI zwraca `nextStep` i `motivation` →
  jutrzejsze poranne powiadomienie pokazuje `nextStep`, widżet pokazuje `motivation`
  do końca następnego dnia, potem wraca do codziennej rotacji zdań o celu.

## Mapa plików

| Plik                                              | Rola                                                                        |
| ------------------------------------------------- | --------------------------------------------------------------------------- |
| `src/types/goals.ts`                              | Model danych — jedyne źródło prawdy                                         |
| `src/lib/goals.ts`                                | Czyste funkcje: daty, pozostałe dni, seria, najbliższy kamień milowy        |
| `src/lib/motivation.ts`                           | Teksty widżetu i powiadomień (reguła rotacji = `GoalWidgetProvider.java`)   |
| `src/lib/ai.ts`                                   | Klient AI Gateway: prompt, wywołanie, parsowanie odpowiedzi                 |
| `src/lib/native.ts`                               | Powiadomienia i most do widżetu (no-op w przeglądarce)                      |
| `src/lib/storage.ts`                              | Odczyt/zapis i migracja danych                                              |
| `src/context/app-state.tsx`                       | Stan i operacje aplikacji                                                   |
| `src/components/NativeBridge.tsx`                 | Kliknięcia w powiadomienia, przycisk Wstecz, powrót do aplikacji            |
| `src/routes/`                                     | Ekrany: Dziś, Cele, Szczegóły, Nowy/edycja, Refleksja, Historia, Ustawienia |
| `android/app/src/main/java/com/devqube/kierunek/` | `GoalWidgetProvider`, `GoalWidgetPlugin`, `MainActivity`                    |
| `android/app/src/main/res/`                       | Ikona, widżet (`layout/widget_goal.xml`), motyw, kolory                     |
| `scripts/build-mobile.mjs`                        | Build SPA → `cap sync` → instalacja                                         |
| `scripts/mock-gateway.mjs`                        | Atrapa AI Gateway zgodna z OpenAI                                           |

## Ekrany

- **Dziś** (`/`) — główny cel, pozostałe dni, postęp; „Cel na dziś” (krok z wczorajszej
  refleksji albo „po co” + najbliższy kamień milowy); „Wieczorna refleksja” (szybka
  odpowiedź Tak/Częściowo/Nie przenosi do refleksji); seria tygodnia; pozostałe horyzonty.
- **Refleksja** (`/refleksja`) — odpowiedź, co zrobiłeś, co przeszkodziło; „Zapisz
  i podsumuj dzień” wysyła kontekst do modelu. Wpis zapisuje się także, gdy AI zawiedzie.
  Wpis po północy (do 4:00) dotyczy poprzedniego dnia. Otwiera ją wieczorne powiadomienie.
- **Cele** (`/cele`), **Szczegóły** (`/cele/$id`), **Nowy/edycja** (`/cele/nowy?edit=…`)
  — horyzont, data, „po co”, kamienie milowe z terminami, postęp, usuwanie.
- **Historia** (`/historia`) — wszystkie dni z notatkami i rozwijanym podsumowaniem AI.
- **Ustawienia** (`/ustawienia`) — godziny, uprawnienia, testowe powiadomienie, podgląd
  widżetu, główny cel, AI Gateway (`#ai`), dane przykładowe, czyszczenie.

## Dalsze dokumenty

- [android.md](android.md) — build, instalacja na POCO/HyperOS, widżet, powiadomienia, ikona
- [ai-gateway.md](ai-gateway.md) — konfiguracja modelu na ThinkCentre, kontrakt API, prompt
