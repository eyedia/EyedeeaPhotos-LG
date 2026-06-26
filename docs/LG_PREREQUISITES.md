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
setx LG_WEBOS_TV_SDK_HOME "D:\LG\webOS_TV_SDK"
setx WEBOS_CLI_TV "%LG_WEBOS_TV_SDK_HOME%\CLI\bin"
```

Add `%WEBOS_CLI_TV%` to your system **PATH**, then verify:

```powershell
ares -V
ares-package -V
ares-sign -V
```

Run `npm run verify:env` from the project root.

## 3. Developer certificate (for store upload)

LG Content Store requires a **signed** IPK.

1. In Seller Lounge → **Development** → create or download your **developer certificate** (`.pem`)
2. Store it locally (never commit). Recommended location:

```
EyedeeaPhotos-LG/certs/developer.pem   (gitignored)
```

3. Point the build at your certificate using one of:

```powershell
# Option A — environment variable
setx LG_WEBOS_TV_CERT "D:\certs\lg-developer.pem"

# Option B — script parameter
powershell -File scripts/build-ipk.ps1 -Sign -CertPath D:\certs\lg-developer.pem
```

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
| Unsigned IPK | `npm run package:webos` |
| Signed IPK | `npm run package:webos:sign` or `build-ipk.ps1 -Sign` |
| Persistence QA | `docs/PERSISTENCE_CHECKLIST.md` |
| Full submit guide | `submission/SUBMISSION_GUIDE.md` |
