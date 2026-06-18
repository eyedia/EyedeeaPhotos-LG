# Eyedeea Photos — LG webOS App

View-only LG Smart TV app: device-code sign-in on the TV, activation at `eyedeeaphotos.com/activate`, then fullscreen photo slideshow only. Never shows the web home page, library, or other routes. Settings shows the signed-in user and supports logout (returns to device code).

## User flow

1. Fresh launch → device code screen on TV
2. User enters code at https://www.eyedeeaphotos.com/activate (phone/desktop)
3. After activation → slideshow view only
4. Settings → logged-in user info + logout
5. Logout → fresh device code screen

## Links

- API: https://www.eyedeeaphotos.com/api/v1
- Activate: https://www.eyedeeaphotos.com/activate
- LG Seller Lounge: https://seller.lgappstv.com
- Package: `dist-package/com.eyediatech.eyedeeaphotos_1.0.0_all.ipk`

## Todo checklist

- [x] Scaffold repo (Vite + React, `appinfo.json`, webOSTV.js, this file)
- [x] Device code screen (issue + poll device auth)
- [x] Auth store + API client (token persistence, session, refresh, logout)
- [x] View screen (slideshow: config, current, queue, heartbeat, viewed)
- [x] Settings screen (user info + logout)
- [x] webOS remote / back handling, 1080p layout
- [x] Build script (`build-ipk.ps1`) and `.ipk` packaging
- [x] Submission folder (guides, tester notes, placeholder assets)
- [ ] Submit via LG Seller Lounge — see `submission/SUBMISSION_READY.md` (requires your test account + final upload)
