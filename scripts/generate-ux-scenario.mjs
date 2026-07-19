/**
 * Generate UX Scenario PowerPoint for Eyedeea Photos v1.0.3 from the outline
 * and submission screenshots. If Seller Lounge requires their official template,
 * copy these slides into that .pptx (and remove instruction slides).
 *
 * Usage: node scripts/generate-ux-scenario.mjs
 */
import PptxGenJS from 'pptxgenjs';
import { existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const shots = join(root, 'submission', 'screenshots');
const outPath = join(root, 'submission', 'ux-scenario.pptx');

const pptx = new PptxGenJS();
pptx.author = 'Eyedeea Tech';
pptx.title = 'Eyedeea Photos — UX Scenario (webOS TV)';
pptx.subject = 'LG Seller Lounge UX Scenario v1.0.3';
pptx.defineLayout({ name: 'LAYOUT_16x9', width: 13.333, height: 7.5 });
pptx.layout = 'LAYOUT_16x9';

function addTitleSlide(title, subtitle) {
  const s = pptx.addSlide();
  s.addShape(pptx.shapes.RECTANGLE, {
    x: 0, y: 0, w: '100%', h: '100%',
    fill: { color: '020617' },
  });
  s.addText(title, {
    x: 0.8, y: 2.6, w: 11.7, h: 1,
    fontSize: 36, bold: true, color: 'F8FAFC', fontFace: 'Arial',
  });
  s.addText(subtitle, {
    x: 0.8, y: 3.7, w: 11.7, h: 0.8,
    fontSize: 18, color: '94A3B8', fontFace: 'Arial',
  });
}

function addFlowSlide({ title, bullets, image, note }) {
  const s = pptx.addSlide();
  s.addShape(pptx.shapes.RECTANGLE, {
    x: 0, y: 0, w: '100%', h: '100%',
    fill: { color: '0F172A' },
  });
  s.addText(title, {
    x: 0.5, y: 0.3, w: 12.3, h: 0.6,
    fontSize: 24, bold: true, color: 'F8FAFC', fontFace: 'Arial',
  });

  const textItems = bullets.map((b) => ({
    text: b,
    options: { bullet: true, color: 'E2E8F0', fontSize: 14, fontFace: 'Arial', breakLine: true },
  }));
  s.addText(textItems, { x: 0.5, y: 1.1, w: 5.8, h: 5.2, valign: 'top' });

  if (image && existsSync(image)) {
    s.addImage({ path: image, x: 6.6, y: 1.1, w: 6.2, h: 3.49 });
  }
  if (note) {
    s.addText(note, {
      x: 6.6, y: 4.8, w: 6.2, h: 2,
      fontSize: 12, color: '94A3B8', fontFace: 'Arial',
    });
  }
}

addTitleSlide(
  'Eyedeea Photos — UX Scenario',
  'LG webOS TV · com.eyediatech.eyedeeaphotos · v1.0.3'
);

addFlowSlide({
  title: '1. Launch / device code',
  bullets: [
    'App launches to Eyedeea Photos device code screen (not web home)',
    'Large XXX-XXX code for web activation',
    'Shows www.eyedeeaphotos.com/activate',
    'Status shows Waiting for activation… while polling',
  ],
  image: join(shots, '01-device-code.png'),
  note: 'Activation is completed on phone/desktop — not inside the TV app.',
});

addFlowSlide({
  title: '2. Waiting for activation',
  bullets: [
    'TV polls until the code is entered on the web',
    'Progress bar shows remaining code lifetime',
    'On success, TV switches to slideshow within ~10 seconds',
  ],
  image: join(shots, '02-waiting.png'),
  note: 'QA must use a subscribed account with photos in the library.',
});

addFlowSlide({
  title: '3. Slideshow view',
  bullets: [
    'Full-screen family photo slideshow',
    'Metadata overlay: title, date, location',
    'Left/Right: previous / next (chrome hidden)',
    'Up/Down: show controls; OK activates focused control',
    'Red remote button (or gear + OK): Settings',
  ],
  image: join(shots, '03-slideshow.png'),
  note: 'Back closes panels; from Settings returns to View.',
});

addFlowSlide({
  title: '4. Settings',
  bullets: [
    'Shows signed-in name and email',
    'Back returns to slideshow',
    'Log out clears session',
  ],
  image: join(shots, '04-settings.png'),
  note: 'No in-app purchases or ads. Subscription is managed on the web.',
});

addFlowSlide({
  title: '5. After logout',
  bullets: [
    'Fresh device code issued',
    'Same /activate instructions shown',
    'User must activate again to view photos',
  ],
  image: join(shots, '05-logout.png'),
  note: 'Remove any Seller Lounge template instruction slides before upload.',
});

await pptx.writeFile({ fileName: outPath });
console.log('Wrote', outPath);
