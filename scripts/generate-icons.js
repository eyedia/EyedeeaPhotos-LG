/**
 * Render branded PNG icons from public/logo.svg for webOS packaging.
 */
import sharp from 'sharp';
import { writeFileSync, mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = join(__dirname, '..', 'public');
const logoPath = join(publicDir, 'logo.svg');

const BRAND_BG = { r: 15, g: 23, b: 42, alpha: 1 };

async function renderIcon(size, outputPath, paddingRatio = 0.12) {
  const padding = Math.round(size * paddingRatio);
  const inner = size - padding * 2;

  const logo = await sharp(logoPath)
    .resize(inner, inner, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();

  await sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: BRAND_BG,
    },
  })
    .composite([{ input: logo, gravity: 'centre' }])
    .png()
    .toFile(outputPath);
}

mkdirSync(publicDir, { recursive: true });

await renderIcon(80, join(publicDir, 'icon.png'));
await renderIcon(130, join(publicDir, 'largeIcon.png'));

console.log('Generated branded public/icon.png and public/largeIcon.png from logo.svg');
