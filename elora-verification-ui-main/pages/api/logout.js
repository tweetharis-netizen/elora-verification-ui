function cookieParts(name, value, opts = {}) {
  const parts = [`${name}=${encodeURIComponent(value)}`];
  parts.push("Path=/");
  if (opts.domain) parts.push(`Domain=${opts.domain}`);
  parts.push("HttpOnly");
  parts.push("SameSite=Lax");
  parts.push("Max-Age=0");
  const proto = String(opts.proto || "");
  const secure = proto === "https" || process.env.NODE_ENV === "production";
  if (secure) parts.push("Secure");
  return parts.join("; ");
}

function getCookieDomainFromHost(host) {
  const h = String(host || "").trim().toLowerCase();
  if (!h) return null;
  if (h.startsWith("localhost") || h.startsWith("127.0.0.1")) return null;

  if (h.endsWith(".vercel.app")) {
    const parts = h.split(".");
    const base = parts.slice(1).join(".");
    if (!base || base === "vercel.app") return null;
    return `.${base}`;
  }
  return null;
}

export default function handler(req, res) {
  const proto = String(req.headers["x-forwarded-proto"] || "");
  const domain = getCookieDomainFromHost(req.headers.host);

  // Clear host cookie + preview-domain cookie
  const cookies = [
    cookieParts("elora_session", "", { proto }),
    domain ? cookieParts("elora_session", "", { proto, domain }) : null,
  ].filter(Boolean);

  res.setHeader("Set-Cookie", cookies);
  return res.status(200).json({ ok: true });
}
