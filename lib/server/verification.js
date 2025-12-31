// lib/server/verification.js
// Server-side helpers for gating protected Next API routes by verification state.

const COOKIE_NAME = "elora_session";

function parseCookies(req) {
  const header = String(req?.headers?.cookie || "");
  const out = {};
  header.split(";").forEach((part) => {
    const [k, ...rest] = part.trim().split("=");
    if (!k) return;
    out[k] = decodeURIComponent(rest.join("=") || "");
  });
  return out;
}

export function getBackendBaseUrl() {
  return (process.env.NEXT_PUBLIC_ELORA_BACKEND_URL || "https://elora-website.vercel.app").replace(/\/$/, "");
}

export function getSessionTokenFromReq(req) {
  const cookies = parseCookies(req);
  return String(cookies[COOKIE_NAME] || "");
}

export function makeSessionCookie(token, opts = {}) {
  const maxAge = Number.isFinite(opts.maxAge) ? opts.maxAge : 60 * 60 * 24 * 30; // 30d
  const secure =
    opts.secure != null ? !!opts.secure : process.env.NODE_ENV === "production";

  const parts = [`${COOKIE_NAME}=${encodeURIComponent(String(token || ""))}`];
  parts.push("Path=/");
  parts.push(`Max-Age=${maxAge}`);
  parts.push("HttpOnly");
  parts.push("SameSite=Lax");
  if (secure) parts.push("Secure");
  return parts.join("; ");
}

export function clearSessionCookie() {
  const secure = process.env.NODE_ENV === "production";
  const parts = [`${COOKIE_NAME}=`];
  parts.push("Path=/");
  parts.push("Max-Age=0");
  parts.push("HttpOnly");
  parts.push("SameSite=Lax");
  if (secure) parts.push("Secure");
  return parts.join("; ");
}

export async function fetchBackendStatus(sessionToken) {
  if (!sessionToken) return { ok: true, verified: false, email: "" };

  const base = getBackendBaseUrl();
  try {
    const r = await fetch(`${base}/api/verification/status`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${sessionToken}`,
      },
    });

    const data = await r.json().catch(() => null);

    if (!r.ok) return { ok: true, verified: false, email: "" };

    return {
      ok: true,
      verified: Boolean(data?.verified),
      email: String(data?.email || ""),
    };
  } catch {
    return { ok: true, verified: false, email: "" };
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
