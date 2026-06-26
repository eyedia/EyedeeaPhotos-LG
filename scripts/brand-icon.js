import { copyFileSync, existsSync, mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, '..');

export const BRAND_ICON_LOCAL = join(rootDir, 'public', 'brand-icon-512.png');
export const STORE_ICON_BG = { r: 0, g: 0, b: 0 };

export const BRAND_ICON_DEFAULT_SOURCE =
  'E:\\Work\\EyedeeaPhotos-Cloud\\apps\\android\\play-store-assets\\graphics\\eyedeea_photos_512x512.png';

export function syncBrandIcon() {
  const fromEnv = process.env.BRAND_ICON_PATH;
  const source =
    (fromEnv && existsSync(fromEnv) && fromEnv) ||
    (existsSync(BRAND_ICON_LOCAL) && BRAND_ICON_LOCAL) ||
    (existsSync(BRAND_ICON_DEFAULT_SOURCE) && BRAND_ICON_DEFAULT_SOURCE);

  if (!source) {
    throw new Error(
      `Brand icon not found. Copy eyedeea_photos_512x512.png to ${BRAND_ICON_LOCAL} or set BRAND_ICON_PATH.`
    );
  }

  if (source !== BRAND_ICON_LOCAL) {
    mkdirSync(join(rootDir, 'public'), { recursive: true });
    copyFileSync(source, BRAND_ICON_LOCAL);
  }

  return BRAND_ICON_LOCAL;
}

/** LG Seller Lounge store icon: exact size, no transparency, black background. */
export async function renderStoreIcon(outputPath, size = 400) {
  const brandIcon = syncBrandIcon();
  const ext = outputPath.toLowerCase();

  let pipeline = sharp(brandIcon)
    .resize(size, size, { fit: 'cover' })
    .flatten({ background: STORE_ICON_BG });

  if (ext.endsWith('.jpg') || ext.endsWith('.jpeg')) {
    await pipeline.jpeg({ quality: 95, mozjpeg: true }).toFile(outputPath);
  } else {
    await pipeline.png({ compressionLevel: 9, force: true }).toFile(outputPath);
  }
}
