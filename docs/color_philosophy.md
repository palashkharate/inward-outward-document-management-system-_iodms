# IODMS — Design Philosophy (v3)
## Premium Government Portal — Apple × Google Workspace

---

### 🎯 Vision Statement

> Every pixel should feel intentional. If Google Workspace and Apple's system apps had a government-sector child, it would look like IODMS.

---

### Design Principles

| # | Principle | What it means |
|---|-----------|---------------|
| 1 | **Whitespace = Premium** | Generous padding (24px+ on cards), breathing room between elements. Never crowd. |
| 2 | **Depth Through Layering** | Cards float with soft shadows. Active elements lift on hover. Dialogs blur the backdrop. |
| 3 | **Color Sparingly** | 90% monochrome (white/gray). Color = action or status indicator. Never decorative. |
| 4 | **Motion = Meaning** | 200ms ease-out transitions on all interactive elements. Every state change has a smooth transition. |
| 5 | **Typography Hierarchy** | Clear visual weight: Page title → Section label → Body → Caption. Weight descends 800 → 600 → 400 → 300. |
| 6 | **Consistent Radius** | Small (chips, badges) = `4px`. Medium (buttons, inputs) = `8px`. Large (cards, dialogs) = `12px`. XL (login card) = `20px`. |
| 7 | **Accessible Contrast** | All text passes WCAG AA (4.5:1 minimum). Error red on white = 4.8:1 ✅. Secondary gray on white = 4.6:1 ✅. |

---

### Core Palette

| Role | Name | Hex | Usage |
|------|------|-----|-------|
| Primary | Google Blue | `#1A73E8` | Primary buttons, active nav, links, key actions |
| Primary Dark | Deep Blue | `#1557B0` | Hover states on primary buttons |
| Primary Light | Pale Blue | `#E8F0FE` | Active nav bg, table header bg, info chip bg |
| Secondary | Teal Accent | `#00897B` | Secondary actions, success indicators, dispatch |
| Background | Clean White | `#FFFFFF` | Page backgrounds |
| Surface | Soft Gray | `#F8F9FA` | Cards, panels, elevated surfaces, page bg |
| Surface Alt | Zebra Gray | `#FAFBFC` | Even table row backgrounds |
| Text Primary | Google Dark | `#202124` | Body text, headings |
| Text Secondary | Google Gray | `#5F6368` | Secondary text, labels, placeholders |
| Border | Light Border | `#E8EAED` | All borders, dividers, input outlines |
| Error | Google Red | `#D93025` | Error states, destructive actions |
| Error Light | Pale Red | `#FCE8E6` | Error chip backgrounds |
| Success | Google Green | `#188038` | Confirmed, completed, dispatched |
| Success Light | Pale Green | `#E6F4EA` | Success chip backgrounds |
| Warning | Google Yellow | `#F9AB00` | Pending, attention needed |
| Warning Light | Pale Yellow | `#FEF7E0` | Warning chip backgrounds |
| Info | Google Blue | `#1A73E8` | Informational badges |

> **IMPORTANT: Border color is `#E8EAED` everywhere.** The codebase previously had a mix of `#D1D5DB`, `#DADCE0`, and `#E8EAED`. Standardize to `#E8EAED` only.

---

### Module Color Identifiers (Accent Bars)

Each module page has a distinctive accent color used for the top border of its header card:

| Module | Accent Color | Hex |
|--------|-------------|-----|
| Dashboard | Google Blue | `#1A73E8` |
| Compose Outward | Deep Blue | `#1557B0` |
| Drafts & Dispatch | Teal | `#00897B` |
| Log Inward | Sky Blue | `#039BE5` |
| Inward Register | Indigo | `#3F51B5` |
| Outward Register | Purple | `#7B1FA2` |
| Address Book | Blue Gray | `#546E7A` |
| Admin Panel | Orange | `#E65100` |
| Auditor View | Red | `#D93025` |
| My Profile | Teal | `#00897B` |

---

### Shadows (Apple-Style Layered)

| Token | Value | Usage |
|-------|-------|-------|
| shadow-sm | `0 1px 2px rgba(0,0,0,0.04)` | Default card resting state |
| shadow-md | `0 2px 8px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)` | Elevated cards, dropdowns |
| shadow-lg | `0 8px 24px rgba(0,0,0,0.08), 0 2px 8px rgba(0,0,0,0.04)` | Modals, popovers |
| shadow-xl | `0 16px 48px rgba(0,0,0,0.12), 0 4px 16px rgba(0,0,0,0.06)` | Dialogs, login card |
| shadow-hover | `0 4px 16px rgba(26,115,232,0.15)` | Button hover, card hover |

---

### Transitions

