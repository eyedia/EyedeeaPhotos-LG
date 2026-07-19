# Seller Lounge upload steps

Final submission checklist for [LG Seller Lounge](https://seller.lgappstv.com). Complete physical QA first (`QA_CHECKLIST.md` and `docs/PERSISTENCE_CHECKLIST.md`).

## Before you upload

- [x] IPKs built: `npm run package:webos` (unsigned — LG handles store signing)
- [x] UHD IPK: `dist-package/com.eyediatech.eyedeeaphotos_1.0.3_1920x1080_all.ipk`
- [x] FHD IPK: `dist-package/com.eyediatech.eyedeeaphotos_1.0.3_1280x720_all.ipk`
- [x] Screenshots in `submission/screenshots/` (5 × 1280×720)
- [x] Branded assets: `icon-400.jpg` (preferred) or `icon-400.png`, launcher, splash
- [x] Completed `self-checklist.xlsx`
- [x] Completed `ux-scenario.pptx`
- [ ] QA test account credentials filled in `TESTER_NOTES.txt` (`npm run fill:tester-notes:prompt`)

## Cloud Test Lab (pre-submit smoke test)

Before full App Submission, smoke-test the same IPK in **Applications → webOS Cloud Test Lab**:

1. Upload the IPK under **Applications → File Upload**.
2. Reserve a device; at the reservation time click **Start**.
3. Finish or skip TV setup — app icon appears on the far right of Home.
4. Use left-menu **Launch App** (do not rely only on clicking the Home icon).
5. If nothing happens: **Re-install** → **Launch App**. After a re-upload: **File Change** → **Re-install** → **Launch App**.

Expect the device-code screen. See [TESTING.md](../TESTING.md) §3 for details.

## App Submission wizard

### Step 1 — Binary

Upload **both** IPKs on the File Upload tab (same version, different `appinfo.json` resolution):

| Resolution | Models | File |
|------------|--------|------|
| 1920×1080 | Ultra HD (UHD) | `dist-package/com.eyediatech.eyedeeaphotos_1.0.3_1920x1080_all.ipk` |
| 1280×720 | Full HD (FHD) | `dist-package/com.eyediatech.eyedeeaphotos_1.0.3_1280x720_all.ipk` |

| Field | Value |
|-------|-------|
| App ID | `com.eyediatech.eyedeeaphotos` |
| Version | `1.0.3` (match `appinfo.json`) |

If Seller Lounge warns that 1920×1080 alone excludes FHD models, add the 1280×720 file — do not submit UHD-only unless you intentionally skip FHD TVs.

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
| Privacy policy URL | https://www.eyedeeaphotos.com/privacy |
| In-app purchases | No (nothing sold on the TV) |
| Paid content | Subscription (web subscription still counts for LG) |
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
| Paid content | Subscription |
| Device requirement | None |

### Step 5 — Submit

Click **Submit** and monitor QA status in Seller Lounge.

## After approval

See `SUBMISSION_GUIDE.md` section 8 for optional Eyedeea Photos Cloud updates (store link, analytics).
