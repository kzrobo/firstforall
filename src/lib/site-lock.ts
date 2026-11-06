/**
 * Private-preview gate. When SITE_ACCESS_PASSWORD is set on the server, every page asks for that
 * password (HTTP Basic auth, any user name) before anything is served — the whole site stays private
 * until the team removes the variable. Unset = the public site, unchanged.
 * Runs in middleware (edge runtime), so it uses a constant-time compare written here.
 */

/** Paths that must work without the shared password (they carry their own authorisation). */
export const GATE_EXEMPT = [/^\/api\/cron\//];

function safeEqual(a: string, b: string): boolean {
  const x = new TextEncoder().encode(a), y = new TextEncoder().encode(b);
  let diff = x.length ^ y.length;
  for (let i = 0; i < Math.max(x.length, y.length); i++) diff |= (x[i] ?? 0) ^ (y[i] ?? 0);
  return diff === 0;
}

/** True when the request may pass: gate off, exempt path, or the right password. */
export function passesSiteLock(pathname: string, authorization: string | null, password: string | undefined): boolean {
  if (!password) return true;
  if (GATE_EXEMPT.some((r) => r.test(pathname))) return true;
  const m = /^Basic\s+([A-Za-z0-9+/=]+)$/i.exec(authorization ?? "");
  if (!m) return false;
  let decoded = "";
  try { decoded = atob(m[1]); } catch { return false; }
  const i = decoded.indexOf(":");
  return i >= 0 && safeEqual(decoded.slice(i + 1), password);
}
