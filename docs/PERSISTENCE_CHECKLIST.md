# Activation persistence verification

Run this checklist on a **physical LG TV** in Developer Mode before LG Content Store submission. The app stores auth in `localStorage` and refreshes tokens automatically on launch and before JWT expiry.

## What persists

| Key | Content |
|-----|---------|
| `lg_device_id` | Stable TV identity (kept even after logout) |
| `auth_token` | Access JWT |
| `refresh_token` | Long-lived refresh token |
| `auth_user`, `auth_group`, `auth_entitlements` | Profile and subscription |

The displayed `XXX-XXX` device code is **temporary** — only shown until web activation completes.

## Checklist

Mark each step **PASS** before submit.

- [ ] **Activate once** — device code → web activation at https://www.eyedeeaphotos.com/activate → slideshow loads
- [ ] **Force-close and relaunch** — press Home, reopen app → goes straight to slideshow (not device code)
- [ ] **Reboot TV** — power cycle → reopen app → still signed in, slideshow loads
- [ ] **Overnight idle** — leave TV off or app closed overnight → next day still signed in
- [ ] **Settings after restart** — Back → Settings shows correct name and email
- [ ] **Logout only** — Log out in Settings → new device code appears (expected)
- [ ] **Re-activate after logout** — activate again → slideshow works

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
