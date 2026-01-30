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
  if (req.method !== "POST" && req.method !== "GET") return sendJson(res, 405, { ok: false, error: "Method not allowed" });

  const VERIFY_SECRET = process.env.ELORA_VERIFY_JWT_SECRET;
  const SESSION_SECRET = process.env.ELORA_SESSION_JWT_SECRET;
  if (!VERIFY_SECRET) return sendJson(res, 500, { ok: false, error: "Missing ELORA_VERIFY_JWT_SECRET" });
  if (!SESSION_SECRET) return sendJson(res, 500, { ok: false, error: "Missing ELORA_SESSION_JWT_SECRET" });

  let token;
  if (req.method === "GET") {
    token = req.query.token || "";
  } else {
    let body;
    try {
      body = await readBody(req);
      token = body.token || "";
    } catch {
      return sendJson(res, 400, { ok: false, error: "Invalid JSON body" });
    }
  }

  token = String(token);
  if (!token) {
    if (req.method === "GET") {
      // For GET requests, show a user-friendly HTML error page
      res.setHeader("Content-Type", "text/html");
      return res.end(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Verification Error - Elora</title>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <style>
              body { font-family: ui-sans-serif, system-ui, sans-serif; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); min-height: 100vh; display: flex; align-items: center; justify-content: center; margin: 0; }
              .card { background: white; border-radius: 20px; padding: 2rem; box-shadow: 0 20px 40px rgba(0,0,0,0.1); text-align: center; max-width: 400px; }
              .icon { font-size: 3rem; margin-bottom: 1rem; }
              h1 { color: #333; margin-bottom: 1rem; }
              p { color: #666; margin-bottom: 1.5rem; line-height: 1.5; }
              .btn { display: inline-block; background: linear-gradient(135deg, #667eea, #764ba2); color: white; text-decoration: none; padding: 0.75rem 1.5rem; border-radius: 12px; font-weight: 600; }
            </style>
          </head>
          <body>
            <div class="card">
              <div class="icon">❌</div>
              <h1>Verification Link Invalid</h1>
              <p>This verification link is missing or invalid. Please request a new verification email.</p>
              <a href="/verify" class="btn">Request New Email</a>
            </div>
          </body>
        </html>
      `);
    }
    return sendJson(res, 400, { ok: false, error: "Missing token" });
  }

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

  // Set the session cookie for better UX
  res.setHeader("Set-Cookie", `elora_session=${sessionJwt}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${30 * 24 * 60 * 60}`);

  if (req.method === "GET") {
    // For GET requests, show a user-friendly HTML success page
    const redirectUrl = req.query.redirect ? decodeURIComponent(req.query.redirect) : "/dashboard";
    res.setHeader("Content-Type", "text/html");
    return res.end(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Email Verified - Elora</title>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            body { font-family: ui-sans-serif, system-ui, sans-serif; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); min-height: 100vh; display: flex; align-items: center; justify-content: center; margin: 0; }
            .card { background: white; border-radius: 20px; padding: 2rem; box-shadow: 0 20px 40px rgba(0,0,0,0.1); text-align: center; max-width: 400px; }
            .icon { font-size: 3rem; margin-bottom: 1rem; }
            h1 { color: #333; margin-bottom: 1rem; }
            p { color: #666; margin-bottom: 1.5rem; line-height: 1.5; }
            .btn { display: inline-block; background: linear-gradient(135deg, #667eea, #764ba2); color: white; text-decoration: none; padding: 0.75rem 1.5rem; border-radius: 12px; font-weight: 600; }
            .email { background: #f3f4f6; padding: 0.5rem 1rem; border-radius: 8px; font-family: monospace; font-size: 0.9rem; margin: 1rem 0; }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="icon">✅</div>
            <h1>Email Verified!</h1>
            <p>Your email <strong>${email}</strong> has been successfully verified.</p>
            <p>You now have access to all features including exports, assessments, and more.</p>
            <a href="${redirectUrl}" class="btn">Continue to Dashboard</a>
          </div>
        </body>
      </html>
    `);
  }

  return sendJson(res, 200, { 
    ok: true, 
    email, 
    message: "Email verified successfully! You now have access to all features.",
    verified: true
  });
};
