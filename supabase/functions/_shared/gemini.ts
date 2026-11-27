// Gemini client used by the AI import functions (analyze-image, analyze-pdf): model choice,
// retries and the mapping of upstream failures to messages that are safe to show users.
// No imports and no Deno globals (fetch and sleep are injectable), so the logic can be
// unit-tested under Node. Change the model here when Google retires one.

export const GEMINI_MODEL = "gemini-3.8-flash";

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
 * Billing, rate-limit and overload failures (402, 429, 503) become a 503 "unavailable";
 * anything else becomes a 502 with a generic message. The raw body never reaches the user.
 */
export function geminiError(upstreamStatus: number, body: string): AiServiceError {
  const detail = `Gemini API error ${upstreamStatus}: ${body}`;
  if (upstreamStatus === 402 || upstreamStatus === 429 || upstreamStatus === 503) {
    return new AiServiceError(AI_UNAVAILABLE_MESSAGE, 503, detail);
  }
  return new AiServiceError(AI_FAILED_MESSAGE, 502, detail);
}

/** Upstream statuses worth retrying: rate limit, internal error, overloaded. */
const RETRYABLE_STATUSES = new Set([429, 500, 503]);

/** The generateContent endpoint for `model`. It carries no secret: the key goes in a header. */
export function geminiGenerateContentUrl(model: string = GEMINI_MODEL): string {
  return `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
}

/** Request headers for Gemini; the API key is sent as `x-goog-api-key` so it never appears in a URL. */
export function geminiHeaders(apiKey: string): Record<string, string> {
  return {
    "Content-Type": "application/json",
    "x-goog-api-key": apiKey,
  };
}

export interface GeminiResponse {
  candidates: Array<{ content: { parts: Array<{ text: string }> } }>;
}

export interface GeminiCallOptions {
  /** Model tried after the primary one keeps failing with a retryable status. Ignored when empty. */
  fallbackModel?: string;
  /** Attempts per model, including the first. */
  maxAttempts?: number;
  /** Delay before the first retry; doubles on each further retry. */
  baseDelayMs?: number;
  fetchImpl?: typeof fetch;
  sleep?: (ms: number) => Promise<void>;
}

const defaultSleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/**
 * Calls generateContent, retrying overloads and rate limits (429, 500, 503) with exponential
 * backoff, then trying `fallbackModel` if one is set. A non-retryable failure of the primary
 * model throws at once. Throws an `AiServiceError` when every attempt fails;
 * its status reflects the primary model's last failure and its detail lists every attempt.
 */
export async function generateGeminiContent(
  apiKey: string,
  body: unknown,
  options: GeminiCallOptions = {},
): Promise<GeminiResponse> {
  const {
    fallbackModel,
    maxAttempts = 3,
    baseDelayMs = 1000,
    fetchImpl = fetch,
    sleep = defaultSleep,
  } = options;

  const models = [GEMINI_MODEL];
  if (fallbackModel && fallbackModel !== GEMINI_MODEL) models.push(fallbackModel);

  const failures: string[] = [];
  let primaryStatus = 0;

  for (const [modelIndex, model] of models.entries()) {
    const isPrimary = modelIndex === 0;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      let status = 0;
      let text: string;
      try {
        const response = await fetchImpl(geminiGenerateContentUrl(model), {
          method: "POST",
          headers: geminiHeaders(apiKey),
          body: JSON.stringify(body),
        });
        if (response.ok) return (await response.json()) as GeminiResponse;
        status = response.status;
        text = await response.text();
      } catch (error) {
        // Network failure: retry like an overload.
        text = error instanceof Error ? error.message : String(error);
      }

      failures.push(`${model} attempt ${attempt}: ${status || "network error"} ${text}`);
      if (isPrimary) primaryStatus = status;

      const retryable = status === 0 || RETRYABLE_STATUSES.has(status);
      if (!retryable) {
        if (isPrimary) throw geminiError(status, failures.join("\n"));
        break; // a broken fallback model: report the primary model's failure
      }
      if (attempt < maxAttempts) await sleep(baseDelayMs * 2 ** (attempt - 1));
    }
  }

  throw geminiError(primaryStatus, failures.join("\n"));
}
