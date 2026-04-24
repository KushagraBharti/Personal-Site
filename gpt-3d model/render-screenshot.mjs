import fs from 'node:fs';
import fsp from 'node:fs/promises';
import http from 'node:http';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');
const outDir = path.join(__dirname, 'renders');
await fsp.mkdir(outDir, { recursive: true });

const playwrightPath = require.resolve('playwright', {
  paths: [path.join(repoRoot, 'frontend')]
});
const { chromium } = require(playwrightPath);

const mimeTypes = new Map([
  ['.html', 'text/html; charset=utf-8'],
  ['.js', 'text/javascript; charset=utf-8'],
  ['.mjs', 'text/javascript; charset=utf-8'],
  ['.json', 'application/json; charset=utf-8'],
  ['.glb', 'model/gltf-binary'],
  ['.gltf', 'model/gltf+json'],
  ['.png', 'image/png']
]);

const server = http.createServer((req, res) => {
  const requestUrl = new URL(req.url ?? '/', 'http://127.0.0.1');
  const decodedPath = decodeURIComponent(requestUrl.pathname);
  const safePath = path.normalize(decodedPath).replace(/^(\.\.[/\\])+/, '');
  const filePath = path.join(__dirname, safePath === '/' ? 'render.html' : safePath);

  if (!filePath.startsWith(__dirname)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  fs.readFile(filePath, (error, data) => {
    if (error) {
      res.writeHead(404);
      res.end('Not found');
      return;
    }

    res.writeHead(200, {
      'Content-Type': mimeTypes.get(path.extname(filePath)) ?? 'application/octet-stream',
      'Cache-Control': 'no-store'
    });
    res.end(data);
  });
});

await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const address = server.address();
const origin = `http://127.0.0.1:${address.port}`;

const browser = await chromium.launch();
try {
  const context = await browser.newContext({
    viewport: { width: 2200, height: 2600 },
    deviceScaleFactor: 1,
    colorScheme: 'light'
  });
  const page = await context.newPage();

  await page.goto(`${origin}/render.html?background=transparent`, { waitUntil: 'networkidle' });
  await page.waitForFunction(() => window.__SCENE_READY === true, null, { timeout: 30000 });
  await page.screenshot({
    path: path.join(outDir, 'portfolio-hero-sculpture-transparent.png'),
    omitBackground: true
  });

  await page.goto(`${origin}/render.html?background=cream`, { waitUntil: 'networkidle' });
  await page.waitForFunction(() => window.__SCENE_READY === true, null, { timeout: 30000 });
  await page.screenshot({
    path: path.join(outDir, 'portfolio-hero-sculpture-cream-preview.png'),
    omitBackground: false
  });

  await context.close();
  console.log(`Rendered transparent and cream preview PNGs to ${outDir}`);
} finally {
  await browser.close();
  server.close();
}
