/**
 * Capture 1280×720 Seller Lounge screenshots from TV-resolution UI fixtures
 * that match the production app chrome (device code, waiting, slideshow, settings).
 *
 * Usage: node scripts/capture-submission-screenshots.mjs
 */
import { mkdirSync, writeFileSync, readFileSync, rmSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createServer } from 'http';
import { chromium } from 'playwright';
import sharp from 'sharp';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, '..');
const outDir = join(rootDir, 'submission', 'screenshots');
const tmpDir = join(rootDir, '.screenshot-fixtures');
const W = 1280;
const H = 720;

mkdirSync(outDir, { recursive: true });
mkdirSync(tmpDir, { recursive: true });

const brandIcon = readFileSync(join(rootDir, 'public', 'brand-icon-512.png')).toString('base64');

// Soft family-photo stand-in for slideshow (gradient + light vignette)
const photoPng = await sharp({
  create: {
    width: W,
    height: H,
    channels: 3,
    background: { r: 42, g: 68, b: 92 },
  },
})
  .composite([
    {
      input: Buffer.from(`
        <svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stop-color="#7dd3fc"/>
              <stop offset="45%" stop-color="#38bdf8"/>
              <stop offset="100%" stop-color="#0f172a"/>
            </linearGradient>
            <radialGradient id="v" cx="50%" cy="40%" r="70%">
              <stop offset="0%" stop-color="rgba(255,255,255,0.18)"/>
              <stop offset="100%" stop-color="rgba(2,6,23,0.55)"/>
            </radialGradient>
          </defs>
          <rect width="100%" height="100%" fill="url(#g)"/>
          <rect width="100%" height="100%" fill="url(#v)"/>
          <circle cx="980" cy="180" r="70" fill="#fde68a" opacity="0.85"/>
        </svg>`),
      top: 0,
      left: 0,
    },
  ])
  .png()
  .toBuffer();

writeFileSync(join(tmpDir, 'photo.png'), photoPng);
const photoB64 = photoPng.toString('base64');

const sharedCss = `
  *,*::before,*::after{box-sizing:border-box}
  html,body{margin:0;width:100%;height:100%;overflow:hidden;background:#020617;color:#f8fafc;
    font-family:'Segoe UI',system-ui,-apple-system,sans-serif}
  .screen{width:100vw;height:100vh;display:flex;align-items:center;justify-content:center;
    background:radial-gradient(circle at top,#0f172a 0%,#020617 55%)}
  .device-code-card,.settings-card{border-radius:24px;background:rgba(15,23,42,0.92);
    border:1px solid rgba(148,163,184,0.18);box-shadow:0 30px 80px rgba(2,6,23,0.55);text-align:center}
  .device-code-card{width:min(920px,92vw);padding:2.5rem 3rem}
  .settings-card{width:min(640px,88vw);padding:2rem 2.25rem 1.75rem}
  .app-logo{width:72px;height:72px;object-fit:contain}
  h1{margin:0.35rem 0;font-size:2.6rem;font-weight:700}
  .app-tagline{margin:0 0 2rem;color:#94a3b8;font-size:1rem}
  .activation-title{margin:0;font-size:1.6rem;font-weight:700}
  .activate-instructions{margin:0.75rem 0 0.5rem;color:#94a3b8;font-size:0.95rem;line-height:1.6}
  .activate-instructions p{margin:0}
  .activate-url{margin:0.25rem 0!important;font-size:1.15rem;font-weight:600;color:#e2e8f0}
  .code-value{display:block;margin:0.75rem 0;font-size:3.5rem;font-weight:800;letter-spacing:0.2em;color:#38bdf8}
  .activation-timeout{width:min(560px,90%);height:4px;margin:1rem auto 0;background:rgba(148,163,184,0.22);
    border-radius:999px;overflow:hidden}
  .activation-timeout-bar{height:100%;width:62%;background:linear-gradient(90deg,#0284c7,#38bdf8);border-radius:999px}
  .status-pill{display:inline-flex;align-items:center;gap:0.5rem;margin-top:1rem;padding:0.45rem 0.9rem;
    border-radius:999px;background:rgba(56,189,248,0.12);border:1px solid rgba(56,189,248,0.35);
    color:#7dd3fc;font-size:0.95rem}
  .dot{width:8px;height:8px;border-radius:50%;background:#38bdf8;animation:pulse 1.2s ease-in-out infinite}
  @keyframes pulse{0%,100%{opacity:0.35}50%{opacity:1}}
  .settings-subtitle{margin:0 0 1rem;color:#cbd5e1;font-size:1.15rem}
  .settings-list{margin:0.5rem 0 0;text-align:left;font-size:1.1rem}
  .settings-row{display:grid;grid-template-columns:120px 1fr;gap:0.75rem;padding:0.75rem 0;
    border-bottom:1px solid rgba(148,163,184,0.15)}
  .settings-row dt{color:#94a3b8;font-weight:600}
  .settings-row dd{margin:0;color:#f8fafc;word-break:break-word}
  .settings-actions{display:flex;justify-content:center;gap:0.75rem;margin-top:1.25rem}
  .btn{background:#334155;color:#e2e8f0;border:2px solid rgba(148,163,184,0.25);min-width:8rem;
    padding:0.75rem 1.4rem;font-size:1.1rem;border-radius:10px}
  .btn.is-selected{background:#0773ac;color:#fff;border-color:#38bdf8;box-shadow:0 0 0 3px rgba(56,189,248,0.35)}
  .settings-hint{margin-top:1rem;color:#94a3b8;font-size:0.95rem}
  .settings-version{margin-top:0.75rem;color:#64748b;font-size:0.9rem}
  .view-screen{position:relative;width:100vw;height:100vh;background:#000;overflow:hidden}
  .photo-main{width:100%;height:100%;object-fit:cover}
  .view-controls-top{position:absolute;top:1.25rem;right:1.25rem;display:flex;flex-direction:column;gap:0.5rem;z-index:5}
  .view-icon-btn{width:48px;height:48px;border:none;border-radius:12px;background:rgba(0,0,0,0.5);color:#f8fafc;font-size:1.25rem}
  .view-icon-btn.settings{box-shadow:inset 0 -3px 0 #ef4444}
  .meta{position:absolute;left:1.5rem;right:1.5rem;bottom:1.5rem;padding:1rem 1.25rem;border-radius:14px;
    background:linear-gradient(180deg,rgba(2,6,23,0.15),rgba(2,6,23,0.72));backdrop-filter:blur(4px)}
  .meta h2{margin:0 0 0.25rem;font-size:1.35rem}
  .meta p{margin:0;color:#cbd5e1;font-size:0.95rem}
  .nav{position:absolute;top:50%;transform:translateY(-50%);width:48px;height:48px;border:none;border-radius:12px;
    background:rgba(0,0,0,0.45);color:#fff;font-size:1.5rem}
  .nav.prev{left:1.25rem}.nav.next{right:1.25rem}
`;

