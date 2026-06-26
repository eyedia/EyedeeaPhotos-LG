# Physical TV QA checklist

Complete on a **physical LG TV** in Developer Mode before LG Content Store submission. Simulator testing alone is not sufficient for LG QA.

## Install signed build

```powershell
powershell -File scripts/build-ipk.ps1 -Sign -CertPath path\to\developer.pem -DeviceName myTV
```

Or install an existing IPK:

```powershell
ares-install -d myTV dist-package\com.eyediatech.eyedeeaphotos_1.0.0_all.ipk
ares-launch -d myTV com.eyediatech.eyedeeaphotos
```

## Functional QA

Mark each **PASS** before submit.

### Launch and activation

- [ ] App icon appears on LG home screen with branded icon
- [ ] App launches to device code screen (not browser home)
- [ ] Device code format `XXX-XXX` is readable
- [ ] Activation URL `eyedeeaphotos.com/activate` is shown
- [ ] Web activation completes within ~10 seconds
- [ ] Slideshow loads with photos

### Navigation

- [ ] Magic Remote arrow keys: Previous / Next in slideshow
- [ ] Back key: View → Settings → View (does not exit app unexpectedly)
- [ ] Settings shows signed-in user name and email
- [ ] Log out returns to fresh device code screen

### Persistence (see also docs/PERSISTENCE_CHECKLIST.md)

- [ ] Force-close and relaunch → slideshow (no re-activation)
- [ ] TV reboot → still signed in

### Stability

- [ ] Slideshow runs 30+ minutes without crash or visible memory issues
- [ ] Network blip during slideshow recovers gracefully

## Screenshots for Seller Lounge

Capture **1280×720** or **960×540** from the TV (or simulator at TV resolution). Save to `submission/screenshots/`:

| File | Screen |
|------|--------|
| `01-device-code.png` | Device code displayed |
| `02-waiting.png` | "Waiting for activation" status |
| `03-slideshow.png` | Full-screen photo with overlay |
| `04-settings.png` | Settings with user info |
| `05-logout.png` | Device code after logout |

Replace the branded placeholders from `npm run submission-assets` with these captures before upload.

## LG Self Check-List

1. Download the latest **Self Check-List** (.xlsx) from [Seller Lounge](https://seller.lgappstv.com)
2. Complete every row — **PASS** or **N/A** only (never **FAIL**)
3. Save as `submission/self-checklist.xlsx`
4. Attach in Seller Lounge → Test Info

## UX Scenario PowerPoint

1. Download the **UX Scenario** template from Seller Lounge
2. Fill slides using `submission/UX_SCENARIO_OUTLINE.md`
3. Use real screenshots from `submission/screenshots/`
4. Remove template instruction slides
5. Save as `submission/ux-scenario.pptx`
