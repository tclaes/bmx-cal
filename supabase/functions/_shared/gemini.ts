// Gemini model used by the AI import functions (analyze-image, analyze-pdf).
// Change it here when Google retires a model; both functions follow.

export const GEMINI_MODEL = "gemini-3.8-flash";

export function geminiGenerateContentUrl(apiKey: string): string {
  return `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`;
}
