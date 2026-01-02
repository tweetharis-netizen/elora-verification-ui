// lib/server/verification.js
// Utilities used by Next.js API routes (server-only).

const SESSION_COOKIE = "elora_session";
const TEACHER_COOKIE = "elora_teacher";

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

export function getTeacherCookieFromReq(req) {
  const cookies = parseCookies(req);
  return cookies[TEACHER_COOKIE] || "";
}

export function makeTeacherCookie({ maxAgeSeconds = DEFAULT_MAX_AGE_SECONDS } = {}) {
  // Value is just a flag. We still gate its meaning on verified session.
  return makeCookie(TEACHER_COOKIE, "1", { maxAgeSeconds });
}

export function clearTeacherCookie() {
  return makeCookie(TEACHER_COOKIE, "", { maxAgeSeconds: 0 });
}

export function getBackendBaseUrl() {
  return (
    process.env.NEXT_PUBLIC_ELORA_BACKEND_URL ||
    process.env.ELORA_BACKEND_URL ||
    "https://elora-website.vercel.app"
  ).replace(/\/$/, "");
}

export async function fetchBackendStatus(sessionToken) {
  if (!sessionToken) return { verified: false, email: "" };

  const base = getBackendBaseUrl();
  try {
    const r = await fetch(`${base}/api/verification/status`, {
      headers: { Authorization: `Bearer ${sessionToken}` },
      cache: "no-store",
    });
    const data = await r.json().catch(() => null);
    if (!r.ok) return { verified: false, email: "" };
    return {
      verified: Boolean(data?.verified),
      email: String(data?.email || ""),
    };
  } catch {
    return { verified: false, email: "" };
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
