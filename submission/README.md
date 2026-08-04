# Submission asset checklist

Copy final assets here before uploading to LG Seller Lounge.

**Guides:** [SUBMISSION_GUIDE.md](./SUBMISSION_GUIDE.md) · [QA_CHECKLIST.md](./QA_CHECKLIST.md) · [SELLER_LOUNGE_UPLOAD.md](./SELLER_LOUNGE_UPLOAD.md) · [WIZARD_FILL_SHEET.md](./WIZARD_FILL_SHEET.md)

Generate / refresh packet:

```powershell
npm run icons
npm run submission-assets
npm run submission:prepare
powershell -File scripts/prompt-qa-credentials.ps1
```

## Binary

- [x] `../dist-package/com.eyediatech.eyedeeaphotos_1.0.4_1920x1080_all.ipk` (UHD)
- [x] `../dist-package/com.eyediatech.eyedeeaphotos_1.0.4_1280x720_all.ipk` (FHD)

## Images

- [x] `icon-400.jpg` — 400×400 app store icon (preferred; also `icon-400.png`)
- [x] `launcher-1920x1080.png` — launcher background
- [x] `splash-1920x1080.png` — splash screen
- [x] `screenshots/01-device-code.png` (1280×720)
- [x] `screenshots/02-waiting.png`
- [x] `screenshots/03-slideshow.png`
- [x] `screenshots/04-settings.png`
- [x] `screenshots/05-logout.png`

Prefer live Cloud Lab / physical TV captures if LG requests device-native grabs; current set is TV-resolution UI matching production chrome.

## Documents

- [x] `self-checklist.xlsx` — PASS/N/A completed (`npm run submission:checklist`)
- [x] `ux-scenario.pptx` — slides + screenshots (`npm run submission:ux-scenario`)
- [ ] `TESTER_NOTES.txt` — run `powershell -File scripts/prompt-qa-credentials.ps1` before upload

If Seller Lounge rejects non-official Excel/PPTX, download LG templates and copy content from our generated files.
