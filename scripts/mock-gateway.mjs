// Atrapa AI Gateway (API zgodne z OpenAI) do testów, zanim prawdziwy model na
// ThinkCentre będzie wystawiony.
//
//   node scripts/mock-gateway.mjs            # http://localhost:4000/v1
//   adb reverse tcp:4000 tcp:4000            # telefon po USB widzi ją jako localhost:4000
//
// W aplikacji: Ustawienia → AI Gateway → adres http://localhost:4000/v1, model mock-coach.
import { createServer } from "node:http";

const PORT = Number(process.env.PORT ?? 4000);

function send(res, status, body) {
  res.writeHead(status, {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "*",
  });
  res.end(JSON.stringify(body));
}

function reply(prompt) {
  const pick = (label) => prompt.match(new RegExp(`${label}: (.*)`))?.[1]?.trim() ?? "";
  const goal = pick("CEL");
  const milestone = pick("NAJBLIŻSZY KAMIEŃ MILOWY") || "najbliższy kamień milowy";
  const did = pick("- Co zrobiłem");
  const answer = pick("- Czy dzień przybliżył do celu");
  return {
    summary: `Dzień oceniony jako „${answer}”. ${did && !did.startsWith("(") ? `Zrobiłeś: ${did}.` : "Nie zapisałeś, co zrobiłeś."} To atrapa gatewaya — prawdziwy model napisze tu konkretne podsumowanie celu „${goal}”.`,
    nextStep: `Zarezerwuj 45 minut na: ${milestone}.`,
    motivation: "Jeden konkretny krok dziennie i cel sam się przybliża.",
  };
}

createServer((req, res) => {
  if (req.method === "OPTIONS") return send(res, 204, {});
  if (req.method === "GET" && req.url === "/v1/models") {
    return send(res, 200, { object: "list", data: [{ id: "mock-coach", object: "model" }] });
  }
  if (req.method === "POST" && req.url === "/v1/chat/completions") {
    let raw = "";
    req.on("data", (chunk) => (raw += chunk));
    req.on("end", () => {
      const body = JSON.parse(raw || "{}");
      const prompt = body.messages?.at(-1)?.content ?? "";
      console.log(`[mock] chat/completions model=${body.model}\n${prompt}\n`);
      // Symulacja modelu rozumującego: <think> + JSON w bloku kodu.
      const content = `<think>Analizuję dzień…</think>\n\`\`\`json\n${JSON.stringify(reply(prompt), null, 2)}\n\`\`\``;
      setTimeout(
        () =>
          send(res, 200, {
            id: "mock",
            object: "chat.completion",
            model: body.model ?? "mock-coach",
            choices: [{ index: 0, message: { role: "assistant", content }, finish_reason: "stop" }],
          }),
        1500,
      );
    });
    return;
  }
  send(res, 404, { error: { message: `Brak ${req.method} ${req.url}` } });
}).listen(PORT, () => console.log(`Atrapa AI Gateway: http://localhost:${PORT}/v1`));
