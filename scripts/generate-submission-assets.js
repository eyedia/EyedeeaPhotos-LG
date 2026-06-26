/**
 * Generate LG Seller Lounge marketing images from the Eyedeea Photos brand PNG.
 */
import sharp from 'sharp';
import { mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { syncBrandIcon, renderStoreIcon, STORE_ICON_BG } from './brand-icon.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, '..');
const outDir = join(rootDir, 'submission');

const BRAND_BLACK = { ...STORE_ICON_BG, alpha: 1 };

async function loadLogo(size) {
  const brandIcon = syncBrandIcon();
  return sharp(brandIcon)
    .resize(size, size, { fit: 'cover' })
    .flatten({ background: STORE_ICON_BG })
    .png()
    .toBuffer();
}

async function createBrandBackground(width, height) {
  const logo = await loadLogo(Math.round(Math.min(width, height) * 0.55));

  return sharp({
    create: { width, height, channels: 4, background: BRAND_BLACK },
  })
    .composite([{ input: logo, gravity: 'centre' }])
    .png()
    .toBuffer();
}

async function renderScreenshotPlaceholder(width, height, label, outputPath) {
  const bg = await createBrandBackground(width, height);

  const labelSvg = Buffer.from(`
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <text x="50%" y="88%" text-anchor="middle"
        font-family="Segoe UI, Arial, sans-serif" font-size="28" fill="#94a3b8">
        ${label} - replace with TV screenshot
      </text>
    </svg>`);

  await sharp(bg)
    .composite([{ input: labelSvg, gravity: 'centre' }])
    .png()
    .toFile(outputPath);
}

mkdirSync(join(outDir, 'screenshots'), { recursive: true });
mkdirSync(join(rootDir, 'public'), { recursive: true });

await renderStoreIcon(join(outDir, 'icon-400.png'), 400);
await renderStoreIcon(join(outDir, 'icon-400.jpg'), 400);
await renderStoreIcon(join(rootDir, 'public', 'icon-400.png'), 400);

console.log('Store icons: submission/icon-400.png, submission/icon-400.jpg, public/icon-400.png');
console.log('  -> Upload submission/icon-400.jpg (or .png) in Seller Lounge Images > App Icon');
console.log('  -> Do NOT use the 80x80 icon auto-imported from appinfo.json');

const launcherLogo = await loadLogo(480);
await sharp({
  create: { width: 1920, height: 1080, channels: 4, background: BRAND_BLACK },
})
  .composite([{ input: launcherLogo, gravity: 'centre' }])
  .png()
  .toFile(join(outDir, 'launcher-1920x1080.png'));

const splashLogo = await loadLogo(320);
const splashText = Buffer.from(`
  <svg width="1920" height="1080" xmlns="http://www.w3.org/2000/svg">
    <text x="960" y="700" text-anchor="middle"
      font-family="Segoe UI, Arial, sans-serif" font-size="56" font-weight="600" fill="#ffffff">
      Eyedeea Photos
    </text>
    <text x="960" y="760" text-anchor="middle"
      font-family="Segoe UI, Arial, sans-serif" font-size="28" fill="#94a3b8">
      Loading...
    </text>
  </svg>`);

await sharp({
  create: { width: 1920, height: 1080, channels: 4, background: BRAND_BLACK },
})
  .composite([
    { input: splashLogo, top: 280, left: 800 },
    { input: splashText, top: 0, left: 0 },
  ])
  .png()
  .toFile(join(outDir, 'splash-1920x1080.png'));

const screenshots = [
  ['01-device-code.png', 'Device code screen'],
  ['02-waiting.png', 'Waiting for activation'],
  ['03-slideshow.png', 'Slideshow view'],
  ['04-settings.png', 'Settings screen'],
  ['05-logout.png', 'After logout'],
];

for (const [filename, label] of screenshots) {
  await renderScreenshotPlaceholder(1280, 720, label, join(outDir, 'screenshots', filename));
}

console.log('Generated submission assets from brand-icon-512.png');
console.log('Replace submission/screenshots/*.png with real TV captures before LG upload.');
