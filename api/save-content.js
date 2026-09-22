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

// Repeatable content Maria can add to over time via the admin panel —
// each item mixes plain fields (period/year/date, link) with fields
// translated per language (title, subtitle/venue/issuer, desc, tags).
const COLLECTION_KEYS = ["projects", "publications", "certificates", "education"];
const TRANSLATED_ITEM_FIELDS = ["title", "subtitle", "desc", "venue", "issuer"];
const STRING_ITEM_FIELDS = ["period", "year", "date", "link"];

function isPlainObject(v) {
  return !!v && typeof v === "object" && !Array.isArray(v);
}

function validateTranslatedField(value, label) {
  if (value == null) return null; // optional field
  if (!isPlainObject(value)) return `O campo "${label}" deve ser um objeto com texto por idioma (en/pt/es).`;
  for (const lang of LANGS) {
    if (value[lang] != null && typeof value[lang] !== "string") {
      return `O campo "${label}" (${lang}) deve ser texto.`;
    }
  }
  return null;
}

function validateTagsField(value, label) {
  if (value == null) return null; // optional field
  if (!isPlainObject(value)) return `O campo "${label}" deve ser um objeto com uma lista por idioma.`;
  for (const lang of LANGS) {
    if (value[lang] == null) continue;
    if (!Array.isArray(value[lang])) return `O campo "${label}" (${lang}) deve ser uma lista.`;
    for (const t of value[lang]) {
      if (typeof t !== "string") return `O campo "${label}" (${lang}) tem um valor inválido.`;
    }
  }
  return null;
}

function validateCollectionItem(item, label) {
  if (!isPlainObject(item)) return `O item "${label}" é inválido.`;
  for (const f of TRANSLATED_ITEM_FIELDS) {
    const err = validateTranslatedField(item[f], `${label}.${f}`);
    if (err) return err;
  }
  const tagsErr = validateTagsField(item.tags, `${label}.tags`);
  if (tagsErr) return tagsErr;
  for (const f of STRING_ITEM_FIELDS) {
    if (item[f] != null && typeof item[f] !== "string") {
      return `O campo "${label}.${f}" deve ser texto.`;
    }
  }
  return null;
}

// Fully custom "topics" Maria can create herself — each is its own
// section with a title/lead (translated) plus a repeatable list of
// items in the same shape as projects/publications/certificates.
function validateCustomSections(sections) {
  if (sections == null) return null; // optional, treated as an empty list
  if (!Array.isArray(sections)) return '"collections.custom_sections" deve ser uma lista.';
  for (let i = 0; i < sections.length; i++) {
    const section = sections[i];
    const label = `custom_sections[${i + 1}]`;
    if (!isPlainObject(section)) return `A seção ${i + 1} é inválida.`;

    const titleErr = validateTranslatedField(section.title, `${label}.title`);
    if (titleErr) return titleErr;
    const leadErr = validateTranslatedField(section.lead, `${label}.lead`);
    if (leadErr) return leadErr;

    if (section.items != null) {
      if (!Array.isArray(section.items)) return `"${label}.items" deve ser uma lista.`;
      for (let j = 0; j < section.items.length; j++) {
        const err = validateCollectionItem(section.items[j], `${label}.items[${j + 1}]`);
        if (err) return err;
      }
    }
  }
  return null;
}

function validateCollections(collections) {
  if (collections == null) return null; // absent is fine — defaults apply elsewhere
  if (!isPlainObject(collections)) return 'O campo "collections" é inválido.';
  for (const key of COLLECTION_KEYS) {
    if (!(key in collections)) continue; // optional, treated as an empty list
    const arr = collections[key];
    if (!Array.isArray(arr)) return `"collections.${key}" deve ser uma lista.`;
    for (let i = 0; i < arr.length; i++) {
      const err = validateCollectionItem(arr[i], `${key}[${i + 1}]`);
      if (err) return err;
    }
  }
  return validateCustomSections(collections.custom_sections);
}

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
  return validateCollections(content.collections);
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
