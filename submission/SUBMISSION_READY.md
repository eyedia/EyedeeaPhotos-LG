# Ready to submit

## Build signed IPK

```powershell
npm run package:webos:sign
# Or: powershell -File scripts/build-ipk.ps1 -Sign -CertPath path\to\developer.pem
```

Output: `dist-package/com.eyediatech.eyedeeaphotos_1.0.0_all.ipk` (signed)

See [docs/LG_PREREQUISITES.md](../docs/LG_PREREQUISITES.md) for certificate setup.

## Pre-submit checklists

1. [docs/PERSISTENCE_CHECKLIST.md](../docs/PERSISTENCE_CHECKLIST.md) — activation survives restart
2. [QA_CHECKLIST.md](./QA_CHECKLIST.md) — physical TV functional QA + screenshots
3. [SELLER_LOUNGE_UPLOAD.md](./SELLER_LOUNGE_UPLOAD.md) — step-by-step Seller Lounge wizard

## Your final steps in LG Seller Lounge

1. Sign in at https://seller.lgappstv.com
2. Start **App Submission** (new app or update)
3. Upload the **signed** `.ipk` from `dist-package/`
4. Upload images from `submission/` (replace screenshot placeholders with real TV captures)
5. Download and complete **Self Check-List** from Seller Lounge → attach in Test Info
6. Download **UX Scenario** template → fill using `UX_SCENARIO_OUTLINE.md` → attach
7. Paste tester instructions from `TESTER_NOTES.txt` (add your QA test account)
8. Service info: English, general age rating, target countries, privacy URL, no in-app purchases
9. Click **Submit**

## Install on your TV before submit

```powershell
ares-setup-device
powershell -File scripts/build-ipk.ps1 -Sign -DeviceName myTV
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
