export async function generateSubtasks(apiKey: string, taskText: string): Promise<string[]> {
  let res: Response;
  try {
    res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${encodeURIComponent(apiKey)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `Pecahkan tugasan berikut kepada 3-6 langkah kecil yang mudah, spesifik dan boleh disiapkan dengan cepat, dalam Bahasa Melayu santai. Tugasan: "${taskText}"`,
                },
              ],
            },
          ],
          generationConfig: {
            responseMimeType: "application/json",
            responseSchema: { type: "ARRAY", items: { type: "STRING" } },
          },
        }),
      },
    );
  } catch {
    throw new Error("Tidak dapat sambung ke Gemini API. Semak sambungan internet anda.");
  }

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    let message = `Ralat API (${res.status})`;
    try {
      const parsed = JSON.parse(body);
      if (parsed?.error?.message) message = parsed.error.message;
    } catch {
      // ignore parse failure, use default message
    }
    throw new Error(message);
  }

  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error("Tiada respons daripada AI.");

  const parsed = JSON.parse(text);
  if (!Array.isArray(parsed)) throw new Error("Format respons tidak sah.");
  return parsed.filter((s): s is string => typeof s === "string" && s.trim().length > 0);
}
