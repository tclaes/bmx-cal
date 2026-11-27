const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '[::1]', '::1']);

/** Throws unless the URL points at this machine. Call before any write. */
export function assertLocal(url: string | undefined): void {
  if (!url) throw new Error('Supabase URL is not set; refusing to continue.');
  let host: string;
  try {
    host = new URL(url).hostname;
  } catch {
    throw new Error(`Invalid Supabase URL "${url}"; refusing to continue.`);
  }
  if (!LOCAL_HOSTS.has(host)) {
    throw new Error(`Refusing to run against non-local Supabase URL (${host}). Test tooling only works on localhost.`);
  }
}
