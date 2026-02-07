function setCookie(res, name, value, opts = {}) {
  const parts = [`${name}=${encodeURIComponent(value)}`];
  parts.push(`Path=${opts.path || "/"}`);
  if (opts.maxAge !== undefined) parts.push(`Max-Age=${opts.maxAge}`);
  if (opts.httpOnly) parts.push("HttpOnly");
  if (opts.secure) parts.push("Secure");
  if (opts.sameSite) parts.push(`SameSite=${opts.sameSite}`);
  res.setHeader("Set-Cookie", parts.join("; "));
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
      const err = data?.error ? String(data.error) : "invalid";
      return res.redirect(`/verify?error=${encodeURIComponent(err)}`);
    }

    const sessionToken = data?.sessionToken || data?.sessionJwt || "";
    if (!sessionToken) return res.redirect("/verify?error=invalid");

    const secure = process.env.NODE_ENV === "production";
    setCookie(res, "elora_session", sessionToken, {
      httpOnly: true,
      secure,
      sameSite: "Lax",
      maxAge: 60 * 60 * 24 * 30,
    });

    return res.redirect(`/verified?email=${encodeURIComponent(data.email || "")}`);
  } catch {
    return res.redirect("/verify?error=backend_unreachable");
  }
}
