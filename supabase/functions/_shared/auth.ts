// Shared caller identification for edge functions.
// Network access is injected (see `getUser`), so this file has no remote imports
// and can be unit-tested under Node.

export interface CallerUser {
  id: string;
  // supabase-js types this as an open record; only `role` is read here.
  app_metadata?: Record<string, unknown> | null;
}

export type Caller =
  | { kind: "scheduled" }
  | { kind: "user"; user: CallerUser }
  | { kind: "anonymous" };

/** The raw Authorization header, or "" when absent. */
export function getAuthHeader(req: Request): string {
  return req.headers.get("Authorization") ?? "";
}

/**
 * The token of a `Bearer <token>` header, or "" when absent or malformed.
 * The scheme is matched case-insensitively (RFC 9110); the token keeps its case.
 */
export function getBearerToken(req: Request): string {
  const match = /^bearer\s+(.+)$/i.exec(getAuthHeader(req).trim());
  return match ? match[1].trim() : "";
}

export function isAdmin(user: CallerUser | null | undefined): boolean {
  return user?.app_metadata?.role === "admin";
}

/**
 * True for the scheduler: the service-role key, or the function's shared cron token
 * from `cron_auth_tokens`. An empty bearer or an unset secret never matches.
 */
export function isScheduledBearer(
  bearer: string,
  secrets: { serviceRoleKey?: string; cronToken?: string },
): boolean {
  if (bearer.length === 0) return false;
  const { serviceRoleKey = "", cronToken = "" } = secrets;
  if (serviceRoleKey.length > 0 && bearer === serviceRoleKey) return true;
  return cronToken.length > 0 && bearer === cronToken;
}

/**
 * Works out who is calling. The scheduler is recognised without a user lookup;
 * otherwise `getUser` (a client built from the caller's Authorization header) decides
 * between a signed-in user and an anonymous caller.
 */
export async function identifyCaller(
  req: Request,
  deps: {
    serviceRoleKey?: string;
    cronToken?: string;
    getUser: () => Promise<CallerUser | null>;
  },
): Promise<Caller> {
  if (isScheduledBearer(getBearerToken(req), deps)) {
    return { kind: "scheduled" };
  }
  const user = await deps.getUser();
  return user ? { kind: "user", user } : { kind: "anonymous" };
}
