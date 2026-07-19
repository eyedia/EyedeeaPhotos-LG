# Ready to submit

## Build IPK for Seller Lounge

```powershell
npm run package:webos
```

Output (both required for full store coverage):

- `dist-package/com.eyediatech.eyedeeaphotos_1.0.3_1920x1080_all.ipk` — Ultra HD (UHD)
- `dist-package/com.eyediatech.eyedeeaphotos_1.0.3_1280x720_all.ipk` — Full HD (FHD)

**Do not require signing for store upload.** LG signs during Content Store review. Optional legacy signing (`npm run package:webos:sign`) only applies if you still have `.pem`/`.crt` files — see [docs/LG_PREREQUISITES.md](../docs/LG_PREREQUISITES.md).

If Seller Lounge warns that 1920×1080 alone excludes FHD models, upload the 1280×720 IPK on the File Upload tab as well.

Smoke-test the same IPK in Seller Lounge **webOS Cloud Test Lab** before submit (see [SELLER_LOUNGE_UPLOAD.md](./SELLER_LOUNGE_UPLOAD.md) and [TESTING.md](../TESTING.md) §3). Use **Launch App** / **Re-install** if the Home icon does nothing.

## Pre-submit checklists

1. [docs/PERSISTENCE_CHECKLIST.md](../docs/PERSISTENCE_CHECKLIST.md) — activation survives restart
2. [QA_CHECKLIST.md](./QA_CHECKLIST.md) — physical TV functional QA + screenshots
3. [SELLER_LOUNGE_UPLOAD.md](./SELLER_LOUNGE_UPLOAD.md) — step-by-step Seller Lounge wizard

## Your final steps in LG Seller Lounge

Use the field-by-field sheet: [WIZARD_FILL_SHEET.md](./WIZARD_FILL_SHEET.md).

1. Sign in at https://seller.lgappstv.com
2. Start **App Submission** (new app or update)
3. Upload the `.ipk` from `dist-package/`
4. Upload images from `submission/` (clear auto-imported 80×80 icon first)
5. Attach `self-checklist.xlsx` and `ux-scenario.pptx` (or LG official templates filled from them)
6. Run `powershell -File scripts/prompt-qa-credentials.ps1`, then paste `TESTER_NOTES.txt`
7. Service info: English, General/3+, countries, privacy `https://www.eyedeeaphotos.com/privacy`, Paid content = **Subscription**, no TV IAP/ads
8. Click **Submit** — track status in [MONITOR_QA.md](./MONITOR_QA.md)

## Install on your TV before submit

```powershell
ares-setup-device
powershell -File scripts/build-ipk.ps1 -DeviceName myTV
```

Generate branded assets:

```powershell
npm run icons
npm run submission-assets
# Replace submission/screenshots/*.png with real TV captures
```

## QA test account requirements

- Active Eyedeea Photos subscription
- At least a few photos in the library
- Email/password entered in Seller Lounge Test Info (`TESTER_NOTES.txt`)
