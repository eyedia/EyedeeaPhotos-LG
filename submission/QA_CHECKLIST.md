# Physical TV QA checklist

Complete on a **physical LG TV** in Developer Mode when available. Cloud Test Lab results for v1.0.4 are recorded in [QA_RESULTS.md](./QA_RESULTS.md).

## Install build

```powershell
powershell -File scripts/build-ipk.ps1 -DeviceName myTV
```

Or install an existing IPK:

```powershell
ares-install -d myTV dist-package\com.eyediatech.eyedeeaphotos_1.0.4_all.ipk
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

- [ ] Magic Remote arrow keys: Previous / Next in slideshow (when chrome hidden)
- [ ] Up/Down: show controls; D-pad moves focus; OK activates focused control
- [ ] Red color button: opens Settings (red hint under gear)
- [ ] Back key: closes panels; from Settings returns to View (does not open Settings from View)
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

Current packet already has 1280×720 captures from `npm run submission:screenshots`. Replace with live Cloud Lab / physical TV grabs if LG requests them.

## LG Self Check-List

1. Use generated `submission/self-checklist.xlsx`, **or** download LG’s official template and copy PASS/N/A from ours
2. Mark every row **PASS** or **N/A** only (never **FAIL**)
3. Attach in Seller Lounge → Test Info

## UX Scenario PowerPoint

1. Use generated `submission/ux-scenario.pptx`, **or** download LG’s template and copy slides from ours / `UX_SCENARIO_OUTLINE.md`
2. Remove template instruction slides if using LG’s file
3. Attach in Seller Lounge → Test Info
