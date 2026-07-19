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

### Dev vs prod variants

Same pattern as FireTV: two environment profiles controlled by Vite `--mode`.

| Command | Env file | API / activate |
|---------|----------|----------------|
| `npm run dev` | `.env.development` | Local LAN (e.g. `192.168.x.x:5174`) |
| `npm run dev:prod` | `.env.production` | `eyedeeaphotos.com` |
| `npm run build` | `.env.production` | Production (submission IPK) |
| `npm run build:dev` | `.env.development` | Local (dev IPK for simulator/TV) |

```powershell
# Local backend + activate page on your LAN
npm run dev

# Production API + activate — use for weather, slideshow, real account testing
npm run dev:prod
```

Edit [`.env.development`](.env.development) for local URLs. Production URLs live in [`.env.production`](.env.production).

### Weather panels

Weather is fetched from the **API** (`/weather/current`), not the activate page. On localhost/local IP:

- Browser geolocation may be blocked or unreliable
- A **local dev API** may not resolve location from your IP
- **webOS TV** skips browser geolocation entirely — the server must infer location from the request IP

**To test weather:** run `npm run dev:prod` (or `npm run build` + simulator). Sign in with a production account; weather should appear bottom-right on the slideshow when the API returns valid data.

```powershell
npm run dev:prod
```

Opens `http://localhost:5175` (fixed port) with production endpoints.

```powershell
npm run dev
```

Opens `http://localhost:5175` (fixed port) with local dev endpoints.

### Viewport

Set the browser to **1920×1080** (Chrome DevTools → device toolbar) to match TV layout.

### Keyboard map

| Key | Action |
|-----|--------|
| Backspace / Escape | Remote Back (close panel / leave Settings) |
| Arrow Left / Right | Prev / next photo, or move focus when controls are focused |
| Arrow Up / Down | Show controls and move focus |
| Enter | Activate focused control |
| R | Red button → Settings |

### Activation flow

1. Note the device code on screen (format `XXX-XXX`)
2. On phone or PC, open the URL shown on screen:
   - `npm run dev` → `http://192.168.86.100:5174/activate` (Cloud web on your desktop LAN)
   - `npm run dev:prod` / production → `https://www.eyedeeaphotos.com/activate`
3. Sign in with a test account that has an active subscription
4. Enter the device code — TV should switch to slideshow within ~10 seconds

**Important:** Do not put `VITE_API_BASE_URL` / `VITE_ACTIVATE_URL` in `.env.local`. That file loads in every Vite mode and overrides `.env.development`. Use `.env.development.local` for LAN overrides instead.

### Local API override

```powershell
$env:VITE_API_BASE_URL = "http://192.168.86.100:5174/api/v1"
npm run dev
```

Or set `VITE_API_BASE_URL` in `.env.development.local` (not `.env.local`).

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

## 3. Seller Lounge webOS Cloud Test Lab

The in-browser “TV + remote” UI is **webOS Cloud Test Lab** (Applications → webOS Cloud Test Lab), not the local simulator.

```powershell
npm run package:webos
```

Upload `dist-package/com.eyediatech.eyedeeaphotos_1.0.3_all.ipk` under **Applications → File Upload** (unsigned is correct — LG signs during store review).

1. Fill English **App Title** and **App Description** (required before Cloud Lab).
2. Reserve a device → at the slot time click **Start**.
3. Finish or skip the TV’s initial setup — the app icon should appear on the **far right of Home**.
4. Prefer the left-menu **Launch App** button over clicking the Home icon (Home often does nothing if install is incomplete).
5. If launch fails: **Re-install** → wait for success → **Launch App** again.
6. If you re-uploaded a new IPK mid-session: **File Change** on the lab session → **Re-install** → **Launch App**.

Cloud Lab egress is Korea (`1.222.94.84`). Allowlist it if your API is geo-restricted; the device-code screen should still open without that.

## 4. Physical TV (optional)

1. Enable Developer Mode on the LG TV
2. Register the device: `ares-setup-device`
3. Build, package, and optionally install:

```powershell
npm run package:webos
# Or install directly:
powershell -File scripts/build-ipk.ps1 -DeviceName myTV
```

Output `.ipk` is written to `dist-package/`. Optional legacy signing: `npm run package:webos:sign` (only if you still have `.pem`/`.crt` — not required for store upload).

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
| `npm run package:webos` | Stage + create `.ipk` in `dist-package/` (use for store + Cloud Test Lab) |
| `npm run package:webos:sign` | Same + optional legacy `.pem` signing (not required for Seller Lounge) |
