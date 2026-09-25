# AI Gateway — wieczorna refleksja z modelem na ThinkCentre

Aplikacja rozmawia z dowolnym serwerem zgodnym z **OpenAI Chat Completions**:
LiteLLM, Ollama (`/v1`), vLLM, llama.cpp `server`, LocalAI, Open WebUI (`/api`)…
Telefon łączy się bezpośrednio z ThinkCentre przez Tailscale — nie ma pośredniego backendu.

## Konfiguracja w aplikacji

Ustawienia → **AI Gateway**:

| Pole      | Przykład                                                                 |
| --------- | ------------------------------------------------------------------------ |
| Adres     | `http://thinkcentre:4000/v1` (MagicDNS) albo `http://100.x.y.z:11434/v1` |
| Model     | `qwen3:8b` — albo wybierz z listy po „Testuj połączenie”                 |
| Klucz API | opcjonalny, wysyłany jako `Authorization: Bearer …`                      |

Sam host (`thinkcentre:4000`) zostanie uzupełniony do `http://thinkcentre:4000/v1`.
Na telefonie musi być włączona aplikacja Tailscale.

## Wystawienie modelu (propozycja)

ThinkCentre zwykle nie ma mocnego GPU, więc sensowne są modele 3–9B w kwantyzacji Q4,
dobrze piszące po polsku, np. rodziny Qwen, Gemma lub Bielik (polski model).
Refleksja to krótka odpowiedź (~150 tokenów), więc nawet ~5 tok/s na CPU wystarczy —
aplikacja czeka do 2 minut.

Najprostsza droga — Ollama:

```sh
# na ThinkCentre
curl -fsSL https://ollama.com/install.sh | sh
sudo systemctl edit ollama   # [Service] Environment="OLLAMA_HOST=0.0.0.0"
ollama pull <model>
curl http://localhost:11434/v1/models
```

W aplikacji: adres `http://<nazwa-w-tailscale>:11434/v1`. Jeśli chcesz klucz, limity
i wiele modeli za jednym adresem, postaw przed Ollamą **LiteLLM** (port 4000).

## Kontrakt

1. `GET {baseUrl}/models` → `{ "data": [{ "id": "…" }] }` — test połączenia i lista modeli.
2. `POST {baseUrl}/chat/completions`:

```json
{
  "model": "qwen3:8b",
  "temperature": 0.5,
  "max_tokens": 1024,
  "stream": false,
  "messages": [
    { "role": "system", "content": "<SYSTEM_PROMPT z src/lib/ai.ts>" },
    { "role": "user", "content": "<buildReflectionPrompt()>" }
  ]
}
```

Oczekiwana treść `choices[0].message.content` — JSON:

```json
{
  "summary": "2–3 zdania podsumowania dnia w odniesieniu do celu",
  "nextStep": "Jeden konkretny krok na jutro, tryb rozkazujący, ≤120 znaków",
  "motivation": "Jedno zdanie ≤80 znaków na widżet"
}
```

`parseReflection()` jest tolerancyjny: usuwa bloki `<think>…</think>` (modele rozumujące),
ogrodzenia ` ```json `, tekst przed/po obiekcie i przycina zbyt długie pola.
`response_format` nie jest wysyłany, bo nie każdy serwer go obsługuje.

## Co model dostaje

`buildReflectionPrompt()` składa: cel i „po co”, horyzont i termin, liczbę dni, postęp
vs upływ czasu, kamienie milowe (ukończone / otwarte z terminami, najbliższy),
7 poprzednich dni (odpowiedź + notatka), wczorajszy zaplanowany krok oraz dzisiejszą
odpowiedź, notatkę i przeszkodę. Nic więcej nie opuszcza telefonu.

## Gdzie trafia wynik

| Pole         | Miejsce                                                                                                     |
| ------------ | ----------------------------------------------------------------------------------------------------------- |
| `summary`    | ekran Refleksji, Historia                                                                                   |
| `nextStep`   | karta „Jutro” na ekranie Dziś, **poranne powiadomienie „Cel na dziś”**, karta „Cel na dziś” następnego dnia |
| `motivation` | **widżet 4×1** do końca następnego dnia                                                                     |

## Testy bez prawdziwego modelu

```sh
npm run mock:gateway            # http://localhost:4000/v1, model mock-coach
adb reverse tcp:4000 tcp:4000   # telefon po USB widzi atrapę jako localhost:4000
```

W aplikacji ustaw adres `http://localhost:4000/v1`. Atrapa odpowiada jak model
rozumujący (`<think>` + JSON w bloku kodu) z 1,5 s opóźnieniem i wypisuje otrzymany prompt.

## Bez modelu

Gdy AI Gateway nie jest skonfigurowany albo nie odpowiada, `localReflection()`
(`src/lib/reflection-local.ts`) składa podsumowanie z reguł: odpowiedź i notatka, przeszkoda,
seria, tempo (postęp vs upływ czasu), a krok na jutro opiera o najbliższy kamień milowy.
Wynik ma `model: "lokalnie"` i trafia do tych samych miejsc (poranne powiadomienie, widżet).

## Błędy

Komunikaty są po polsku, nie blokują zapisu dnia, a podsumowanie powstaje wtedy lokalnie: brak połączenia (sprawdź Tailscale),
kod HTTP z treścią błędu, przekroczenie 2 minut, odpowiedź bez JSON-a / bez wymaganych pól.
