// lib/server/verification.js
const COOKIE_NAME = "elora_session";

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

export function getSessionTokenFromReq(req) {
  const cookies = parseCookies(req);
  return cookies[COOKIE_NAME] || "";
}

export function makeSessionCookie(token, { maxAgeSeconds = 60 * 60 * 24 * 30 } = {}) {
  const secure = process.env.NODE_ENV === "production";
  const parts = [
    `${COOKIE_NAME}=${encodeURIComponent(token)}`,
    `Path=/`,
    `HttpOnly`,
    `SameSite=Lax`,
    `Max-Age=${maxAgeSeconds}`,
  ];
  if (secure) parts.push("Secure");
  return parts.join("; ");
}

export function clearSessionCookie() {
  const secure = process.env.NODE_ENV === "production";
  const parts = [
    `${COOKIE_NAME}=`,
    `Path=/`,
    `HttpOnly`,
    `SameSite=Lax`,
    `Max-Age=0`,
  ];
  if (secure) parts.push("Secure");
  return parts.join("; ");
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
    res.status(403).json({ error: "Email verification required." });
    return null;
  }
  return status;
}
