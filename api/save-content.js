// POST /api/save-content  { token, content }  ->  { ok: true }
//
// Verifies the session token issued by /api/login, does a basic
// sanity check on the submitted content, then commits the updated
// content.json straight to the GitHub repo via the GitHub Contents
// API — Vercel's existing auto-deploy on push then publishes it,
// exactly like a normal `git push` would.

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

const LANGS = ["en", "pt", "es"];

function validateContent(content) {
  if (!content || typeof content !== "object") return "Invalid content payload.";
  for (const lang of LANGS) {
    if (!content[lang] || typeof content[lang] !== "object") {
      return `Missing or invalid "${lang}" section.`;
    }
  }
  const keySets = LANGS.map((l) => Object.keys(content[l]).sort().join("|"));
  if (new Set(keySets).size !== 1) {
    return "All three languages must have exactly the same set of fields.";
  }
  for (const lang of LANGS) {
    for (const [key, value] of Object.entries(content[lang])) {
      if (typeof value !== "string") {
        return `Field "${key}" (${lang}) must be text.`;
      }
    }
  }
  return null;
}

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
  const { token, content } = body || {};

  if (!verifyToken(token, sessionSecret)) {
    res.status(401).json({ error: "Sessão inválida ou expirada. Faça login novamente." });
    return;
  }

  const validationError = validateContent(content);
  if (validationError) {
    res.status(400).json({ error: validationError });
    return;
  }

  const path = "content.json";
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
      res.status(502).json({ error: `Não consegui ler o content.json atual no GitHub: ${errText}` });
      return;
    }
    const getData = await getResp.json();
    const sha = getData.sha;

    // 2. Commit the updated content.
    const newContentText = JSON.stringify(content, null, 2) + "\n";
    const putResp = await fetch(apiBase, {
      method: "PUT",
      headers: { ...headers, "Content-Type": "application/json" },
      body: JSON.stringify({
        message: "Update site content via admin panel",
        content: Buffer.from(newContentText, "utf8").toString("base64"),
        sha,
        branch,
      }),
    });

    if (!putResp.ok) {
      const errText = await putResp.text();
      res.status(502).json({ error: `O GitHub recusou a atualização: ${errText}` });
      return;
    }

    res.status(200).json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
};
