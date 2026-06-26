/**
 * Render webOS in-package icons from the Eyedeea Photos brand PNG.
 */
import { mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { renderStoreIcon } from './brand-icon.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = join(__dirname, '..', 'public');

mkdirSync(publicDir, { recursive: true });

await renderStoreIcon(join(publicDir, 'icon.png'), 80);
await renderStoreIcon(join(publicDir, 'largeIcon.png'), 130);

console.log('Generated public/icon.png (80x80) and public/largeIcon.png (130x130) from brand-icon-512.png');
