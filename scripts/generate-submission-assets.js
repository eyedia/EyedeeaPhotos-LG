/**
 * Generate LG Seller Lounge placeholder marketing images.
 */
import { writeFileSync, mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { deflateSync } from 'zlib';

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = join(__dirname, '..', 'submission');

function crc32(buffer) {
  let crc = 0xffffffff;
  for (let i = 0; i < buffer.length; i += 1) {
    crc ^= buffer[i];
    for (let j = 0; j < 8; j += 1) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'ascii');
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([length, typeBuf, data, crcBuf]);
}

function createGradientPng(width, height) {
  const raw = Buffer.alloc((width * 4 + 1) * height);
  for (let y = 0; y < height; y += 1) {
    const rowStart = y * (width * 4 + 1);
    raw[rowStart] = 0;
    const t = y / Math.max(height - 1, 1);
    const r = Math.round(2 + t * 12);
    const g = Math.round(6 + t * 28);
    const b = Math.round(23 + t * 80);
    for (let x = 0; x < width; x += 1) {
      const px = rowStart + 1 + x * 4;
      raw[px] = r;
      raw[px + 1] = g;
      raw[px + 2] = b;
      raw[px + 3] = 255;
    }
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;

  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  return Buffer.concat([
    signature,
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

mkdirSync(join(outDir, 'screenshots'), { recursive: true });

writeFileSync(join(outDir, 'icon-400.png'), createGradientPng(400, 400));
writeFileSync(join(outDir, 'launcher-1920x1080.png'), createGradientPng(1920, 1080));
writeFileSync(join(outDir, 'splash-1920x1080.png'), createGradientPng(1920, 1080));
writeFileSync(join(outDir, 'screenshots', '01-device-code-placeholder.png'), createGradientPng(1280, 720));
writeFileSync(join(outDir, 'screenshots', '02-slideshow-placeholder.png'), createGradientPng(1280, 720));
writeFileSync(join(outDir, 'screenshots', '03-settings-placeholder.png'), createGradientPng(1280, 720));

console.log('Generated submission placeholder PNGs under submission/');
console.log('Replace placeholders with real TV screenshots before LG upload.');
