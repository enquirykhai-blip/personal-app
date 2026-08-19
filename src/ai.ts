export type AiProvider = "gemini" | "openrouter";

/** OpenRouter keys are prefixed; anything else is treated as a Google AI Studio key. */
export function detectProvider(apiKey: string): AiProvider {
  return apiKey.trim().startsWith("sk-or-") ? "openrouter" : "gemini";
}

export const DEFAULT_OPENROUTER_MODEL = "openai/gpt-4o-mini";

const PROMPT = (taskText: string) =>
  `Pecahkan tugasan ini kepada 3-6 langkah kecil, spesifik, dan boleh disiapkan dengan cepat. ` +
  `Guna Bahasa Melayu santai. Balas JSON sahaja: {"langkah": ["...", "..."]}. ` +
  `Tugasan: "${taskText}"`;

/** Models sometimes wrap JSON in markdown fences or prose; recover the payload. */
function parseSteps(raw: string): string[] {
  const cleaned = raw.trim().replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();
  let data: unknown;
  try {
    data = JSON.parse(cleaned);
  } catch {
    const match = cleaned.match(/\[[\s\S]*\]|\{[\s\S]*\}/);
    if (!match) throw new Error("AI tidak mengembalikan senarai langkah yang sah.");
    data = JSON.parse(match[0]);
  }

  const list = Array.isArray(data)
    ? data
    : Array.isArray((data as { langkah?: unknown })?.langkah)
      ? (data as { langkah: unknown[] }).langkah
      : Array.isArray((data as { steps?: unknown })?.steps)
        ? (data as { steps: unknown[] }).steps
        : null;

  if (!list) throw new Error("AI tidak mengembalikan senarai langkah yang sah.");
  return list
    .map((s) => (typeof s === "string" ? s.trim() : ""))
    .filter((s) => s.length > 0)
    .slice(0, 8);
}

async function failure(res: Response, fallbackLabel: string): Promise<Error> {
  const body = await res.text().catch(() => "");
  let message = `${fallbackLabel} (${res.status})`;
  try {
    const parsed = JSON.parse(body);
    const detail = parsed?.error?.message ?? parsed?.message;
    if (typeof detail === "string" && detail.trim()) message = detail;
  } catch {
    // Non-JSON error body; keep the status-based message.
  }
  if (res.status === 401 || res.status === 403) message = `API key ditolak. ${message}`;
  if (res.status === 429) message = `Had penggunaan dicapai. ${message}`;
  return new Error(message);
}

async function send(url: string, init: RequestInit, host: string): Promise<Response> {
  try {
    return await fetch(url, init);
  } catch {
    throw new Error(`Tidak dapat sambung ke ${host}. Semak sambungan internet anda.`);
  }
}

async function viaGemini(apiKey: string, taskText: string): Promise<string[]> {
  const res = await send(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${encodeURIComponent(apiKey)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: PROMPT(taskText) }] }],
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: { type: "ARRAY", items: { type: "STRING" } },
        },
      }),
    },
    "Gemini API",
  );

  if (!res.ok) throw await failure(res, "Ralat Gemini");
  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (typeof text !== "string" || !text.trim()) throw new Error("Tiada respons daripada AI.");
  return parseSteps(text);
}

async function viaOpenRouter(apiKey: string, taskText: string, model: string): Promise<string[]> {
  const res = await send(
    "https://openrouter.ai/api/v1/chat/completions",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "X-Title": "My Space",
      },
      body: JSON.stringify({
        model,
        messages: [{ role: "user", content: PROMPT(taskText) }],
        response_format: { type: "json_object" },
      }),
    },
    "OpenRouter",
  );

  if (!res.ok) throw await failure(res, "Ralat OpenRouter");
  const data = await res.json();
  const text = data?.choices?.[0]?.message?.content;
  if (typeof text !== "string" || !text.trim()) throw new Error("Tiada respons daripada AI.");
  return parseSteps(text);
}

export async function generateSubtasks(
  apiKey: string,
  taskText: string,
  model: string = DEFAULT_OPENROUTER_MODEL,
): Promise<string[]> {
  const key = apiKey.trim();
  return detectProvider(key) === "openrouter"
    ? viaOpenRouter(key, taskText, model.trim() || DEFAULT_OPENROUTER_MODEL)
    : viaGemini(key, taskText);
}
