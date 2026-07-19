# LG Magic Remote — Button Reference

This document describes how the **LG webOS Magic Remote** (and browser keyboard fallbacks used during dev) map to actions in Eyedeea Photos.

Implementation lives in:

- [`src/hooks/useWebOSRemote.js`](../src/hooks/useWebOSRemote.js) — shared Back / OK / Red helpers
- [`src/App.jsx`](../src/App.jsx) — global Back routing between screens
- [`src/screens/ViewScreen.jsx`](../src/screens/ViewScreen.jsx) — slideshow + remote focus
- [`src/screens/SettingsScreen.jsx`](../src/screens/SettingsScreen.jsx) — settings actions

---

## Remote keys ↔ browser fallbacks

| Magic Remote | Typical key / keyCode | Used for |
|--------------|----------------------|----------|
| **Back** | `Backspace`, `Escape`, keyCode `461`, `10009` | Close panels; leave Settings → slideshow |
| **OK** (center click) | `Enter`, keyCode `13`, `417` | Activate the focused on-screen control |
| **Left / Right** | `ArrowLeft`/`ArrowRight`, `37`/`39` | Prev/next photo (chrome hidden) or move focus (chrome focused) |
| **Up / Down** | `ArrowUp`/`ArrowDown`, `38`/`40` | Show on-screen controls and move focus between them |
| **Red** | keyCode `403`, `ColorF0Red` (browser: `R`) | Open **Settings** |

When testing in a desktop browser, use the keyboard column above. Set the viewport to **1920×1080** for TV layout.

> **Note:** The Magic Remote system Settings (gear) key is owned by the OS and is not delivered to apps. In-app Settings is opened with the **Red** color button (hint shown under the gear icon) or by focusing the gear and pressing **OK**.

---

## Screen flow (Back key)

```
Device activation  ──(sign in)──►  Slideshow (View)  ◄──►  Settings
                                        │                      ▲
                                        │                      │
                                        └── Info / History     Red / gear+OK
                                            panel (overlay)
```

| Current screen | Back button |
|----------------|-------------|
| **Slideshow** — info or history panel **open** | Closes panel (stays on slideshow) |
| **Slideshow** — panels **closed** | Not handled by the app (platform / exit behavior) |
| **Settings** | Returns to **Slideshow** |
| **Device activation** | Not handled by the app (platform / browser default) |

---

## View screen (slideshow)

> **Note:** Recent History is temporarily disabled (`HISTORY_PANEL_ENABLED = false` in `ViewScreen.jsx`). The history icon is hidden until re-enabled.

The main photo viewer. Photo advance is **server-driven** (`refresh_client`). On-screen controls (gear, info, prev/next chevrons) appear after mouse movement or **Up / Down** on the remote; they stay visible while a panel is open.

### Remote mapping

| Button | Action |
|--------|--------|
| **Red** | Open **Settings** (anytime) |
| **Up / Down** | Show controls and place / move **focus** on icons |
| **Left / Right** | If a control is focused: move focus. Otherwise: previous / next photo |
| **OK** | If a control is focused: activate it. Otherwise: toggle **photo info** |
| **Back** | Close info/history panel if open; otherwise leave to platform |

### Focusable controls (D-pad)

| Control | Location | OK action |
|---------|----------|-----------|
| **Info** | Top right | Toggle photo info panel |
| **Settings** (gear + red bar) | Top right | Open Settings |
| **Previous** (◀) | Left edge | Previous photo |
| **Next** (▶) | Right edge | Next photo |
| **History** | Top right | Toggle history *(when enabled)* |

Focused control gets a blue outline. The settings button always shows a small **red rectangle** under the gear to indicate the Red remote shortcut.

### On-screen buttons (mouse / pointer)

| Control | Location | Action |
|---------|----------|--------|
| **Info** | Top right | Toggle photo info panel |
| **Settings** (gear) | Top right | Open Settings |
| **History** (menu icon) | Top right | Toggle Recent History panel *(when enabled)* |
| **Previous** (◀) | Left edge | Previous photo in local queue |
| **Next** (▶) | Right edge | Next photo in local queue |

### History panel (when open / enabled)

| Button | Action |
|--------|--------|
| **Back** | Close history panel |
| **Escape** (browser) | Close history panel |
| **Left / Right** | Close history panel |

To jump to a specific recent photo, select a thumbnail with the **pointer** (Magic Remote point-and-click). Arrow-key navigation inside the thumbnail grid is not implemented.

### Empty / loading states

| State | Remote |
|-------|--------|
| Loading viewer | No remote actions |
| No photos available | **Red** opens Settings; or use on-screen **Settings** (pointer) |

---

## Settings screen

Shows signed-in **Name** and **Email**. Two actions at the bottom: **Back** and **Log out**.

**Back** is selected by default (highlighted in blue).

### Remote mapping

| Button | Action |
|--------|--------|
| **Left / Right** | Switch selection between **Back** and **Log out** |
| **OK** | Activate the highlighted button |
| **Back** | Return to slideshow (same as selecting **Back** + OK) |

### Selected button → OK result

| Selected | OK action |
|----------|-----------|
| **Back** | Return to slideshow |
| **Log out** | Sign out and return to device activation |

### On-screen buttons (mouse / pointer)

Clicking **Back** or **Log out** performs the same action as OK when that button is selected. Hovering a button updates the selection highlight.

---

## Related screens (brief)

### Device activation

| Button | Action |
|--------|--------|
| **OK** | **Refresh** only when activation codes are exhausted or an error is shown |
| Other keys | No app-specific mapping during normal code display |

Activation itself happens on the web at the URL shown on screen (`eyedeeaphotos.com/activate` or your dev URL).

### Server unavailable

When the API cannot be reached during activation, a **Reload** icon button is shown. Use the **pointer** to click it. There is no dedicated OK handler on that screen.

---

## Quick reference card

### Slideshow

| ← / → | ↑ / ↓ | OK | Red | Back |
|-------|-------|----|-----|------|
| Photo prev/next *or* move focus | Show controls + move focus | Focused icon, else info | Settings | Close panel |

### Settings

| ← / → | OK | Back |
|-------|----|------|
| Back ↔ Log out | Confirm selection | Slideshow |

---

## Testing tips

- **Browser dev:** `npm run dev` or `npm run dev:prod` — arrow keys for D-pad, Enter for OK, `R` for Red, Backspace/Escape for Back.
- **webOS Simulator:** `npm run sim` — uses the staged `dist/` build; no hot reload. Re-run after code changes.
- See [`TESTING.md`](../TESTING.md) for full browser vs simulator workflow.
