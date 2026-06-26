# Seller Lounge upload steps

Final submission checklist for [LG Seller Lounge](https://seller.lgappstv.com). Complete physical QA first (`QA_CHECKLIST.md` and `docs/PERSISTENCE_CHECKLIST.md`).

## Before you upload

- [ ] Signed IPK built: `npm run package:webos:sign` (or `build-ipk.ps1 -Sign`)
- [ ] IPK path: `dist-package/com.eyediatech.eyedeeaphotos_1.0.0_all.ipk`
- [ ] Real TV screenshots in `submission/screenshots/` (5 files)
- [ ] Branded assets: `icon-400.jpg` (preferred) or `icon-400.png`, launcher, splash
- [ ] Completed `self-checklist.xlsx` from Seller Lounge template
- [ ] Completed `ux-scenario.pptx` from Seller Lounge template
- [ ] QA test account credentials filled in `TESTER_NOTES.txt`

## App Submission wizard

### Step 1 — Binary

Upload the **signed** `.ipk` from `dist-package/`.

| Field | Value |
|-------|-------|
| App ID | `com.eyediatech.eyedeeaphotos` |
| Version | `1.0.0` (match `appinfo.json`) |
| Resolution | 1920×1080 |

### Step 2 — Images

**Important — App Icon error fix:** If you chose **Yes** to import `appinfo.json`, Seller Lounge auto-fills the **80×80** `icon.png` from the IPK. That triggers *"Upload 400 x 400 pixels and greater icons only."*

1. Go to **Images** → **App Icon**
2. **Remove/clear** the auto-imported small icon
3. Upload **`submission/icon-400.jpg`** (recommended — no transparency) or `submission/icon-400.png`
4. Set **App Tile Color** to `#000000` (must match icon background)

| Asset | File |
|-------|------|
| App icon (400×400, no transparency) | `submission/icon-400.jpg` |
| Launcher background (1920×1080) | `submission/launcher-1920x1080.png` |
| Splash screen (1920×1080) | `submission/splash-1920x1080.png` |
| Screenshot 1 | `submission/screenshots/01-device-code.png` |
| Screenshot 2 | `submission/screenshots/02-waiting.png` |
| Screenshot 3 | `submission/screenshots/03-slideshow.png` |
| Screenshot 4 | `submission/screenshots/04-settings.png` |
| Screenshot 5 | `submission/screenshots/05-logout.png` |

### Step 3 — Service info

| Field | Value |
|-------|-------|
| Title | Eyedeea Photos |
| Category | Photo / Lifestyle |
| Age rating | General / 3+ |
| Language | English |
| Countries | Your launch regions |
| Privacy policy URL | Your production privacy page |
| In-app purchases | No |
| Ads | No |

### Step 4 — Test info

Paste tester instructions from `submission/TESTER_NOTES.txt` (with real QA credentials).

Attach:

- `self-checklist.xlsx`
- `ux-scenario.pptx`

| Field | Value |
|-------|-------|
| Reference email | support@eyediatech.com |
| Remote controller | Magic Remote and standard remote |
| Paid content | No (subscription on web) |
| Device requirement | None |

### Step 5 — Submit

Click **Submit** and monitor QA status in Seller Lounge.

## After approval

See `SUBMISSION_GUIDE.md` section 8 for optional Eyedeea Photos Cloud updates (store link, analytics).
