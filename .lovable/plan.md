# Tracker celów długofalowych — makiety + dokumentacja

Budujemy kompletny, klikalny front (makiety w TypeScript) w wybranym kierunku "Frosted index card": ciemne tło, matowe szklane karty, bursztynowy akcent, serif Fraunces w nagłówkach, Figtree w treści. Logika (baza, powiadomienia, konta) zostaje opisana w dokumentacji do wdrożenia przez Claude'a — w makietach działa na danych przykładowych trzymanych w pamięci.

## Ekrany

1. **Dziś** (strona główna, `/`)
   - Karta głównego celu: nazwa, pozostałe dni, pierścień postępu.
   - Karta poranna: przypomnienie "Pamiętaj, po co dziś wstajesz".
   - Karta wieczorna: pytanie "Czy miniony dzień przybliżył Cię do celu?" — Tak / Częściowo / Nie + jedna linijka notatki.
   - Seria dni (7 kropek) i lista horyzontów (3m / 6m / 1r / 2l) z paskami postępu.
2. **Cele** (`/cele`) — pełna lista pogrupowana po horyzoncie, wejście w szczegóły.
3. **Szczegóły celu** (`/cele/$id`) — opis, "po co", data docelowa, kamienie milowe, historia wpisów.
4. **Nowy / edycja celu** (`/cele/nowy`) — nazwa, motywacja, horyzont, data, kamienie milowe.
5. **Historia** (`/historia`) — kalendarz/lista minionych dni z odpowiedziami i notatkami.
6. **Ustawienia** (`/ustawienia`) — godziny przypomnień (rano/wieczór), włączenie powiadomień, wybór głównego celu.

Nawigacja dolna w stylu kart (Dziś / Cele / Historia / Ustawienia).

## Dane przykładowe i typy

Wszystkie ekrany czytają z jednego modułu z danymi przykładowymi, więc podmiana na prawdziwe źródło to jedna warstwa.

```text
Goal        id, title, why, horizon(3m|6m|1y|2y), startDate, targetDate,
            progress, isPrimary, milestones[]
Milestone   id, goalId, title, done, dueDate
DayEntry    id, date, goalId, answer(yes|partly|no), note
Settings    morningTime, eveningTime, notificationsEnabled, primaryGoalId
```

Do tego czyste funkcje pomocnicze (dni pozostałe, procent postępu, seria dni) — testowalne, gotowe do użycia po podpięciu bazy.

## Dokumentacja dla Claude'a

Katalog `docs/` z plikami:
- `README.md` — czym jest aplikacja, jak uruchomić, mapa plików.
- `model-danych.md` — tabele, pola, relacje, gotowy SQL dla bazy z regułami dostępu.
- `kontrakty.md` — lista operacji (pobierz cele, zapisz wpis dnia, zmień ustawienia) z sygnaturami TypeScript i opisem wejścia/wyjścia.
- `powiadomienia.md` — jak zrealizować przypomnienie poranne i wieczorne (powiadomienia web push + zadanie cykliczne po stronie serwera), z opisem kroków i wymaganych kluczy.
- `ekrany.md` — opis każdego ekranu: stany puste, ładowanie, błędy, co ma się dziać po kliknięciu.
- `todo-implementacja.md` — uporządkowana lista zadań wdrożeniowych krok po kroku.

## Szczegóły techniczne

- Trasy TanStack Router w `src/routes/`, każdy ekran z własnym `head()` (tytuł/opis PL).
- Tokeny kolorów i czcionek w `src/styles.css` (`@theme inline`, wartości oklch odpowiadające #23231E, #B07A41, #ECEAE1); fonty Fraunces + Figtree ładowane przez `<link>` w `__root.tsx`.
- Komponenty wielokrotnego użytku: `GlassCard`, `ProgressRing`, `HorizonRow`, `CheckinButtons`, `StreakDots`, `BottomNav`.
- Warstwa danych: `src/data/mock.ts` + `src/lib/goals.ts` (czyste funkcje). Brak backendu na tym etapie — interakcje działają lokalnie w stanie React, żeby makiety były klikalne.
- Typy w `src/types/goals.ts` jako jedyne źródło prawdy, eksportowane i opisane w dokumentacji.
