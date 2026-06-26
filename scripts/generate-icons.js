/**
 * Render webOS in-package icons from the Eyedeea Photos brand PNG.
 */
import sharp from 'sharp';
import { mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { syncBrandIcon } from './brand-icon.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = join(__dirname, '..', 'public');

async function renderIcon(size, outputPath) {
  const brandIcon = syncBrandIcon();

  await sharp(brandIcon)
    .resize(size, size, { fit: 'cover' })
    .png()
    .toFile(outputPath);
}

mkdirSync(publicDir, { recursive: true });

await renderIcon(80, join(publicDir, 'icon.png'));
await renderIcon(130, join(publicDir, 'largeIcon.png'));

console.log('Generated public/icon.png (80x80) and public/largeIcon.png (130x130) from brand-icon-512.png');
