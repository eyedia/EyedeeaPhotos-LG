# UX Scenario outline (for PowerPoint template)

App title: **Eyedeea Photos**  
Platform: LG webOS TV  
Version: 1.0.3

---

## 1. Start / device code screen

| # | UI element | Action / result |
|---|------------|-----------------|
| 1 | App launches | Shows Eyedeea Photos device code screen (not web home) |
| 2 | Device code | Large XXX-XXX code for user to enter on web |
| 3 | Activation URL | Displays `eyedeeaphotos.com/activate` |
| 4 | Status pill | Shows “Waiting for activation…” while polling |

Screenshot: capture device code screen from TV or simulator.

---

## 2. Slideshow view (after activation)

| # | UI element | Action / result |
|---|------------|-----------------|
| 1 | Photo area | Full-screen family photo slideshow |
| 2 | Metadata overlay | Album title, date, location at bottom |
| 3 | Previous | Left (chrome hidden) or focus ◀ + OK |
| 4 | Info | Focus info + OK, or pointer |
| 5 | Settings | **Red** remote button (red bar under gear), or focus gear + OK |
| 6 | Next | Right (chrome hidden) or focus ▶ + OK |

Screenshot: capture slideshow with metadata visible.

---

## 3. Settings screen

| # | UI element | Action / result |
|---|------------|-----------------|
| 1 | Name / email | Shows account signed in on this TV |
| 2 | Household | Current household name |
| 3 | Back to slideshow | Returns to view |
| 4 | Log out | Clears session; returns to device code |

Screenshot: capture settings with test account visible.

---

## 4. Logout → fresh state

| # | UI element | Action / result |
|---|------------|-----------------|
| 1 | Device code | New code issued after logout |
| 2 | Activation URL | Same `/activate` instructions |

Screenshot: capture screen after logout.

---

## Notes for LG QA

- Activation happens on **web** at https://www.eyedeeaphotos.com/activate — the TV app only displays the code.
- Subscription is required to activate; test account must have an active plan.
- No in-app purchases or ads.
- Red remote button (or gear + OK): View → Settings; Back returns to View.

Copy this content into the official LG UX Scenario PowerPoint template from Seller Lounge.
