// Shared CORS helpers for edge functions.
// No remote imports and no Deno globals, so the logic can be unit-tested under Node.

const ALLOWED_HEADERS = "Content-Type, Authorization, X-Client-Info, Apikey";

export function buildCorsHeaders(methods = "POST, OPTIONS"): Record<string, string> {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": methods,
    "Access-Control-Allow-Headers": ALLOWED_HEADERS,
  };
}

/** Default headers: POST + preflight. */
export const corsHeaders = buildCorsHeaders();

/** Answers an OPTIONS preflight, or returns null when the request is something else. */
export function handlePreflight(req: Request, headers: Record<string, string> = corsHeaders): Response | null {
  if (req.method !== "OPTIONS") return null;
  return new Response(null, { status: 200, headers });
}

/** JSON response that always carries the CORS headers. */
export function jsonResponse(
  body: unknown,
  status = 200,
  headers: Record<string, string> = corsHeaders,
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...headers, "Content-Type": "application/json" },
  });
}
