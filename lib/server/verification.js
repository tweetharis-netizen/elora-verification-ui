// lib/server/verification.js
// Server-only helpers used by Next.js API routes.
//
// IMPORTANT:
// - The backend (Repo B) is the source of truth for verification + role.
// - The UI domain stores the session token in an httpOnly cookie (elora_session).
// - Frontend pages should call /api/session/status to read server-backed state.

const SESSION_COOKIE = "elora_session";

const DEFAULT_MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 days

function parseCookies(req) {
  const header = req?.headers?.cookie || "";
  const out = {};
  header.split(";").forEach((part) => {
    const [k, ...rest] = part.trim().split("=");
    if (!k) return;
    out[k] = decodeURIComponent(rest.join("=") || "");
  });
  return out;
}

function makeCookie(name, value, { maxAgeSeconds = DEFAULT_MAX_AGE_SECONDS } = {}) {
  const secure = process.env.NODE_ENV === "production";
  const parts = [
    `${name}=${encodeURIComponent(value)}`,
    `Path=/`,
    `HttpOnly`,
    `SameSite=Lax`,
    `Max-Age=${maxAgeSeconds}`,
  ];
  if (secure) parts.push("Secure");
  return parts.join("; ");
}

export function getSessionTokenFromReq(req) {
  const cookies = parseCookies(req);
  return cookies[SESSION_COOKIE] || "";
}

export function makeSessionCookie(token, { maxAgeSeconds = DEFAULT_MAX_AGE_SECONDS } = {}) {
  return makeCookie(SESSION_COOKIE, token, { maxAgeSeconds });
}

export function clearSessionCookie() {
  return makeCookie(SESSION_COOKIE, "", { maxAgeSeconds: 0 });
}

export function getBackendBaseUrl() {
  return (
    process.env.NEXT_PUBLIC_ELORA_BACKEND_URL ||
    process.env.ELORA_BACKEND_URL ||
    "https://elora-website.vercel.app"
  ).replace(/\/$/, "");
}

export async function fetchBackendStatus(sessionToken) {
  const backend = getBackendBaseUrl();
  if (!sessionToken) return { ok: true, verified: false, role: "guest", email: "" };

  try {
    const r = await fetch(`${backend}/api/verification/status`, {
      method: "GET",
      headers: { Authorization: `Bearer ${sessionToken}` },
      cache: "no-store",
    });
    const data = await r.json().catch(() => null);

    // Backend returns { ok:true, verified:boolean, email?, role? }
    if (!r.ok || !data?.ok) return { ok: true, verified: false, role: "guest", email: "" };

    return {
      ok: true,
      verified: Boolean(data?.verified),
      email: String(data?.email || ""),
      role: String(data?.role || (data?.verified ? "regular" : "guest")),
    };
  } catch {
    // Keep UI stable even if backend is down
    return { ok: true, verified: false, role: "guest", email: "" };
  }
}

export async function requireVerified(req, res) {
  const token = getSessionTokenFromReq(req);
  const status = await fetchBackendStatus(token);
  if (!status.verified) {
    res.status(403).json({ ok: false, error: "not_verified" });
    return null;
  }
  return status;
}
