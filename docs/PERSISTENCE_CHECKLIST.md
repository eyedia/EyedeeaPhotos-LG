# Activation persistence verification

Run this checklist on a **physical LG TV** in Developer Mode when available. Cloud Test Lab relaunch persistence for v1.0.3 is recorded in [submission/QA_RESULTS.md](../submission/QA_RESULTS.md). The app stores auth in `localStorage` and refreshes tokens automatically on launch and before JWT expiry.

## What persists

| Key | Content |
|-----|---------|
| `lg_device_id` | Stable TV identity (kept even after logout) |
| `auth_token` | Access JWT |
| `refresh_token` | Long-lived refresh token |
| `auth_user`, `auth_group`, `auth_entitlements` | Profile and subscription |

The displayed `XXX-XXX` device code is **temporary** — only shown until web activation completes.

## Checklist

Mark each step **PASS** before submit. Items verified in Cloud Test Lab are noted in `submission/QA_RESULTS.md`.

- [x] **Activate once** — device code → web activation at https://www.eyedeeaphotos.com/activate → slideshow loads *(Cloud Test Lab)*
- [x] **Force-close and relaunch** — reopen app → goes straight to slideshow (not device code) *(Cloud Test Lab)*
- [ ] **Reboot TV** — power cycle → reopen app → still signed in *(physical TV when available)*
- [ ] **Overnight idle** — leave TV off or app closed overnight → next day still signed in *(optional; recommended)*
- [x] **Settings after restart** — Red → Settings shows correct name and email *(Cloud Test Lab)*
- [x] **Logout only** — Log out in Settings → new device code appears (expected) *(Cloud Test Lab)*
- [x] **Re-activate after logout** — activate again → slideshow works *(Cloud Test Lab)*

## Expected re-activation (by design)

Users return to the device-code screen only when:

1. They tap **Log out**
2. Refresh token is rejected (subscription lapsed, account revoked)
3. App data cleared or app uninstalled on the TV

Network outages during startup do **not** log the user out.

## If persistence fails

1. Open inspector: `npm run sim:inspect` (simulator) or `ares-inspect` (TV)
2. Check Application → Local Storage for `auth_token` and `refresh_token`
3. Confirm API `/auth/refresh` succeeds for the stored refresh token
4. Check server-side refresh-token TTL in Eyedeea Photos Cloud
