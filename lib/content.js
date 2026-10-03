const { error } = require('./http');
const { LANGS, projectSlug, safeURL, emailAddress } = require('../shared/view');
const object = v => v && typeof v === 'object' && !Array.isArray(v);
function validate(content) {
  const fail = message => { throw error(400, message); };
  const string = (v, label, max = 12000) => { if (typeof v !== 'string' || v.length > max) fail(`Texto inválido ou muito longo: ${label}.`); };
  const translated = (v, label, required = false) => {
    if (v == null && !required) return;
    if (!object(v)) fail(`Traduções inválidas: ${label}.`);
    for (const lang of LANGS) { string(v[lang] ?? '', `${label} (${lang})`); if (required && !v[lang]?.trim()) fail(`Preencha ${label} em ${lang.toUpperCase()}.`); }
  };
  const list = (v, label, max = 100) => { if (!Array.isArray(v) || v.length > max) fail(`Lista inválida: ${label}.`); };
  if (!object(content)) fail('Conteúdo inválido.');
  for (const lang of LANGS) {
    if (!object(content[lang]) || Object.keys(content[lang]).length > 100) fail(`Idioma inválido: ${lang}.`);
    for (const [key, value] of Object.entries(content[lang])) { if (!/^[a-z][a-z0-9_]{0,79}$/.test(key)) fail('Campo desconhecido.'); string(value, key); }
    for (const key of ['eyebrow', 'summary', 'institution', 'contact_email_value', 'projects_title', 'education_title']) if (!content[lang][key]?.trim()) fail(`Preencha ${key} em ${lang}.`);
    if (!emailAddress(content[lang].contact_email_value)) fail(`Email inválido em ${lang}.`);
  }
  if (new Set(LANGS.map(l => Object.keys(content[l]).sort().join('|'))).size !== 1) fail('Os três idiomas precisam ter os mesmos campos.');
  if(content.appearance != null) { if(!object(content.appearance)) fail('Aparência inválida.'); for(const key of ['brand','text','cover','background']) if(content.appearance[key] != null && !/^#[0-9a-f]{6}$/i.test(content.appearance[key])) fail('Cor inválida.'); if(content.appearance.palettes != null){if(!object(content.appearance.palettes))fail('Paletas inválidas.');for(const [mode,palette] of Object.entries(content.appearance.palettes)){if(!['light','dark'].includes(mode)||!object(palette))fail('Paleta inválida.');for(const [key,value] of Object.entries(palette))if(!['brand','text','cover','background'].includes(key)||!/^#[0-9a-f]{6}$/i.test(value))fail('Cor inválida.');}} if(content.appearance.font != null && !['original','system','georgia','arial','trebuchet'].includes(content.appearance.font)) fail('Fonte inválida.'); if(content.appearance.theme != null && !['light','dark'].includes(content.appearance.theme)) fail('Estilo inválido.'); if(content.appearance.order != null) { list(content.appearance.order,'ordem',30); if(new Set(content.appearance.order).size !== content.appearance.order.length || content.appearance.order.some(id=>! /^(projects|education|contact|custom-\d+)$/.test(id))) fail('Ordem inválida.'); } }
  const c = content.collections;
  if (!object(c)) fail('Coleções inválidas.');
  const item = (v, label) => {
    if (!object(v)) fail(`Item inválido: ${label}.`);
    translated(v.title, `${label}: título`, true);
    for (const field of ['display_title', 'subtitle', 'desc', 'venue', 'issuer']) translated(v[field], field);
    for (const field of ['id', 'slug', 'period', 'year', 'date', 'link']) if (v[field] != null) string(v[field], field, 500);
    if (v.link && !safeURL(v.link)) fail('Use um link completo começando com https:// ou http://.');
    if (v.id && !/^[a-z0-9-]{1,100}$/.test(v.id)) fail('Identificador inválido.');
    if (v.slug && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(v.slug)) fail('O endereço da pesquisa deve conter letras minúsculas, números e hífens.');
    if (v.tags != null) { if (!object(v.tags)) fail('Temas inválidos.'); for (const l of LANGS) { list(v.tags[l] || [], 'temas', 30); (v.tags[l] || []).forEach(t => string(t, 'tema', 150)); } }
  };
  for (const kind of ['projects', 'education', 'publications', 'certificates']) { list(c[kind] || [], kind); (c[kind] || []).forEach((v, i) => item(v, `${kind} ${i + 1}`)); }
  list(c.contacts || [],'contatos',10); for(const item of c.contacts || []) { if(!object(item)) fail('Contato inválido.'); translated(item.title,'Título do contato',true); string(item.link,'Endereço do contato',500); if(item.link && !safeURL(item.link)) fail('Use um endereço de contato começando com https:// ou http://.'); }
  const slugs = (c.projects || []).map(projectSlug);
  if (new Set(slugs).size !== slugs.length || slugs.some(s => !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(s))) fail('Cada pesquisa precisa ter um endereço único e válido.');
  list(c.custom_sections || [], 'seções', 20);
  for (const s of c.custom_sections || []) { translated(s.title, 'Título da seção', true); translated(s.lead, 'Introdução'); list(s.items || [], 'itens'); (s.items || []).forEach(v => item(v, 'seção personalizada')); }
  list(c.languages || [], 'idiomas', 20);
  for (const l of c.languages || []) {
    if (!['pt', 'en', 'es', 'it', 'fr', 'de', 'other'].includes(l.code) || !['native', 'fluent', 'advanced', 'intermediate', 'basic'].includes(l.level)) fail('Idioma ou nível inválido.');
    if (l.code === 'other') translated(l.name, 'Nome do idioma', true);
  }
  if (Buffer.byteLength(JSON.stringify(content)) > 650000) fail('Conteúdo excede o limite.');
  return content;
}
function photoData(value) {
  if (value == null || value === '') return null;
  if (typeof value !== 'string' || !/^data:image\/jpeg;base64,[A-Za-z0-9+/]+={0,2}$/.test(value) || value.length > 1800000) throw error(400, 'Use uma foto JPEG de até 1,3 MB.');
  const base64 = value.split(',')[1], bytes = Buffer.from(base64, 'base64');
  if (bytes[0] !== 255 || bytes[1] !== 216 || bytes[2] !== 255) throw error(400, 'Foto JPEG inválida.');
  return base64;
}
module.exports = { validate, photoData };
