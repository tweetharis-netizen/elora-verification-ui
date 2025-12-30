function normalizeCodes(raw) {
  return String(raw || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export default function handler(req, res) {
  const codes = normalizeCodes(process.env.TEACHER_INVITE_CODES);
  const code =
    req.method === "GET"
      ? String(req.query?.code || "").trim()
      : String(req.body?.code || "").trim();

  if (req.method !== "GET" && req.method !== "POST") {
    res.setHeader("Allow", "GET, POST");
    return res.status(405).json({ ok: false });
  }

  if (!code) return res.status(400).json({ ok: false });

  const ok = codes.includes(code);
  return res.status(200).json({ ok });
}
