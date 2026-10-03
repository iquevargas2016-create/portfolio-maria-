// POST /api/ai-chain  { token, prompt, mode? }  ->  { mode, ... }
//
// Connects Claude (Anthropic) and ChatGPT (OpenAI) automatically.
// Requires the session token issued by /api/login so the public can't
// spend your API credits.
//
// Modes:
//   "compare" (default)  asks both models in parallel and returns both answers.
//   "review"             GPT drafts an answer, then Claude reviews and improves it.
//   "debate"             Claude answers, GPT critiques it, Claude writes the final answer.
//
// Environment variables (Vercel):
//   ANTHROPIC_API_KEY, OPENAI_API_KEY, SESSION_SECRET
//   OPENAI_MODEL (optional, default "gpt-5")

const Anthropic = require("@anthropic-ai/sdk");
const OpenAI = require("openai");
const { verifyToken } = require("./_auth");

const CLAUDE_MODEL = "claude-opus-5-5";
const MAX_PROMPT_CHARS = 8000;

async function askClaude(anthropic, prompt, system) {
  const response = await anthropic.beta.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 16000,
    system,
    messages: [{ role: "user", content: prompt }],
    // If a safety classifier declines the request, retry on a fallback model.
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
  });
  if (response.stop_reason === "refusal") {
    throw new Error("Claude recusou esta solicitação.");
  }
  return response.content
    .filter((block) => block.type === "text")
    .map((block) => block.text)
    .join("\n");
}

async function askGpt(openai, prompt, system) {
  const response = await openai.responses.create({
    model: process.env.OPENAI_MODEL || "gpt-5",
    instructions: system,
    input: prompt,
  });
  return response.output_text;
}

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const { SESSION_SECRET, ANTHROPIC_API_KEY, OPENAI_API_KEY } = process.env;
  if (!SESSION_SECRET || !ANTHROPIC_API_KEY || !OPENAI_API_KEY) {
    res.status(500).json({
      error:
        "Server not configured yet: set SESSION_SECRET, ANTHROPIC_API_KEY and OPENAI_API_KEY as environment variables in Vercel.",
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
  body = body || {};

  if (!verifyToken(body.token, SESSION_SECRET)) {
    res.status(401).json({ error: "Sessão expirada. Faça login novamente." });
    return;
  }

  const prompt = typeof body.prompt === "string" ? body.prompt.trim() : "";
  if (!prompt || prompt.length > MAX_PROMPT_CHARS) {
    res.status(400).json({ error: `O campo "prompt" é obrigatório (máx. ${MAX_PROMPT_CHARS} caracteres).` });
    return;
  }

  const mode = body.mode || "compare";
  if (!["compare", "review", "debate"].includes(mode)) {
    res.status(400).json({ error: 'Modo inválido. Use "compare", "review" ou "debate".' });
    return;
  }

  const anthropic = new Anthropic();
  const openai = new OpenAI();
  const system = "Responda no mesmo idioma da pergunta, de forma clara e objetiva.";

  try {
    if (mode === "compare") {
      const [claude, gpt] = await Promise.all([
        askClaude(anthropic, prompt, system),
        askGpt(openai, prompt, system),
      ]);
      res.status(200).json({ mode, claude, gpt });
      return;
    }

    if (mode === "review") {
      const draft = await askGpt(openai, prompt, system);
      const final = await askClaude(
        anthropic,
        `Pergunta original:\n${prompt}\n\nRascunho de outra IA:\n${draft}\n\nRevise o rascunho, corrija erros e entregue a melhor resposta final.`,
        system
      );
      res.status(200).json({ mode, gpt_draft: draft, claude_final: final });
      return;
    }

    // debate
    const first = await askClaude(anthropic, prompt, system);
    const critique = await askGpt(
      openai,
      `Pergunta:\n${prompt}\n\nResposta a ser avaliada:\n${first}\n\nFaça uma crítica construtiva: aponte erros, omissões e melhorias.`,
      system
    );
    const final = await askClaude(
      anthropic,
      `Pergunta:\n${prompt}\n\nSua resposta anterior:\n${first}\n\nCrítica recebida:\n${critique}\n\nEscreva a resposta final, incorporando as críticas válidas.`,
      system
    );
    res.status(200).json({ mode, claude_first: first, gpt_critique: critique, claude_final: final });
  } catch (err) {
    console.error("ai-chain error:", err);
    const status = err && typeof err.status === "number" ? err.status : 500;
    res.status(status >= 400 && status < 600 ? status : 500).json({
      error: "Falha ao consultar os modelos de IA.",
    });
  }
};
