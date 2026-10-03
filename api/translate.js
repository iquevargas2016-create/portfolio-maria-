const { endpoint, authenticate, bodyOf, error, rateLimit } = require('../lib/http');
module.exports = endpoint(async (req, res) => {
  const session = authenticate(req);
  const key = process.env.DEEPL_API_KEY;
  if (!key) throw error(503, 'A tradução automática ainda não está disponível. Seu texto foi salvo.');
  // Free API only; paid translation is never enabled implicitly.
  if (!key.endsWith(':fx')) throw error(503, 'A tradução automática precisa ser configurada. Seu texto foi salvo.');
  const { source, texts } = bodyOf(req, 20000);
  if (!['pt','en','es'].includes(source) || !Array.isArray(texts) || texts.length > 30 || texts.some(t => typeof t !== 'string' || t.length > 12000) || texts.join('').length > 12000) throw error(400, 'Texto muito longo para tradução.');
  rateLimit(`translate:${session}`, 80, 3600000);
  const nonempty = texts.map((t,i)=>({t,i})).filter(x=>x.t.trim());
  const translated = {};
  for (const target of ['pt','en','es'].filter(l=>l!==source)) {
    const out = texts.map(()=> '');
    if (nonempty.length) {
      const response = await fetch('https://api-free.deepl.com/v2/translate', {method:'POST',headers:{Authorization:`DeepL-Auth-Key ${key}`,'Content-Type':'application/json'},signal:AbortSignal.timeout(15000),body:JSON.stringify({text:nonempty.map(x=>x.t),source_lang:source.toUpperCase(),target_lang:{pt:'PT-BR',en:'EN-US',es:'ES'}[target],preserve_formatting:true})});
      if (!response.ok) throw error(503, 'Não foi possível traduzir agora. Seu texto foi salvo; tente novamente.');
      const data = await response.json();
      if (!Array.isArray(data.translations) || data.translations.length !== nonempty.length || data.translations.some(t=>typeof t.text!=='string' || t.text.length>12000)) throw error(502,'Não foi possível concluir a tradução.');
      nonempty.forEach((x,i)=>{out[x.i]=data.translations[i].text;});
    }
    translated[target] = out;
  }
  res.status(200).json({ translations:translated });
}, ['POST']);
