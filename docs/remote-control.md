# LG Magic Remote — Button Reference

This document describes how the **LG webOS Magic Remote** (and browser keyboard fallbacks used during dev) map to actions in Eyedeea Photos.

Implementation lives in:

- [`src/hooks/useWebOSRemote.js`](../src/hooks/useWebOSRemote.js) — shared Back / OK handlers
- [`src/App.jsx`](../src/App.jsx) — global Back routing between screens
- [`src/screens/ViewScreen.jsx`](../src/screens/ViewScreen.jsx) — slideshow + history
- [`src/screens/SettingsScreen.jsx`](../src/screens/SettingsScreen.jsx) — settings actions

---

## Remote keys ↔ browser fallbacks

| Magic Remote | Typical key / keyCode | Used for |
|--------------|----------------------|----------|
| **Back** | `Backspace`, `Escape`, keyCode `461`, `10009` | Navigate back, close panels |
| **OK** (center click) | `Enter`, keyCode `13`, `417` | Confirm selection, toggle history |
| **Left** | `ArrowLeft`, keyCode `37` | Previous photo / switch settings button |
| **Right** | `ArrowRight`, keyCode `39` | Next photo / switch settings button |

When testing in a desktop browser, use the keyboard column above. Set the viewport to **1920×1080** for TV layout.

---

## Screen flow (Back key)

```
Device activation  ──(sign in)──►  Slideshow (View)  ◄──►  Settings
                                        │
                                        └── History panel (overlay)
```

| Current screen | Back button |
|----------------|-------------|
| **Slideshow** — history panel **open** | Closes history panel (stays on slideshow) |
| **Slideshow** — history panel **closed** | Opens **Settings** |
| **Settings** | Returns to **Slideshow** |
| **Device activation** | Not handled by the app (platform / browser default) |

---

## View screen (slideshow)

> **Note:** Recent History is temporarily disabled (`HISTORY_PANEL_ENABLED = false` in `ViewScreen.jsx`). The history icon and OK-to-toggle behavior are hidden until re-enabled.

The main photo viewer. On-screen controls (gear, history menu, prev/next chevrons) appear briefly after mouse movement or when using Left/Right/OK; they also stay visible while the history panel is open.

### Remote mapping

| Button | Action |
|--------|--------|
| **Left** | Previous photo (disabled on the first photo) |
| **Right** | Next photo (disabled on the last photo) |
| **OK** | Toggle **Recent History** side panel open / closed |
| **Back** | Close history if open; otherwise open **Settings** |

### On-screen buttons (mouse / pointer)

| Control | Location | Action |
|---------|----------|--------|
| **Settings** (gear) | Top right | Open Settings |
| **History** (menu icon) | Top right | Toggle Recent History panel |
| **Previous** (◀) | Left edge | Previous photo |
| **Next** (▶) | Right edge | Next photo |

### History panel (when open)

| Button | Action |
|--------|--------|
| **OK** | Close history panel |
| **Back** | Close history panel |
| **Escape** (browser) | Close history panel |
| **Left / Right** | Still change slideshow photo (panel stays open) |

To jump to a specific recent photo, select a thumbnail with the **pointer** (Magic Remote point-and-click). Arrow-key navigation inside the thumbnail grid is not implemented.

### Empty / loading states

| State | Remote |
|-------|--------|
| Loading viewer | No remote actions |
| No photos available | Use on-screen **Settings** button (pointer) |

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

| ← | → | OK | Back |
|---|---|----|------|
| Prev photo | Next photo | History on/off | Settings *(or close History)* |

### Settings

| ← / → | OK | Back |
|-------|----|------|
| Back ↔ Log out | Confirm selection | Slideshow |

---

## Testing tips

- **Browser dev:** `npm run dev` or `npm run dev:prod` — use arrow keys, Enter, and Backspace/Escape.
- **webOS Simulator:** `npm run sim` — uses the staged `dist/` build; no hot reload. Re-run after code changes.
- See [`TESTING.md`](../TESTING.md) for full browser vs simulator workflow.
