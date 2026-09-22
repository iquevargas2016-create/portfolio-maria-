// POST /api/save-photo  { token, imageBase64 }  ->  { ok: true }
//
// Verifies the session token issued by /api/login, then commits the
// new profile photo straight to photo.jpg in the GitHub repo via the
// GitHub Contents API — the same mechanism /api/save-content uses for
// content.json. The admin panel always resizes/compresses the image
// to a JPEG client-side before sending, so this endpoint always
// overwrites photo.jpg regardless of the original file type — no
// change to index.html (which always points at photo.jpg) is needed.

const crypto = require("crypto");

function verifyToken(token, secret) {
  if (!token || typeof token !== "string") return false;
  const parts = token.split(".");
  if (parts.length !== 2) return false;
  const [expiryStr, signature] = parts;
  const expiry = Number(expiryStr);
  if (!expiry || Number.isNaN(expiry) || Date.now() > expiry) return false;

  const expected = crypto.createHmac("sha256", secret).update(expiryStr).digest("hex");
  try {
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
  } catch (e) {
    return false; // different length -> definitely not equal
  }
}

// ~4.5MB of base64 text (~3.3MB raw bytes) — generous for a resized
// portrait photo, while staying under typical serverless payload caps
// so a too-large upload gets a friendly Portuguese error instead of a
// platform-level failure.
const MAX_BASE64_LENGTH = 4500000;

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const sessionSecret = process.env.SESSION_SECRET;
  const githubToken = process.env.GITHUB_TOKEN;
  const owner = process.env.GITHUB_OWNER;
  const repo = process.env.GITHUB_REPO;
  const branch = process.env.GITHUB_BRANCH || "main";

  if (!sessionSecret || !githubToken || !owner || !repo) {
    res.status(500).json({
      error:
        "Server not configured yet: set SESSION_SECRET, GITHUB_TOKEN, GITHUB_OWNER and GITHUB_REPO as environment variables in Vercel.",
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
  const { token, imageBase64 } = body || {};

  if (!verifyToken(token, sessionSecret)) {
    res.status(401).json({ error: "Sessão inválida ou expirada. Faça login novamente." });
    return;
  }

  if (!imageBase64 || typeof imageBase64 !== "string") {
    res.status(400).json({ error: "Nenhuma imagem recebida." });
    return;
  }

  // The browser sends a data URL (e.g. "data:image/jpeg;base64,...");
  // GitHub's API just wants the base64 payload itself.
  const base64Data = imageBase64.indexOf(",") !== -1 ? imageBase64.split(",")[1] : imageBase64;

  if (!base64Data) {
    res.status(400).json({ error: "Imagem inválida." });
    return;
  }
  if (base64Data.length > MAX_BASE64_LENGTH) {
    res.status(400).json({ error: "Imagem muito grande. Tente uma foto menor ou com menos resolução." });
    return;
  }

  const path = "photo.jpg";
  const apiBase = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;
  const headers = {
    Authorization: `Bearer ${githubToken}`,
    "User-Agent": "maria-portfolio-admin",
    Accept: "application/vnd.github+json",
  };

  try {
    // 1. Get the current file's sha (required by GitHub to update a file).
    const getResp = await fetch(`${apiBase}?ref=${encodeURIComponent(branch)}`, { headers });
    if (!getResp.ok) {
      const errText = await getResp.text();
      res.status(502).json({ error: `Não consegui ler a foto atual no GitHub: ${errText}` });
      return;
    }
    const getData = await getResp.json();
    const sha = getData.sha;

    // 2. Commit the new photo.
    const putResp = await fetch(apiBase, {
      method: "PUT",
      headers: { ...headers, "Content-Type": "application/json" },
      body: JSON.stringify({
        message: "Update profile photo via admin panel",
        content: base64Data,
        sha,
        branch,
      }),
    });

    if (!putResp.ok) {
      const errText = await putResp.text();
      res.status(502).json({ error: `O GitHub recusou a atualização da foto: ${errText}` });
      return;
    }

    res.status(200).json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
};
