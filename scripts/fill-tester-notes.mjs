/**
 * Fill submission/TESTER_NOTES.txt from environment or .env.submission
 *
 * Required:
 *   SUBMISSION_QA_EMAIL
 *   SUBMISSION_QA_PASSWORD
 *
 * Usage:
 *   # PowerShell
 *   $env:SUBMISSION_QA_EMAIL="qa@example.com"
 *   $env:SUBMISSION_QA_PASSWORD="..."
 *   node scripts/fill-tester-notes.mjs
 */
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const envPath = join(root, '.env.submission');
const notesPath = join(root, 'submission', 'TESTER_NOTES.txt');

function loadEnvFile(path) {
  if (!existsSync(path)) return;
  const text = readFileSync(path, 'utf8');
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq < 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!(key in process.env) || !process.env[key]) {
      process.env[key] = value;
    }
  }
}

loadEnvFile(envPath);

const email = process.env.SUBMISSION_QA_EMAIL || '';
const password = process.env.SUBMISSION_QA_PASSWORD || '';

if (!email || !password) {
  console.error(`Missing SUBMISSION_QA_EMAIL / SUBMISSION_QA_PASSWORD.

Create ${envPath} (gitignored) with:

SUBMISSION_QA_EMAIL=your-qa@example.com
SUBMISSION_QA_PASSWORD=your-password

Account must have an active Eyedeea Photos subscription and photos in the library.`);
  process.exit(1);
}

const notes = `Launch "Eyedeea Photos" on the LG TV.
Note the device code shown on screen (format XXX-XXX).
On a phone or computer, open https://www.eyedeeaphotos.com/activate
Sign in with the test account provided below and enter the device code.
Within about 10 seconds the TV should switch to the photo slideshow.
Press the Red button on the remote (or focus the gear icon and press OK) to open Settings and confirm the signed-in name and email.
Press Log out and confirm the TV returns to a new device code screen.

Test account:
Email: ${email}
Password: ${password}

Notes:
- Test account must have an active Eyedeea Photos subscription.
- Account should have photos uploaded before QA testing.
- No in-app purchases or ads.
- Remote: Magic Remote and standard remote both supported.
- Reference contact: support@eyediatech.com
- App version: 1.0.3 (com.eyediatech.eyedeeaphotos)
- Privacy policy: https://www.eyedeeaphotos.com/privacy
`;

writeFileSync(notesPath, notes, 'utf8');
console.log('Updated', notesPath, 'with QA email', email);
