// Maps failures of the upstream AI service (Gemini) to messages that are safe to show users.
// No remote imports and no Deno globals, so the logic can be unit-tested under Node.

export const AI_UNAVAILABLE_MESSAGE =
  "AI analysis is temporarily unavailable. Please try again later, or import a CSV, Excel or iCal file instead.";

export const AI_FAILED_MESSAGE =
  "The AI service could not process this file. Please try again later.";

/** An AI-service failure: `message` is user-facing, `detail` holds the raw upstream response for logs. */
export class AiServiceError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly detail: string,
  ) {
    super(message);
    this.name = "AiServiceError";
  }
}

/**
 * Builds the error for a non-OK Gemini response.
 * Quota, billing and rate-limit failures (402, 429) become a 503 "unavailable";
 * anything else becomes a 502 with a generic message. The raw body never reaches the user.
 */
export function geminiError(upstreamStatus: number, body: string): AiServiceError {
  const detail = `Gemini API error ${upstreamStatus}: ${body}`;
  if (upstreamStatus === 402 || upstreamStatus === 429) {
    return new AiServiceError(AI_UNAVAILABLE_MESSAGE, 503, detail);
  }
  return new AiServiceError(AI_FAILED_MESSAGE, 502, detail);
}
