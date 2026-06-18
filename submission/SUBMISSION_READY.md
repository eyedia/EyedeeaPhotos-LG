# Ready to submit

Package built: `dist-package/com.eyediatech.eyedeeaphotos_1.0.0_all.ipk`

## Your final steps in LG Seller Lounge

1. Sign in at https://seller.lgappstv.com
2. Start **App Submission** (new app or update)
3. Upload the `.ipk` from `dist-package/`
4. Upload images from `submission/` (replace placeholder PNGs with real TV screenshots first)
5. Download and complete **Self Check-List** from Seller Lounge → attach in Test Info
6. Download **UX Scenario** template → fill using `UX_SCENARIO_OUTLINE.md` → attach
7. Paste tester instructions from `TESTER_NOTES.txt` (add your QA test account)
8. Service info: English, general age rating, target countries, no in-app purchases
9. Click **Submit**

## Install on your TV before submit

```powershell
ares-setup-device
cd D:\Work\EyedeeaPhotos-LG
powershell -File scripts/build-ipk.ps1 -DeviceName myTV
```

Replace placeholder screenshots:

```powershell
npm run submission-assets   # placeholders only
# Capture real screenshots from TV/simulator into submission/screenshots/
```

## QA test account requirements

- Active Eyedeea Photos subscription
- At least a few photos in the library
- Email/password entered in Seller Lounge Test Info