| Context | Duration | Easing | Example |
|---------|----------|--------|---------|
| Hover states | `150ms` | `ease` | Button color, card shadow lift |
| State changes | `200ms` | `cubic-bezier(0.4, 0, 0.2, 1)` | Input focus glow, chip appear |
| Layout shifts | `300ms` | `cubic-bezier(0.4, 0, 0.2, 1)` | Row expand/collapse, page fade |
| Button press | `100ms` | `ease-out` | `transform: scale(0.98)` on `:active` |

---

### Component Rules

#### Sidebar
- Background: `#FFFFFF`, border-right: `1px solid #E8EAED`
- Nav items: `#5F6368` text, `500` weight, `0.95rem`
- Active item: `#E8F0FE` bg + `#1A73E8` text + `700` weight + 3px left accent border
- Hover: `rgba(0,0,0,0.04)` bg with smooth transition
- Logout: `#D93025` text, hover bg `rgba(229,57,53,0.06)`

#### AppBar
- Background: `#FFFFFF`, border-bottom: `1px solid #E8EAED`, boxShadow: none
- Page title in `subtitle1` weight `600`
- User section: avatar (initials, blue bg) + name + dropdown arrow

#### Buttons
- Primary: `#1A73E8` fill, white text, borderRadius: 8px, shadow, hover lift
- Secondary/Outlined: `#1A73E8` border (1.5px), transparent bg, hover `rgba(26,115,232,0.04)`
- Destructive: `#D93025` fill, white text
- All buttons: fontWeight: 600, textTransform: none, padding: 8px 20px
- Hover: translateY(-1px) + shadow increase
- Active: scale(0.98) press effect

#### Cards
- Background: `#FFFFFF`, borderRadius: 12px, border: 1px solid `#E8EAED`
- Resting shadow: shadow-sm
- Hover: shadow-md (only on interactive cards like dashboard quick-actions)
- Module header cards: top border 4px solid {module_accent_color}

#### Tables
- Header: `#E8F0FE` bg, `#1A73E8` text, 600 weight, 0.8rem, uppercase
- Even rows: `#FAFBFC` (zebra striping)
- Hover: `#F1F3F4` with 150ms transition
- Sticky headers on scroll
- Pending deletion rows: `#FEF2F2` bg + 3px solid `#D93025` left border

#### Inputs (TextFields)
- Border: 1px solid `#E8EAED`, borderRadius: 8px
- Focus: border `#1A73E8` + box-shadow: 0 0 0 3px rgba(26,115,232,0.12) (blue glow ring)
- Labels: animated float-up on focus (MUI default)

#### Chips
- Success: bg `#E6F4EA`, text `#188038`
- Error: bg `#FCE8E6`, text `#D93025`
- Warning: bg `#FEF7E0`, text `#E37400`
- Info: bg `#E8F0FE`, text `#1A73E8`
- All: borderRadius: 6px, fontWeight: 500

#### Dialogs
- Paper: borderRadius: 16px, shadow-xl
- Backdrop: blur(4px) + rgba(0,0,0,0.3)

#### Alerts
- borderRadius: 8px
- Slide-in from top on appear

#### Login Page
- Full-bleed Su-30MKI background with dark gradient overlay
- Glassmorphic card: rgba(255,255,255,0.92), backdrop-filter: blur(20px), borderRadius: 20px
- HAL Logo with subtle glow: filter: drop-shadow(0 0 20px rgba(26,115,232,0.3))
- Sign In button: gradient linear-gradient(135deg, #1A73E8, #1557B0)
- Footer: semi-transparent on dark overlay

#### Auditor View
- Page background: `#FFF8F8` (faint red)
- Watermark: `#D93025` at 10% opacity, rotated -35deg
- user-select: none + right-click disabled

---

### Typography Scale

| Element | Variant | Weight | Size | Color |
|---------|---------|--------|------|-------|
| Page Title | h5 | 700 | 1.5rem | `#202124` |
| Section Heading | subtitle1 | 600 | 1.1rem | `#202124` |
| Card Title | h6 | 700 | 1.25rem | `#202124` |
| Body Text | body1 | 400 | 1rem | `#202124` |
| Secondary Text | body2 | 400 | 0.875rem | `#5F6368` |
| Table Header | custom | 600 | 0.8rem | `#1A73E8` (uppercase) |
| Caption/Label | caption | 400 | 0.75rem | `#5F6368` |
| Stat Number | h3 | 800 | 2.5rem | `#202124` |

### Font Stack
```
'Outfit', 'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif
```
Outfit is the primary font. For air-gapped deployment, the font files must be served locally from `frontend/public/fonts/`.

---

### Icon Guidelines
- Use MUI Icons (Material Symbols Outlined variant)
- Active nav icons: filled variant (switch from outlined to filled)
- Size: 20px in nav, 24px in content, 40px+ in stat cards
- Color matches text color of parent element
