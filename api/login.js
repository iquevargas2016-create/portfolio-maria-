// POST /api/login  { password }  ->  { token }
//
// Checks the password against the ADMIN_PASSWORD environment variable
// and, on success, issues a signed, time-limited token (HMAC-SHA256,
// no external dependencies) that /api/save-content will require.

const crypto = require("crypto");

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const adminPassword = process.env.ADMIN_PASSWORD;
  const sessionSecret = process.env.SESSION_SECRET;

  if (!adminPassword || !sessionSecret) {
    res.status(500).json({
      error:
        "Server not configured yet: set ADMIN_PASSWORD and SESSION_SECRET as environment variables in Vercel.",
    });
    return;
  }

  let body = req.body;
  if (typeof body === "string") {
    try {
      body = JSON.parse(body);
    } catch (e) {
      body = {};
    }
  }
  const password = body && body.password;

  if (!password || password !== adminPassword) {
    res.status(401).json({ error: "Senha incorreta." });
    return;
  }

  const expiry = Date.now() + 1000 * 60 * 60 * 4; // 4 hours
  const signature = crypto
    .createHmac("sha256", sessionSecret)
    .update(String(expiry))
    .digest("hex");

  res.status(200).json({ token: `${expiry}.${signature}` });
};
