// Gemini model used by the AI import functions (analyze-image, analyze-pdf).
// Change it here when Google retires a model; both functions follow.

export const GEMINI_MODEL = "gemini-3.8-flash";

/** The generateContent endpoint. It carries no secret: the key goes in a header (see `geminiHeaders`). */
export function geminiGenerateContentUrl(): string {
  return `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;
}

/** Request headers for Gemini; the API key is sent as `x-goog-api-key` so it never appears in a URL. */
export function geminiHeaders(apiKey: string): Record<string, string> {
  return {
    "Content-Type": "application/json",
    "x-goog-api-key": apiKey,
  };
}
