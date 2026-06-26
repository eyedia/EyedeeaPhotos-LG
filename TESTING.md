# Testing Eyedeea Photos (LG webOS)

Manual QA workflow: iterate quickly in the browser, then validate on the webOS TV Simulator before packaging for a physical TV.

## Prerequisites

### JavaScript dependencies

```powershell
cd D:\Work\EyedeeaPhotos-LG
npm install
```

### LG webOS TV CLI + Simulator (one version only)

Install **webOS TV CLI** — not `npm install -g @webosose/ares-cli` (that is for webOS OSE, not LG TV apps).

1. Download [webOS TV CLI](https://webostv.developer.lge.com/develop/tools/webos-tv-cli-installation) for Windows
2. Download **one** simulator, e.g. [webOS TV 25 Simulator](https://webostv.developer.lge.com/develop/tools/simulator-installation)
3. Unzip into a single SDK root (example):

```
D:\LG\webOS_TV_SDK\
  CLI\
  Simulator\
```

4. Set environment variables (one-time, then open a new terminal):

```powershell
setx LG_WEBOS_TV_SDK_HOME "D:\LG\webOS_TV_SDK"
setx WEBOS_CLI_TV "%LG_WEBOS_TV_SDK_HOME%\CLI\bin"
```

Add `%WEBOS_CLI_TV%` to your system **PATH**, then verify:

```powershell
ares -V
```

### Optional local config

Copy `.env.example` to `.env.local` to override API URLs or simulator version:

```powershell
copy .env.example .env.local
```

| Variable | Default | Purpose |
|----------|---------|---------|
| `VITE_API_BASE_URL` | `https://www.eyedeeaphotos.com/api/v1` | API endpoint |
| `VITE_ACTIVATE_URL` | `https://www.eyedeeaphotos.com/activate` | Activation page link |
| `WEBOS_SIM_VERSION` | `25` | Target for `ares-launch -s <version>` |

### Verify setup

```powershell
npm run verify:env
```

---

## 1. Browser testing (fast iteration)

Best for UI tweaks, API flow, and keyboard navigation.

```powershell
npm run dev
```

Opens `http://localhost:5174` (fixed port).

### Viewport

Set the browser to **1920×1080** (Chrome DevTools → device toolbar) to match TV layout.

### Keyboard map

| Key | Action |
|-----|--------|
| Backspace / Escape | Remote Back |
| Arrow Left / Right | Slideshow prev / next (on view screen) |

### Activation flow

1. Note the device code on screen (format `XXX-XXX`)
2. On phone or PC, open https://www.eyedeeaphotos.com/activate
3. Sign in with a test account that has an active subscription
4. Enter the device code — TV should switch to slideshow within ~10 seconds

### Local API override

```powershell
$env:VITE_API_BASE_URL = "http://localhost:3001/api/v1"
npm run dev
```

Or set `VITE_API_BASE_URL` in `.env.local`.

---

## 2. Simulator testing (TV-like environment)

Stages the built app into `dist/` with `appinfo.json` and launches the webOS TV Simulator.

```powershell
npm run sim
```

This runs `npm run stage:webos` if `dist/` is not staged, then `ares-launch -s <WEBOS_SIM_VERSION> dist`.

**After code changes:** re-run `npm run sim` (no hot reload on simulator).

### Debug with inspector

```powershell
npm run stage:webos
npm run sim:inspect
```

### Manual launch

If you prefer the simulator UI: **File → Launch App** and select the `dist/` folder (must contain `appinfo.json`).

---

## 3. Physical TV (optional)

1. Enable Developer Mode on the LG TV
2. Register the device: `ares-setup-device`
3. Build, sign, package, and optionally install:

```powershell
npm run package:webos:sign
# Or install directly:
powershell -File scripts/build-ipk.ps1 -Sign -DeviceName myTV
```

Output `.ipk` is written to `dist-package/`.

See [docs/LG_PREREQUISITES.md](docs/LG_PREREQUISITES.md) for certificate and Seller Lounge setup.

---

## Activation persistence

After activation, auth is stored in `localStorage` and survives app restarts. Run the checklist in [docs/PERSISTENCE_CHECKLIST.md](docs/PERSISTENCE_CHECKLIST.md) on a physical TV before submit.

---

## Full QA script

See [`submission/QA_CHECKLIST.md`](submission/QA_CHECKLIST.md) and [`submission/TESTER_NOTES.txt`](submission/TESTER_NOTES.txt) for the end-to-end activation, slideshow, settings, and logout checklist used for LG submission.

## npm scripts reference

| Script | Purpose |
|--------|---------|
| `npm run dev` | Vite dev server (browser) |
| `npm run verify:env` | Check Node, CLI, staging status |
| `npm run stage:webos` | Build + copy webOS metadata into `dist/` |
| `npm run sim` | Stage + launch on simulator |
| `npm run sim:inspect` | Open simulator inspector |
| `npm run package:webos` | Stage + create unsigned `.ipk` in `dist-package/` |
| `npm run package:webos:sign` | Stage + package + sign IPK for Content Store |