function page(body, extraCss = '') {
  return `<!doctype html><html><head><meta charset="utf-8"/><style>${sharedCss}${extraCss}</style></head>
  <body>${body}</body></html>`;
}

const deviceCodeBody = (code, waiting) => `
  <div class="screen">
    <div class="device-code-card">
      <img class="app-logo" alt="Eyedeea Photos" src="data:image/png;base64,${brandIcon}"/>
      <h1>Eyedeea Photos</h1>
      <p class="app-tagline">Your memories, everywhere</p>
      <div>
        <h2 class="activation-title">Device Activation</h2>
        <div class="activate-instructions">
          <p>Go to</p>
          <p class="activate-url">www.eyedeeaphotos.com/activate</p>
          <p>and enter the code:</p>
        </div>
        <span class="code-value">${code}</span>
        ${
          waiting
            ? `<div class="activation-timeout"><div class="activation-timeout-bar"></div></div>
               <div class="status-pill"><span class="dot"></span>Waiting for activation…</div>`
            : ''
        }
      </div>
    </div>
  </div>`;

const fixtures = {
  '01-device-code.html': page(deviceCodeBody('A7K-3MQ', false)),
  '02-waiting.html': page(deviceCodeBody('A7K-3MQ', true)),
  '03-slideshow.html': page(`
    <div class="view-screen">
      <img class="photo-main" alt="" src="data:image/png;base64,${photoB64}"/>
      <div class="view-controls-top">
        <button class="view-icon-btn" type="button" aria-label="Info">ⓘ</button>
        <button class="view-icon-btn settings" type="button" aria-label="Settings">⚙</button>
      </div>
      <button class="nav prev" type="button">‹</button>
      <button class="nav next" type="button">›</button>
      <div class="meta">
        <h2>Summer at the lake</h2>
        <p>July 2025 · Lake Michigan</p>
      </div>
    </div>`),
  '04-settings.html': page(`
    <div class="screen settings-screen">
      <div class="settings-card">
        <h1>Settings</h1>
        <p class="settings-subtitle">Account signed in on this TV</p>
        <dl class="settings-list">
          <div class="settings-row"><dt>Name</dt><dd>QA Test Account</dd></div>
          <div class="settings-row"><dt>Email</dt><dd>qa-test@eyedeeaphotos.com</dd></div>
        </dl>
        <div class="settings-actions">
          <button class="btn is-selected" type="button">Back</button>
          <button class="btn" type="button">Log out</button>
        </div>
        <p class="settings-hint">Logging out will require a new device code to sign in again.</p>
        <p class="settings-version">Version 1.0.3</p>
      </div>
    </div>`),
  '05-logout.html': page(deviceCodeBody('B2N-9PL', false)),
};

for (const [name, html] of Object.entries(fixtures)) {
  writeFileSync(join(tmpDir, name), html);
}

const server = createServer((req, res) => {
  const file = join(tmpDir, (req.url || '/').replace(/^\//, '') || '01-device-code.html');
  try {
    const data = readFileSync(file);
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(data);
  } catch {
    res.writeHead(404);
    res.end('not found');
  }
});

await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const { port } = server.address();
const base = `http://127.0.0.1:${port}`;

const browser = await chromium.launch({ headless: true });
const pageCtx = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });

const shots = [
  ['01-device-code.html', '01-device-code.png'],
  ['02-waiting.html', '02-waiting.png'],
  ['03-slideshow.html', '03-slideshow.png'],
  ['04-settings.html', '04-settings.png'],
  ['05-logout.html', '05-logout.png'],
];

for (const [html, png] of shots) {
  await pageCtx.goto(`${base}/${html}`, { waitUntil: 'networkidle' });
  await pageCtx.screenshot({ path: join(outDir, png), type: 'png' });
  console.log('Wrote', join('submission', 'screenshots', png));
}

await browser.close();
server.close();
rmSync(tmpDir, { recursive: true, force: true });
console.log('Submission screenshots ready at 1280×720.');
