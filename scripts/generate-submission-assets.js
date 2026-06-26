/**
 * Generate LG Seller Lounge marketing images from public/logo.svg.
 */
import sharp from 'sharp';
import { writeFileSync, mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, '..');
const outDir = join(rootDir, 'submission');
const logoPath = join(rootDir, 'public', 'logo.svg');

const SLATE = { r: 15, g: 23, b: 42, alpha: 1 };
const SKY = { r: 14, g: 165, b: 233, alpha: 1 };

async function createGradientBackground(width, height) {
  const svg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#020617"/>
          <stop offset="50%" stop-color="#0f172a"/>
          <stop offset="100%" stop-color="#0c4a6e"/>
        </linearGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#g)"/>
    </svg>`;

  return sharp(Buffer.from(svg)).png().toBuffer();
}

async function compositeLogo(background, width, height, logoScale = 0.22) {
  const logoSize = Math.round(Math.min(width, height) * logoScale);
  const logo = await sharp(logoPath)
    .resize(logoSize, logoSize, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();

  return sharp(background)
    .composite([{ input: logo, gravity: 'centre' }])
    .png()
    .toBuffer();
}

async function renderSquareIcon(size, outputPath) {
  const bg = await sharp({
    create: { width: size, height: size, channels: 4, background: SLATE },
  })
    .png()
    .toBuffer();

  const logoSize = Math.round(size * 0.72);
  const logo = await sharp(logoPath)
    .resize(logoSize, logoSize, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();

  await sharp(bg)
    .composite([{ input: logo, gravity: 'centre' }])
    .png()
    .toFile(outputPath);
}

async function renderScreenshotPlaceholder(width, height, label, outputPath) {
  const bg = await createGradientBackground(width, height);
  const withLogo = await compositeLogo(bg, width, height, 0.18);

  const labelSvg = Buffer.from(`
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <text x="50%" y="88%" text-anchor="middle"
        font-family="Segoe UI, Arial, sans-serif" font-size="28" fill="#94a3b8">
        ${label} — replace with TV screenshot
      </text>
    </svg>`);

  await sharp(withLogo)
    .composite([{ input: labelSvg, gravity: 'centre' }])
    .png()
    .toFile(outputPath);
}

mkdirSync(join(outDir, 'screenshots'), { recursive: true });

await renderSquareIcon(400, join(outDir, 'icon-400.png'));

const launcherBg = await createGradientBackground(1920, 1080);
const launcher = await compositeLogo(launcherBg, 1920, 1080, 0.2);
writeFileSync(join(outDir, 'launcher-1920x1080.png'), launcher);

const splashBg = await sharp({
  create: { width: 1920, height: 1080, channels: 4, background: SLATE },
})
  .png()
  .toBuffer();
const splashLogo = await sharp(logoPath)
  .resize(280, 280, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
  .png()
  .toBuffer();
const splashText = Buffer.from(`
  <svg width="1920" height="1080" xmlns="http://www.w3.org/2000/svg">
    <text x="960" y="640" text-anchor="middle"
      font-family="Segoe UI, Arial, sans-serif" font-size="56" font-weight="600" fill="#e2e8f0">
      Eyedeea Photos
    </text>
    <text x="960" y="700" text-anchor="middle"
      font-family="Segoe UI, Arial, sans-serif" font-size="28" fill="#64748b">
      Loading…
    </text>
  </svg>`);
await sharp(splashBg)
  .composite([
    { input: splashLogo, top: 320, left: 820 },
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

console.log('Generated branded submission assets under submission/');
console.log('Replace submission/screenshots/*.png with real TV captures before LG upload.');
