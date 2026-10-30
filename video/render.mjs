// Randare frame cu frame → JPEG-uri. Folosire: node render.mjs <outDir> [from] [to] [workers] [samples]
import { createRequire } from 'module';
import http from 'http'; import fs from 'fs'; import path from 'path'; import { fileURLToPath } from 'url';
const require = createRequire(import.meta.url); const { chromium } = require('playwright');
const here = path.dirname(fileURLToPath(import.meta.url));
const [out, from = 0, to = 1440, workers = 4, samples = 4] = process.argv.slice(2);
const FPS = 60; fs.mkdirSync(out, { recursive: true });
const types = { '.html': 'text/html', '.js': 'text/javascript', '.png': 'image/png', '.webp': 'image/webp', '.woff2': 'font/woff2', '.jpg': 'image/jpeg' };
const server = http.createServer((q, r) => {
  const f = path.join(here, decodeURIComponent(q.url.split('?')[0]));
  fs.readFile(f, (e, d) => { if (e) { r.writeHead(404); r.end(); } else { r.writeHead(200, { 'content-type': types[path.extname(f)] || 'application/octet-stream' }); r.end(d); } });
}).listen(0);
const port = server.address().port;
const browser = await chromium.launch({ args: ['--disable-gpu-vsync', '--ignore-gpu-blocklist'] });
const frames = []; for (let i = +from; i < +to; i++) frames.push(i);
let next = 0, done = 0; const t0 = Date.now();
async function worker() {
  const page = await browser.newPage({ viewport: { width: 540, height: 960 } });
  page.on('pageerror', e => { console.error('PAGE ERROR', e.message); process.exit(1); });
  await page.goto(`http://localhost:${port}/index.html?render=1`);
  await page.evaluate(() => window.ready);
  while (next < frames.length) {
    const i = frames[next++];
    const d = await page.evaluate(([t, s]) => window.frameJPEG(t, s, .94), [i / FPS, +samples]);
    fs.writeFileSync(path.join(out, `f_${String(i).padStart(5, '0')}.jpg`), Buffer.from(d.split(',')[1], 'base64'));
    if (++done % 60 === 0) console.log(`${done}/${frames.length}  ${((Date.now() - t0) / 1000).toFixed(0)}s`);
  }
  await page.close();
}
await Promise.all(Array.from({ length: +workers }, worker));
await browser.close(); server.close(); console.log('gata', ((Date.now() - t0) / 1000).toFixed(0) + 's');
