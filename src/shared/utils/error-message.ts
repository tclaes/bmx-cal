/**
 * Converts a thrown error into a message that is safe to show to a visitor.
 *
 * Errors coming back from the database or the auth service contain internal
 * detail (table names, column names, policy and constraint names) that must
 * never reach the interface. Only a small set of known, user-actionable auth
 * messages is passed through; everything else falls back to a generic sentence.
 */

const SAFE_MESSAGE_PATTERNS: Array<{ match: RegExp; message: string }> = [
  { match: /invalid login credentials/i, message: 'Incorrect email address or password.' },
  { match: /email not confirmed/i, message: 'Please confirm your email address first.' },
  { match: /password should be at least/i, message: 'Please choose a longer password.' },
  { match: /same as the old password/i, message: 'Please choose a different password.' },
  { match: /rate limit|too many requests|too many messages/i, message: 'Too many attempts. Please try again in a few minutes.' },
  { match: /network|failed to fetch/i, message: 'Could not reach the server. Please check your connection and try again.' },
];

export function toUserMessage(error: unknown, fallback: string): string {
  const raw = error instanceof Error ? error.message : '';

  for (const { match, message } of SAFE_MESSAGE_PATTERNS) {
    if (match.test(raw)) return message;
  }

  return fallback;
}
