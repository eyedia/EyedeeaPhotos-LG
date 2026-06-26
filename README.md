# Eyedeea Photos — LG webOS TV

View-only Smart TV app for LG webOS. Uses the same device-code authentication and slideshow APIs as the Fire TV app.

## Development

```powershell
cd D:\Work\EyedeeaPhotos-LG
npm install
npm run dev
```

Open the Vite dev URL in a browser. The app talks to production API by default (`https://www.eyedeeaphotos.com/api/v1`).

Override for local API:

```powershell
$env:VITE_API_BASE_URL = "http://localhost:3001/api/v1"
npm run dev
```

## Testing

See **[TESTING.md](TESTING.md)** for browser + simulator workflows, keyboard map, and QA checklist.

Quick start:

```powershell
npm run verify:env   # check Node, webOS TV CLI, staging
npm run dev          # browser at http://localhost:5174
npm run sim          # build dist/ and launch webOS TV Simulator
```

## Package for LG TV

1. Install [webOS TV CLI](https://webostv.developer.lge.com/develop/tools/webos-tv-cli-installation) (zip download — **not** `@webosose/ares-cli`)
2. Install one [webOS TV Simulator](https://webostv.developer.lge.com/develop/tools/simulator-installation) version (default target: webOS TV 25)
3. Configure `LG_WEBOS_TV_SDK_HOME` and add CLI `bin` to PATH — details in [TESTING.md](TESTING.md)
4. Enable Developer Mode on your LG TV and register the device: `ares-setup-device`
5. Build and package:

```powershell
npm run package:webos
# Or install directly:
powershell -File scripts/build-ipk.ps1 -DeviceName myTV
```

Output `.ipk` is written to `dist-package/`.

## Screens

| Screen | When |
|--------|------|
| Device code | Fresh launch or after logout |
| Slideshow view | After successful device activation |
| Settings | Back from view, or Settings button; shows user + logout |

The app never loads the marketing home page, library, or other web routes.

## Store submission

See [`submission/SUBMISSION_GUIDE.md`](submission/SUBMISSION_GUIDE.md).
