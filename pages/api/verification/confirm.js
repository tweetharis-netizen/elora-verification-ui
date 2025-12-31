function setCookie(res, name, value, opts = {}) {
  const parts = [`${name}=${encodeURIComponent(value)}`];
  parts.push(`Path=${opts.path || "/"}`);
  if (opts.domain) parts.push(`Domain=${opts.domain}`);
  if (opts.maxAge !== undefined) parts.push(`Max-Age=${opts.maxAge}`);
  if (opts.httpOnly) parts.push("HttpOnly");
  if (opts.secure) parts.push("Secure");
  if (opts.sameSite) parts.push(`SameSite=${opts.sameSite}`);
  res.setHeader("Set-Cookie", parts.join("; "));
}

function getCookieDomainFromHost(host) {
  // Persist verification across Vercel preview deployments in SAME team base domain.
  // Example:
  //   elora-verification-xxxxx-haris-projects-20c5a383.vercel.app
  // => Domain=.haris-projects-20c5a383.vercel.app
  // Do NOT set Domain=.vercel.app (public suffix; rejected by browsers).
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

export default async function handler(req, res) {
  const backend = (process.env.NEXT_PUBLIC_ELORA_BACKEND_URL || "https://elora-website.vercel.app").replace(/\/$/, "");
  const token = typeof req.query.token === "string" ? req.query.token : "";

  if (!token) return res.redirect("/verify?error=invalid");

  try {
    const r = await fetch(`${backend}/api/verification/confirm`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    });

    const data = await r.json().catch(() => null);

    if (!r.ok || !data?.ok) {
      return res.redirect(`/verify?error=${encodeURIComponent(data?.error || "invalid")}`);
    }

    const proto = String(req.headers["x-forwarded-proto"] || "");
    const secure = proto === "https" || process.env.NODE_ENV === "production";
    const domain = getCookieDomainFromHost(req.headers.host);

    setCookie(res, "elora_session", data.sessionJwt, {
      path: "/",
      domain: domain || undefined,
      httpOnly: true,
      secure,
      sameSite: "Lax",
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });

    return res.redirect(`/verified?email=${encodeURIComponent(data.email || "")}`);
  } catch {
    return res.redirect("/verify?error=backend_unreachable");
  }
}
