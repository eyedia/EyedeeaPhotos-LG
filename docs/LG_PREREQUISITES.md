# LG Content Store — one-time setup

Complete these steps before building a signed IPK for submission.

## 1. LG Seller Lounge account

1. Register at [LG Seller Lounge](https://seller.lgappstv.com)
2. Complete developer profile and app registration for **Eyedeea Photos**
3. Note your app ID: `com.eyediatech.eyedeeaphotos`

## 2. webOS TV CLI

Install the **webOS TV CLI** (not `@webosose/ares-cli` — that is for webOS OSE).

1. Download [webOS TV CLI](https://webostv.developer.lge.com/develop/tools/webos-tv-cli-installation)
2. Download [webOS TV Simulator](https://webostv.developer.lge.com/develop/tools/simulator-installation) (optional, for pre-TV testing)
3. Unzip into one SDK root, for example:

```
D:\LG\webOS_TV_SDK\
  CLI\
  Simulator\
  APIs\
    webOSTV.js\
      webOSTV.js
```

4. Set environment variables (new terminal after `setx`):

```powershell
setx LG_WEBOS_TV_SDK_HOME "E:\Tools\webOS_TV_SDK"
```

Add the **literal path** to your user PATH (do not use `%WEBOS_CLI_TV%` — PowerShell does not expand `%VAR%` in PATH; CMD does):

```
E:\Tools\webOS_TV_SDK\CLI\bin
```

For **Cursor / VS Code terminals**, also add to the project `.env.local` (scripts read this automatically):

```
LG_WEBOS_TV_SDK_HOME=E:\Tools\webOS_TV_SDK
```

Restart Cursor after changing system PATH so integrated terminals pick up the update.

Verify:

```powershell
ares -V
ares-package -V
npm run verify:env
```

### Troubleshooting: `ares` works in CMD but not PowerShell

| Cause | Fix |
|-------|-----|
| PATH contains `%WEBOS_CLI_TV%` literally | Replace with `E:\Tools\webOS_TV_SDK\CLI\bin` in System/User PATH |
| Cursor opened before PATH change | Restart Cursor |
| PowerShell session stale | Run `npm run verify:env` (project scripts prepend CLI\bin via `.env.local`) |

## 3. Certificates and keys (two different things)

LG documentation often conflates these. **Seller Lounge does not offer a developer `.pem` download anymore** — that flow was replaced by webOS Studio’s Certificate Manager, which is only for **connecting your PC to a physical TV**.

### A. Device SSH key (test on your TV — not for store upload)

Used so `ares-install` / `ares-launch` can talk to your TV in Developer Mode.

**Without webOS Studio (CLI only):**

1. On the TV: install **Developer Mode** app → sign in with your LG account → turn on **Dev Mode** and **Key Server**
2. On PC:
   ```powershell
   ares-setup-device
   # add device: name=myTV, IP=<TV IP>, port=9922, user=prisoner, password blank
   ares-novacom --device myTV --getkey
   ```
3. Enter the **6-character passphrase** shown on the TV screen

**With webOS Studio (VS Code extension):** Command Palette → **webOS TV: Set Up SSH Key** — same passphrase from the TV. This is what “Certificate Manager” in webOS Studio refers to.

The key is stored in your CLI/webOS Studio profile — you do **not** copy a `.pem` into this repo.

### B. Content Store IPK (what you upload to Seller Lounge)

**You do not need a Seller Lounge developer certificate.** Package with:

```powershell
npm run package:webos
```

Upload the `.ipk` from `dist-package/` to [Seller Lounge](https://seller.lgappstv.com). LG handles signing/QA on their side during review.

Optional `-Sign` in `build-ipk.ps1` only applies if you have legacy `.pem`/`.crt` files from an old SDK workflow — not required for normal submission.

## 4. Physical LG TV (Developer Mode)

1. On the TV: install **Developer Mode** app from LG Content Store
2. Enable Developer Mode and note the TV IP address
3. Register the device:

```powershell
ares-setup-device
# Follow prompts: name = myTV, IP = your TV address, port = 9922, user = prisoner
```

4. Test install:

```powershell
powershell -File scripts/build-ipk.ps1 -DeviceName myTV
```

## 5. QA test account

Prepare a dedicated Eyedeea Photos account for LG QA:

- Active subscription
- Several photos in the library
- Credentials entered in Seller Lounge Test Info (see `submission/TESTER_NOTES.txt`)

## 6. Privacy policy URL

Seller Lounge Service Info requires a privacy policy URL. Use your production Eyedeea Photos privacy page (e.g. `https://www.eyedeeaphotos.com/privacy`).

## Quick reference

| Item | Location / command |
|------|-------------------|
| Verify tooling | `npm run verify:env` |
| Branded icons | `npm run icons` |
| Submission images | `npm run submission-assets` |
| Unsigned IPK (store submit) | `npm run package:webos` |
| Device SSH key | `ares-novacom --device myTV --getkey` (see section 3) |
| Persistence QA | `docs/PERSISTENCE_CHECKLIST.md` |
| Full submit guide | `submission/SUBMISSION_GUIDE.md` |
