# LG Content Store Submission Guide

Use this guide when submitting **Eyedeea Photos** from [LG Seller Lounge](https://seller.lgappstv.com).

**Related docs:** [LG prerequisites](../docs/LG_PREREQUISITES.md) · [Persistence QA](../docs/PERSISTENCE_CHECKLIST.md) · [Physical QA](./QA_CHECKLIST.md) · [Upload steps](./SELLER_LOUNGE_UPLOAD.md)

## 1. Build the binary

```powershell
cd D:\Work\EyedeeaPhotos-LG
npm run package:webos:sign
```

Or with an explicit certificate path:

```powershell
powershell -File scripts/build-ipk.ps1 -Sign -CertPath D:\certs\lg-developer.pem
```

Certificate resolution order: `-CertPath` → `LG_WEBOS_TV_CERT` env var → `certs/developer.pem`.

Upload the **signed** `.ipk` from `dist-package/` (1920×1080 resolution).

Optional: build a second package at 1280×720 for older webOS models by changing `resolution` in `appinfo.json` before packaging.

## 2. Required Seller Lounge assets

| Asset | Size | Notes |
|-------|------|-------|
| App icon | 400×400 PNG | `npm run submission-assets` — branded from `public/logo.svg` |
| Launcher background | 1920×1080 JPG/PNG | Brand image shown when app tile is focused |
| Splash screen | 1920×1080 JPG/PNG | Shown while app launches |
| Primary screenshot | 1280×720 or 960×540 | Device code screen |
| Secondary screenshots (4 more) | Same | Waiting, slideshow, settings, logout |

Generate branded placeholders, then replace screenshots with real TV captures:

```powershell
npm run submission-assets
# Capture from TV into submission/screenshots/01-device-code.png … 05-logout.png
```

## 3. Self-checklist (Excel)

1. Log in to Seller Lounge → download the latest **Self Check-List** template
2. Test on a physical LG TV (Developer Mode) — simulator alone is not enough for QA
3. Mark each row **PASS** or **N/A** (never submit with **FAIL**)
4. Attach the completed file in **Test Info**

Key flows to verify:

- [ ] App launches to device code (not web home)
- [ ] Code can be activated at https://www.eyedeeaphotos.com/activate
- [ ] Slideshow loads after activation
- [ ] Settings shows signed-in user
- [ ] Logout returns to device code
- [ ] Magic Remote arrows work in slideshow
- [ ] Back key: View → Settings → View (does not exit app unexpectedly)
- [ ] Memory stable during 30+ minute slideshow

## 4. UX Scenario (PowerPoint)

Download the **UX Scenario** template from Seller Lounge and document:

### Slide A — Launch / device code

1. App icon on LG home
2. Device code (XXX-XXX) prominently displayed
3. Activation URL `eyedeeaphotos.com/activate`
4. “Waiting for activation” status

### Slide B — Web activation (reference only)

Note for QA: user activates on phone/desktop at `/activate` — not inside the TV app.

### Slide C — Slideshow view

1. Full-screen photo
2. Metadata overlay (title, date, location)
3. Toolbar: Previous, Info, Settings, Next

### Slide D — Settings

1. User name and email
2. Household name
3. Log out button

### Slide E — After logout

Fresh device code screen (same as launch)

Remove template instruction slides before upload.

## 5. Test Info for LG QA

| Field | Value |
|-------|-------|
| Reference email | support@eyediatech.com |
| Remote controller | Both Magic and standard remote |
| Paid content | No in-app purchases (subscription on web) |
| In-app ads | No |
| Device requirement | None |
| Geo IP block | As applicable for launch countries |

### Tester instructions (paste into Seller Lounge)

```
1. Launch "Eyedeea Photos" on the LG TV.
2. Note the device code shown (format XXX-XXX).
3. On a phone or computer, open https://www.eyedeeaphotos.com/activate
4. Sign in with the test account below and enter the device code.
5. Confirm the TV transitions to the photo slideshow within ~10 seconds.
6. Press Back to open Settings — verify account name/email.
7. Press Log out — verify the TV shows a new device code.
```

### Test account

Provide a **subscribed** Eyedeea Photos account in Seller Lounge (activation requires active subscription):

- Email: `[YOUR_QA_TEST_EMAIL]`
- Password: `[YOUR_QA_TEST_PASSWORD]`

Ensure the account has photos in its library before submission.

## 6. Service Info

- **Title:** Eyedeea Photos
- **Category:** Photo / Lifestyle
- **Age rating:** General / 3+ (family photos; no adult content in app)
- **Countries:** Select your launch regions
- **Language:** English

## 7. Submit

Seller Lounge → **App Submission** → complete:

1. File upload (`.ipk`)
2. Images (icon, launcher, splash, screenshots)
3. Service info (countries, age rating)
4. Test info (self-checklist, UX scenario, tester notes, test account)

Click **Submit** and monitor QA status in Seller Lounge.

## 8. After approval

Optional follow-up in `EyedeeaPhotos-Cloud`:

- Add LG store link to `config/base.json`
- Add LG TV card on `/apps` download page
- Add `lg_webos` caller detection in API analytics
