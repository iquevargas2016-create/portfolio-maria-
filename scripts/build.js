const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const V = require('../shared/view');
const { validate } = require('../lib/content');
async function build() {
const root = path.resolve(__dirname, '..'), output = path.join(root, 'public');
const content = validate(JSON.parse(fs.readFileSync(path.join(root, 'content.json'), 'utf8')));
const preview = process.env.VERCEL_ENV === 'preview';
const write = (file, data) => { const p = path.join(output, file); fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, data); };
fs.rmSync(output, { recursive: true, force: true }); fs.mkdirSync(output);
const assets = ['styles.css', 'site.js', 'photo.jpg', 'photo-placeholder.svg', 'og-image.png', 'favicon.ico', 'favicon-16x16.png', 'favicon-32x32.png', 'apple-touch-icon.png', 'android-chrome-192x192.png', 'android-chrome-512x512.png'];
for (const file of assets) if (fs.existsSync(path.join(root, file))) fs.copyFileSync(path.join(root, file), path.join(output, file));
for (const dir of ['admin', 'shared']) fs.cpSync(path.join(root, dir), path.join(output, dir), { recursive: true });
const publicContent = structuredClone(content); delete publicContent.editorial;
for (const lang of V.LANGS) { delete publicContent[lang].contact_phone_value; delete publicContent[lang].contact_phone_label; }
write('content.json', JSON.stringify(publicContent));
function vcard(lang) {
  const d = content[lang];
  const esc = text => String(text).replace(/\\/g, '\\\\').replace(/\r?\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;');
  const lines = ['BEGIN:VCARD', 'VERSION:3.0', `FN:${V.NAME}`, 'N:Miranda;Maria Eduarda;;;', `TITLE:${esc(d.eyebrow)}`, `ORG:${esc(d.institution)}`, `EMAIL;TYPE=INTERNET:${esc(d.contact_email_value)}`, `URL:${V.ORIGIN + V.pathFor(lang)}`, 'END:VCARD'];
  return lines.map(line => { let out = '', length = 0; for (const character of line) { const bytes = Buffer.byteLength(character); if (length + bytes > 74) { out += '\r\n '; length = 1; } out += character; length += bytes; } return out; }).join('\r\n') + '\r\n';
}
const routes = [];
const metrics = !!((process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL) && (process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN));
for (const lang of V.LANGS) {
  for (const type of ['home', 'cv', 'card', 'event']) {
    const route = V.pathFor(lang, type); routes.push(route);
    write(route.slice(1) + 'index.html', V.renderPage(content, { lang, type, preview, metrics }));
  }
  (content.collections.projects || []).forEach((p, i) => { const slug = V.projectSlug(p, i), route = V.pathFor(lang, 'project', slug); routes.push(route); write(route.slice(1) + 'index.html', V.renderPage(content, { lang, type: 'project', slug, preview, metrics })); });
  write(`${lang}/contact.vcf`, vcard(lang));
  const svg = require('qrcode/lib/renderer/svg-tag').render(require('qrcode').create(V.ORIGIN + V.pathFor(lang, 'event'), { errorCorrectionLevel: 'M' }), { margin: 2, width: 240 });
  write(`${lang}/profile-qr.svg`, svg);
}
write('index.html', V.renderPage(content, { lang: 'en', preview, metrics }));
write('manifest.webmanifest', JSON.stringify({ id: '/', name: V.NAME, short_name: 'Maria Miranda', start_url: '/', scope: '/', display: 'standalone', background_color: '#ffffff', theme_color: '#0d2542', icons: [{ src: '/android-chrome-192x192.png', sizes: '192x192', type: 'image/png' }, { src: '/android-chrome-512x512.png', sizes: '512x512', type: 'image/png' }] }));
write('offline.html', '<!doctype html><html lang="pt"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Offline · Maria Miranda</title><link rel="stylesheet" href="/styles.css"><main class="container section"><h1>Você está offline</h1><p>Abra uma página salva ou tente novamente quando recuperar a conexão.</p><p>You are offline. Open a saved page or try again when connected.</p><p>Sin conexión. Abre una página guardada o vuelve a intentarlo.</p><a href="/pt/">Português</a> · <a href="/en/">English</a> · <a href="/es/">Español</a></main></html>');
write('404.html', '<!doctype html><html lang="pt"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Página não encontrada</title><link rel="stylesheet" href="/styles.css"><main class="container section"><h1>Página não encontrada / Page not found</h1><a href="/">Maria Eduarda Miranda →</a></main></html>');
write('robots.txt', `User-agent: *\n${preview ? 'Disallow: /' : `Disallow: /admin/\nDisallow: /api/\nSitemap: ${V.ORIGIN}/sitemap.xml`}\n`);
write('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${routes.map(p => `<url><loc>${V.ORIGIN + p}</loc></url>`).join('')}</urlset>`);
// Derived files are rebuilt from the current uploaded photo on every deployment.
const imageFiles=[];
for(const width of [320,640,960]) {
  const bytes=await require('sharp')(path.join(root,'photo.jpg')).rotate().resize({width,withoutEnlargement:true}).webp({quality:80}).toBuffer();
  const hash=crypto.createHash('sha256').update(bytes).digest('hex').slice(0,12);
  const file=`/assets/photo-${width}.${hash}.webp`;write(file.slice(1),bytes);imageFiles.push([width,file]);
}
const assetMap={};
for(const file of ['styles.css','site.js','shared/view.js','admin/admin.js','admin/i18n.js','admin/admin.css']) {
  const bytes=fs.readFileSync(path.join(output,file)),hash=crypto.createHash('sha256').update(bytes).digest('hex').slice(0,12);
  const ext=path.extname(file),name=path.basename(file,ext),target=`/assets/${name}.${hash}${ext}`;
  write(target.slice(1),bytes);assetMap['/'+file]=target;
}
function optimizeHTML(directory) {
  for(const entry of fs.readdirSync(directory,{withFileTypes:true})) {
    const file=path.join(directory,entry.name);
    if(entry.isDirectory())optimizeHTML(file);
    else if(entry.name.endsWith('.html')) {
      let html=fs.readFileSync(file,'utf8');
      html=html.replace(/<img src="\/photo.jpg"/g,`<img src="${imageFiles[1][1]}" srcset="${imageFiles.map(([width,url])=>url+' '+width+'w').join(', ')}" sizes="(max-width: 600px) 75vw, 300px"`);
      for(const [source,target] of Object.entries(assetMap))html=html.split(`"${source}"`).join(`"${target}"`);
      if(path.relative(output,file)==='admin/index.html')html=html.replace('<head>','<head><script>window.PORTFOLIO_ASSETS='+JSON.stringify(assetMap)+'</script>');
      fs.writeFileSync(file,html);
    }
  }
}
optimizeHTML(output);
// Install only the offline shell, instead of downloading all pages at once.
const precache=['/offline.html',assetMap['/styles.css']];
const allowedAssets=Object.values(assetMap).filter(url=>!url.includes('/admin.')&&!url.includes('/i18n.'));
const allowed=['/',...precache,...routes,...allowedAssets,...imageFiles.map(([,url])=>url),'/photo.jpg',...V.LANGS.map(lang=>`/${lang}/contact.vcf`)];
const version = crypto.createHash('sha256').update(JSON.stringify([assetMap,imageFiles,content])).digest('hex').slice(0,12);
write('sw.js', `const CACHE='maria-${version}';\nconst FILES=${JSON.stringify(allowed)};\nconst PRECACHE=${JSON.stringify(precache)};\nself.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(PRECACHE))));\nself.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith('maria-')&&key!==CACHE).map(key=>caches.delete(key))))));\nself.addEventListener('fetch',event=>{const url=new URL(event.request.url);if(event.request.method!=='GET'||url.origin!==self.location.origin||url.search||!FILES.includes(url.pathname))return;const network=()=>fetch(event.request).then(response=>{if(response.ok){const copy=response.clone();event.waitUntil(caches.open(CACHE).then(cache=>cache.put(event.request,copy)));}return response;});event.respondWith((url.pathname.startsWith('/assets/')?caches.match(event.request).then(cached=>cached||network()):network()).catch(()=>caches.match(event.request).then(cached=>cached||(event.request.mode==='navigate'?caches.match('/offline.html'):Response.error()))));});\n`);
console.log(`Built ${routes.length + 1} public pages in 3 languages${preview ? ' (preview)' : ''}.`);
}
build().catch(error=>{console.error(error);process.exitCode=1;});
