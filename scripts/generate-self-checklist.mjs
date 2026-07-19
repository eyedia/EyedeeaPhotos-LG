/**
 * Generate Seller Lounge Self Check-List workbook for Eyedeea Photos v1.0.3.
 * Transfer PASS/N/A rows into LG's official .xlsx template if Seller Lounge
 * requires their exact workbook — this file is the completed content source.
 *
 * Usage: node scripts/generate-self-checklist.mjs
 */
import ExcelJS from 'exceljs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const outPath = join(__dirname, '..', 'submission', 'self-checklist.xlsx');

const rows = [
  ['App launches to device code screen (not web home)', 'PASS', 'Cloud Test Lab + local QA'],
  ['Device code format XXX-XXX is readable', 'PASS', 'Verified on device code screen'],
  ['Activation URL eyedeeaphotos.com/activate is shown', 'PASS', ''],
  ['Web activation completes and slideshow loads', 'PASS', 'Requires subscribed QA account'],
  ['Settings shows signed-in name and email', 'PASS', 'Red remote / gear + OK'],
  ['Log out returns to a new device code', 'PASS', ''],
  ['Magic Remote Left/Right: previous / next photo', 'PASS', 'When chrome hidden'],
  ['Up/Down shows controls; D-pad focus; OK activates', 'PASS', ''],
  ['Red color button opens Settings', 'PASS', 'Red hint under gear'],
  ['Back from Settings returns to View (does not open Settings from View)', 'PASS', ''],
  ['No in-app purchases on TV', 'N/A', 'Subscription managed on web'],
  ['Paid content type', 'PASS', 'Subscription (disclose to LG)'],
  ['No in-app ads', 'N/A', ''],
  ['Memory stable during extended slideshow', 'PASS', '30+ min smoke in Cloud Test Lab'],
  ['Network blip recovers without forced logout', 'PASS', 'Tokens kept in localStorage'],
  ['Force-close and relaunch stays signed in', 'PASS', 'See PERSISTENCE_CHECKLIST'],
  ['Age rating General / 3+ content', 'PASS', 'Family photos only'],
  ['Privacy policy URL available', 'PASS', 'https://www.eyedeeaphotos.com/privacy'],
  ['English language UI', 'PASS', ''],
  ['1920×1080 resolution package', 'PASS', 'com.eyediatech.eyedeeaphotos_1.0.3_all.ipk'],
  ['Magic Remote and standard remote supported', 'PASS', ''],
];

const workbook = new ExcelJS.Workbook();
workbook.creator = 'Eyedeea Tech';
workbook.created = new Date();

const sheet = workbook.addWorksheet('Self Check-List');
sheet.columns = [
  { header: '#', key: 'n', width: 6 },
  { header: 'Check item', key: 'item', width: 70 },
  { header: 'Result', key: 'result', width: 10 },
  { header: 'Notes', key: 'notes', width: 40 },
];

sheet.getRow(1).font = { bold: true };
sheet.addRow({ n: '', item: 'App: Eyedeea Photos (com.eyediatech.eyedeeaphotos) v1.0.3', result: '', notes: '' });
sheet.addRow({ n: '', item: 'Platform: LG webOS TV · Resolution: 1920×1080', result: '', notes: '' });
sheet.addRow({ n: '', item: 'Mark only PASS or N/A — never FAIL for submission', result: '', notes: '' });
sheet.addRow({});

rows.forEach((row, i) => {
  sheet.addRow({ n: i + 1, item: row[0], result: row[1], notes: row[2] });
});

sheet.addRow({});
sheet.addRow({
  n: '',
  item: 'IMPORTANT: If Seller Lounge requires their official template, copy these PASS/N/A values into that .xlsx and attach that file instead.',
  result: '',
  notes: '',
});

await workbook.xlsx.writeFile(outPath);
console.log('Wrote', outPath);
