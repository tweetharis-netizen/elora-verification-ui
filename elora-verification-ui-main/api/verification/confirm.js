const jwt = require("jsonwebtoken");

function sendJson(res, code, obj) {
  res.statusCode = code;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(obj));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", (c) => (data += c));
    req.on("end", () => {
      try {
        resolve(data ? JSON.parse(data) : {});
      } catch (e) {
        reject(e);
      }
    });
  });
}

module.exports = async function handler(req, res) {
  if (req.method !== "POST") return sendJson(res, 405, { ok: false, error: "Method not allowed" });

  const VERIFY_SECRET = process.env.ELORA_VERIFY_JWT_SECRET;
  const SESSION_SECRET = process.env.ELORA_SESSION_JWT_SECRET;
  if (!VERIFY_SECRET) return sendJson(res, 500, { ok: false, error: "Missing ELORA_VERIFY_JWT_SECRET" });
  if (!SESSION_SECRET) return sendJson(res, 500, { ok: false, error: "Missing ELORA_SESSION_JWT_SECRET" });

  let body;
  try {
    body = await readBody(req);
  } catch {
    return sendJson(res, 400, { ok: false, error: "Invalid JSON body" });
  }

  const token = String(body.token || "");
  if (!token) return sendJson(res, 400, { ok: false, error: "Missing token" });

  let payload;
  try {
    payload = jwt.verify(token, VERIFY_SECRET);
  } catch (e) {
    const msg = e?.name === "TokenExpiredError" ? "expired" : "invalid";
    return sendJson(res, 400, { ok: false, error: msg });
  }

  if (payload?.purpose !== "verify" || !payload?.email) {
    return sendJson(res, 400, { ok: false, error: "invalid" });
  }

  const email = String(payload.email).toLowerCase();

  // Issue a verified session JWT (this is what the frontend stores as httpOnly cookie)
  const sessionJwt = jwt.sign(
    { v: 1, email, purpose: "verified_session" },
    SESSION_SECRET,
    { expiresIn: "30d" }
  );

  return sendJson(res, 200, { ok: true, email, sessionJwt });
};
