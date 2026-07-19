# Seller Lounge App Submission — field fill sheet

Use this while uploading at https://seller.lgappstv.com → **App Submission**.
Binary and assets are prepared for **v1.0.3**.

## Before you click through

- [ ] IPK exists: `dist-package/com.eyediatech.eyedeeaphotos_1.0.3_1920x1080_all.ipk` (UHD)
- [ ] IPK exists: `dist-package/com.eyediatech.eyedeeaphotos_1.0.3_1280x720_all.ipk` (FHD)
- [ ] Screenshots: `submission/screenshots/01`–`05` (1280×720)
- [ ] Icon: `submission/icon-400.jpg` (preferred) or `.png`
- [ ] Launcher: `submission/launcher-1920x1080.png`
- [ ] Splash: `submission/splash-1920x1080.png`
- [ ] `submission/self-checklist.xlsx` (or LG official template filled from it)
- [ ] `submission/ux-scenario.pptx` (or LG official template filled from it)
- [ ] `submission/TESTER_NOTES.txt` has real QA email/password (`npm run fill:tester-notes`)

## Step 1 — Binary

Upload **both** IPKs (File Upload tab). Skipping 1280×720 excludes FHD models.

| Field | Value |
|-------|-------|
| UHD IPK (1920×1080) | `dist-package/com.eyediatech.eyedeeaphotos_1.0.3_1920x1080_all.ipk` |
| FHD IPK (1280×720) | `dist-package/com.eyediatech.eyedeeaphotos_1.0.3_1280x720_all.ipk` |
| App ID | `com.eyediatech.eyedeeaphotos` |
| Version | `1.0.3` |
| Signing | Upload **unsigned** (LG signs in review) |

## Step 2 — Images

If Seller Lounge imported `appinfo.json`, **clear the auto-filled 80×80 icon** first.

| Field | File / value |
|-------|----------------|
| App Icon | `submission/icon-400.jpg` |
| App Tile Color | `#000000` |
| Launcher background | `submission/launcher-1920x1080.png` |
| Splash | `submission/splash-1920x1080.png` |
| Screenshot 1 | `submission/screenshots/01-device-code.png` |
| Screenshot 2 | `submission/screenshots/02-waiting.png` |
| Screenshot 3 | `submission/screenshots/03-slideshow.png` |
| Screenshot 4 | `submission/screenshots/04-settings.png` |
| Screenshot 5 | `submission/screenshots/05-logout.png` |

## Step 3 — Service info

| Field | Value |
|-------|-------|
| Title | Eyedeea Photos |
| Category | Photo / Lifestyle |
| Age rating | General / 3+ |
| Language | English |
| Countries | Your launch regions |
| Privacy policy URL | https://www.eyedeeaphotos.com/privacy |
| In-app purchases | No (nothing sold on the TV) |
| Paid content | Subscription (payment/subscription on web still counts for LG) |
| Ads | No |

## Step 4 — Test info

| Field | Value |
|-------|-------|
| Tester instructions | Paste entire `submission/TESTER_NOTES.txt` |
| Self Check-List | Attach `submission/self-checklist.xlsx` (or LG official filled copy) |
| UX Scenario | Attach `submission/ux-scenario.pptx` (or LG official filled copy) |
| Reference email | support@eyediatech.com |
| Remote controller | Magic Remote and standard remote |
| Paid content | Subscription |
| Device requirement | None |

## Step 5 — Submit

Click **Submit**. Record the submission date in [MONITOR_QA.md](./MONITOR_QA.md) and check Seller Lounge daily until QA completes.

## Regenerate packet locally

```powershell
npm run package:webos
npm run submission:screenshots
npm run submission:checklist
npm run submission:ux-scenario
# After creating .env.submission:
npm run fill:tester-notes
```
