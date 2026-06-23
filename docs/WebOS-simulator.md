# webOS TV Simulator Setup

Guide for running the Eyedeea Photos LG app in the **webOS TV Simulator** after browser testing.

## Overview

Simulator testing uses **external LG tools** (not npm packages). The app is built and staged into `dist/`, then launched with the webOS TV CLI (`ares`).

```text
npm run icons  →  npm run stage:webos  →  npm run sim
     (icons)         (build + metadata)      (ares-launch)
```

**Note:** The simulator has **no hot reload**. Re-run `npm run sim` after code changes.

---

## Prerequisites

### 1. JavaScript dependencies (repo)

```powershell
cd E:\Work\EyedeeaPhotos-LG
npm install
```

### 2. webOS TV CLI + Simulator

Install **webOS TV CLI** — **not** `npm install -g @webosose/ares-cli` (that is for webOS OSE, not LG TV apps).

1. Download [webOS TV CLI](https://webostv.developer.lge.com/develop/tools/webos-tv-cli-installation) for Windows
2. Download **one** simulator version, e.g. [webOS TV 25 Simulator](https://webostv.developer.lge.com/develop/tools/simulator-installation)
3. Unzip both into a single SDK root (example):

```text
D:\LG\webOS_TV_SDK\
  CLI\
  Simulator\
```

### 3. Environment variables

Set once, then open a **new** terminal:

```powershell
setx LG_WEBOS_TV_SDK_HOME "D:\LG\webOS_TV_SDK"
setx WEBOS_CLI_TV "%LG_WEBOS_TV_SDK_HOME%\CLI\bin"
```

Add `%WEBOS_CLI_TV%` to your system **PATH**.

Verify:

```powershell
ares -V
ares-launch -h
```

### 4. Optional `.env.local`

Copy `.env.example` to `.env.local` if needed:

| Variable | Default | Purpose |
|----------|---------|---------|
| `VITE_API_BASE_URL` | `https://www.eyedeeaphotos.com/api/v1` | API endpoint |
| `VITE_ACTIVATE_URL` | `https://www.eyedeeaphotos.com/activate` | Activation page |
| `WEBOS_SIM_VERSION` | `25` | Simulator version for `ares-launch -s <version>` |

---

## Verify setup

```powershell
cd E:\Work\EyedeeaPhotos-LG
npm run verify:env
```

Expected checks:

- Node and npm present
- `ares` CLI on PATH
- `node_modules` present
- `dist/` staged (or will be staged on first `npm run sim`)
- `public/icon.png` exists (run `npm run icons` if missing)

---

## Launch the simulator

### Full workflow (recommended)

```powershell
npm run icons          # creates public/icon.png, largeIcon.png
npm run sim            # stages dist/ + launches simulator
```

`npm run sim` runs [`scripts/launch-simulator.ps1`](../scripts/launch-simulator.ps1), which:

1. Runs `stage:webos` if `dist/appinfo.json` is missing (build + copy `appinfo.json`, icons, `webOSTV.js`)
2. Launches with `ares-launch -s <WEBOS_SIM_VERSION> dist`

### Stage only (no launch)

```powershell
npm run stage:webos
```

### Debug with inspector

```powershell
npm run stage:webos
npm run sim:inspect
```

### Manual launch

In the simulator UI: **File → Launch App** and select the `dist/` folder (must contain `appinfo.json`).

---

## QA on simulator

Repeat the same flow as browser testing (see [`TESTING.md`](../TESTING.md)):

1. Device code appears on TV screen
2. Activate at the configured `VITE_ACTIVATE_URL`
3. Slideshow loads after activation
4. Remote / keyboard: **Arrow Left/Right** (prev/next), **Back** (settings)

Use the simulator remote control UI for D-pad navigation.

---

## Physical TV (optional)

1. Enable Developer Mode on the LG TV
2. Register device: `ares-setup-device`
3. Package and install:

```powershell
npm run package:webos
# Or install directly:
powershell -File scripts/build-ipk.ps1 -DeviceName myTV
```

Output `.ipk` is written to `dist-package/`.

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| `ares-launch not found` | Install webOS TV CLI; add `%WEBOS_CLI_TV%` to PATH; open new terminal |
| `ares -V` fails | Confirm `LG_WEBOS_TV_SDK_HOME` points to SDK root with `CLI\bin\ares.cmd` |
| Simulator version mismatch | Set `WEBOS_SIM_VERSION` in `.env.local` to match installed simulator |
| App missing icons | Run `npm run icons` before `npm run stage:webos` |
| Changes not visible | Re-run `npm run sim` (no hot reload on simulator) |
| API unreachable from simulator | Use a reachable API URL in `.env.local`; for local dev, ensure Cloud API allows the origin |

---

## npm scripts reference

| Script | Purpose |
|--------|---------|
| `npm run verify:env` | Check Node, CLI, staging status |
| `npm run icons` | Generate `public/icon.png`, `largeIcon.png` |
| `npm run stage:webos` | Build + copy webOS metadata into `dist/` |
| `npm run sim` | Stage + launch on simulator |
| `npm run sim:inspect` | Open simulator inspector |
| `npm run package:webos` | Stage + create `.ipk` in `dist-package/` |
