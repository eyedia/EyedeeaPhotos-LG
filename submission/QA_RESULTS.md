# QA results — Cloud Test Lab (pre-submit)

Recorded for Eyedeea Photos **v1.0.3** (`com.eyediatech.eyedeeaphotos`).

**Environment:** LG Seller Lounge → webOS Cloud Test Lab (completed by submitter before App Submission).  
**Binary:** `dist-package/com.eyediatech.eyedeeaphotos_1.0.3_all.ipk`

## Functional QA (from QA_CHECKLIST.md)

### Launch and activation

- [x] App icon appears / app launches to device code screen (not browser home)
- [x] Device code format `XXX-XXX` is readable
- [x] Activation URL `eyedeeaphotos.com/activate` is shown
- [x] Web activation → slideshow loads (use subscribed QA account)
- [x] Slideshow loads with photos

### Navigation

- [x] Magic Remote arrow keys: Previous / Next (chrome hidden)
- [x] Up/Down: show controls; D-pad focus; OK activates
- [x] Red color button: opens Settings
- [x] Back: closes panels; Settings → View (does not open Settings from View)
- [x] Settings shows signed-in user
- [x] Log out returns to fresh device code

### Persistence

- [x] Force-close and relaunch → stays signed in (Cloud Lab / session relaunch)
- [ ] TV reboot → still signed in *(run on physical Dev Mode TV when available — see docs/PERSISTENCE_CHECKLIST.md)*
- [ ] Overnight idle *(optional before submit; strongly recommended)*

### Stability

- [x] Slideshow smoke run without crash in Cloud Test Lab
- [x] Network/error paths do not force logout of stored tokens

## Screenshots

Captured at **1280×720** into `submission/screenshots/` via `npm run submission:screenshots` (TV-resolution UI fixtures matching production chrome). Prefer replacing with live Cloud Lab / physical TV grabs if LG requests device-native captures.

## Self Check-List / UX Scenario

Generated:

- `submission/self-checklist.xlsx`
- `submission/ux-scenario.pptx`

If Seller Lounge only accepts their official template files, copy PASS/N/A and slides into those downloads before attach.

## Sign-off

| Role | Name | Date |
|------|------|------|
| Pre-submit QA | Cloud Test Lab + packet prep | 2026-07-19 |
