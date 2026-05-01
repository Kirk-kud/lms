---
name: Love Inc LMS
description: Discipleship learning management system for university campus church communities
colors:
  fellowship-burgundy: "#8B1A2F"
  ink-black: "#111111"
  deep-charcoal: "#333333"
  field-gray: "#6B7280"
  margin-gray: "#9CA3AF"
  rule-line: "#E5E5E5"
  archive-gray: "#F8F8F8"
  lifted-surface: "#FAFAFA"
  page-white: "#FFFFFF"
  wine-blush: "#F5E6EA"
  destructive: "#991B1B"
typography:
  display:
    fontFamily: "Inter, system-ui, -apple-system, sans-serif"
    fontSize: "28px"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "normal"
  headline:
    fontFamily: "Inter, system-ui, -apple-system, sans-serif"
    fontSize: "22px"
    fontWeight: 600
    lineHeight: 1.25
  title:
    fontFamily: "Inter, system-ui, -apple-system, sans-serif"
    fontSize: "18px"
    fontWeight: 500
    lineHeight: 1.3
  body:
    fontFamily: "Inter, system-ui, -apple-system, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.6
  label:
    fontFamily: "Inter, system-ui, -apple-system, sans-serif"
    fontSize: "12px"
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: "0.05em"
  caption:
    fontFamily: "Inter, system-ui, -apple-system, sans-serif"
    fontSize: "11px"
    fontWeight: 400
    lineHeight: 1.4
rounded:
  sm: "4px"
  md: "8px"
  lg: "12px"
  full: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
components:
  button-primary:
    backgroundColor: "{colors.ink-black}"
    textColor: "{colors.page-white}"
    rounded: "{rounded.md}"
    padding: "0 16px"
    height: "36px"
  button-primary-hover:
    backgroundColor: "{colors.fellowship-burgundy}"
    textColor: "{colors.page-white}"
    rounded: "{rounded.md}"
    padding: "0 16px"
    height: "36px"
  input-default:
    backgroundColor: "{colors.page-white}"
    textColor: "{colors.ink-black}"
    rounded: "{rounded.md}"
    padding: "0 10px"
    height: "36px"
  nav-item-active:
    backgroundColor: "{colors.page-white}"
    textColor: "{colors.ink-black}"
  nav-item-default:
    backgroundColor: "transparent"
    textColor: "{colors.field-gray}"
  stat-card:
    backgroundColor: "{colors.archive-gray}"
    textColor: "{colors.fellowship-burgundy}"
    rounded: "{rounded.md}"
    padding: "16px"
  badge-wine:
    backgroundColor: "{colors.wine-blush}"
    textColor: "#6B1222"
    rounded: "{rounded.full}"
    padding: "2px 10px"
---

# Design System: Love Inc LMS

## 1. Overview

**Creative North Star: "The Bold Register"**

Love Inc LMS is built like a register — a living, named record of a discipleship community. Every element earns its place by doing a job. The system is confident without being loud, warm without being soft. The brand's bold condensed wordmark sets the tone: this isn't a generic tool. It belongs to real people at real universities who are serious about what they're doing together.

The palette is built on restraint. A single accent — Fellowship Burgundy — carries the entire brand weight. It appears on the wordmark, on active navigation, on the confirmation of an action. Everywhere else, near-black and gray do the structural work. The result is a system where the burgundy always means something.

The interface rejects the aesthetics of both the corporate LMS (institutional gray, cluttered module accordions, progress-bar obsession) and the faith-tech startup (soft gradients, anonymous stock photography, glassmorphism). Love Inc is a specific community at specific universities. The design is specific to them — not a template that could belong to anyone.

**Key Characteristics:**
- Single accent system: Fellowship Burgundy on ink-black and page-white infrastructure
- Flat by default — tonal contrast, no shadows
- Typography-first hierarchy: weight and size, never color for emphasis
- Structural confidence from the Helvetica Neue foundation
- Community photos as content, not decoration or background fill

## 2. Colors: The Restrained Communion

The palette is achromatic infrastructure with one living accent. Fellowship Burgundy is the community's color. It appears where it matters and nowhere else.

### Primary
- **Fellowship Burgundy** (#8B1A2F, oklch(35% 0.137 17)): The brand accent. Active navigation states, the "Inc" in the wordmark, input focus borders, the user avatar background, and text links. Never used decoratively. Every use signals identity or interaction.

### Neutral
- **Ink Black** (#111111): Topbar background, primary headings, active navigation text, primary button background. The heaviest structural color.
- **Deep Charcoal** (#333333): Role chip background in the topbar. The midpoint between Ink Black and Field Gray.
- **Field Gray** (#6B7280): Inactive navigation labels and icons. The resting state for secondary interactive elements.
- **Margin Gray** (#9CA3AF): Captions, timestamps, section header labels, all secondary metadata. The lightest readable text on white.
- **Rule Line** (#E5E5E5): All borders, applied at 0.5px to 1px. The thinnest structural element in the system.
- **Archive Gray** (#F8F8F8): Sidebar background, stat card backgrounds. One step above Page White to create tonal depth without elevation.
- **Lifted Surface** (#FAFAFA): Subtle raised surfaces within white contexts — used for list items at rest.
- **Page White** (#FFFFFF): Main content area, login card, mobile bottom nav, all primary surfaces.
- **Wine Blush** (#F5E6EA): Background for the wine variant badge only. The burgundy's lightest register.

### Named Rules

**The One Accent Rule.** Fellowship Burgundy appears in at most three roles on any given screen: wordmark, active navigation, and one interactive confirmation (focus border, avatar, or link). Its rarity is the point. If it appears more than three times, rethink the layout.

**The Tonal Depth Rule.** There are no shadows. Depth is conveyed entirely through tonal contrast: Ink Black topbar, Archive Gray sidebar, Page White content. Never introduce a `box-shadow` to solve a layering problem — solve it with background color.

## 3. Typography

**Display / Body Font:** Inter (with system-ui, -apple-system, sans-serif as fallback)

**Character:** Inter is a modern geometric sans-serif designed for screen legibility. Its generous x-height, open letterforms, and optical sizing make it ideal for discipleship content — clear at small sizes (labels, captions), confident at large sizes (headlines), and warm across body text. The system uses a single typeface across all roles, differentiated by weight (400 / 500 / 600) and size only. No italic variants, no decorative weights, no secondary face.

**Implementation:** Inter is configured in `layout.tsx` via Google Fonts and integrated as a CSS variable (`--font-inter`) in `globals.css`. The 9-level typography scale with responsive mobile overrides ensures legibility across devices.

### Hierarchy
- **Display** (600, 28px desktop / 24px mobile, line-height 1.2): Page-level greetings and primary headings. One per screen.
- **Headline** (600, 22px desktop / 20px mobile, line-height 1.25): Topbar wordmark, modal headings. Signals a surface boundary.
- **Title** (500, 18px desktop / 16px mobile, line-height 1.3): Section headers within content, card titles. Weight distinguishes from body at the same size.
- **Body** (400, 14px desktop / 13px mobile, line-height 1.6): All body copy, list items, form field content. Max 65ch per line. Opens breathing room for readability.
- **Body-SM** (400, 13px desktop / 12px mobile, line-height 1.5): Form field text, smaller content areas. Maintains legibility with reduced line-height.
- **Label** (500, 12px desktop / 11px mobile, line-height 1.4, letter-spacing 0.05em, uppercase): Sidebar section headers ("TEACH", "MY CLASS"), stat card labels. Always uppercase, always tracked. Never used for body or headings.
- **Caption** (400, 11px, line-height 1.4): Timestamps, due dates, secondary metadata. Always Margin Gray.
- **Tiny** (500, 10px, line-height 1.4, letter-spacing 0.05em, uppercase): Smallest labels, badges, minimal metadata. Used sparingly.

### Named Rules

**The Weight Rule.** Hierarchy is size and weight, never color. A heading does not become Fellowship Burgundy for emphasis — it becomes 500 weight and a larger size. Color emphasis belongs exclusively to interactive and brand states.

**The Single Family Rule.** One typeface. No serifs, no display-only variants, no pairing experiments. Helvetica Neue at two weights is sufficient.

## 4. Elevation

This system is flat by default. No element casts a shadow at rest, on hover, or in focus. The appearance of depth comes entirely from structural tonal layering: the Ink Black topbar anchors the top, the Archive Gray sidebar defines the left rail, and the Page White content area is the primary working surface.

Borders serve the structural role that shadows play in other systems — they delineate without lifting. The 0.5px Rule Line border (`#E5E5E5`) appears on sidebar right edges, input fields, login cards, section containers, and mobile nav top edges. It is the system's only dividing mechanism.

### Named Rules

**The Flat-By-Default Rule.** No `box-shadow` at rest, hover, active, or focus. If a component needs to feel elevated or interactive, change its border color (Rule Line to Fellowship Burgundy for focus, Rule Line to Field Gray for hover). Never add a shadow.

## 5. Components

### Topbar
The brand anchor of every authenticated screen. Ink Black background, 56px height, full width. Left: wordmark ("Love" in white, "Inc" in Fellowship Burgundy, 18px / 500). Right: role chip (Deep Charcoal pill, 11px / 500), Fellowship Burgundy avatar circle with user initials (32px diameter, 12px / 500 text), user full name in white at 13px. No navigation lives here — it is purely brand identity and user context.

### Sidebar
200px wide, Archive Gray background, 0.5px Rule Line right border. Section headers in Label style (10px, uppercase, Margin Gray, 0.08em letter-spacing). Navigation items at 40px height, 13px / 400. Active item: Page White background, Ink Black text at 500 weight. Inactive: transparent background, Field Gray text. Sign Out pinned to the bottom with a 0.5px Rule Line separator above.

**Current violation:** Active sidebar items use `border-l-2 border-[#8B1A2F]` — a 2px left-side stripe, an absolute ban in this system. Active state must be expressed through Page White background + 500 weight text alone. Remove the left border.

### Mobile Bottom Navigation
Page White background, 56px + safe-area-inset height, 0.5px Rule Line top border. Icon-only — no labels. Active icons in Fellowship Burgundy; inactive in Margin Gray. Spans full screen width.

### Login Card
Page White surface, 12px radius (rounded-lg), 0.5px Rule Line border, 32px internal padding. Wordmark centered at top (22px / 500). Minimal: email field, password field, primary button, registration link below. No decorative elements.

### Input / Text Field
36px height, 8px radius (rounded-md), 0.5px Rule Line border at rest. Focus: border shifts to 1px Fellowship Burgundy. 13px body text; 12px Margin Gray label above field. Always Page White background — no fills.

### Primary Button
Ink Black background, Page White text, 8px radius, 36px height, 13px / 500. Full-width in form contexts. Hover: transitions to Fellowship Burgundy background (200ms ease-out). Loading: 75% opacity with inline spinner.

### Stat Card
Archive Gray background, 8px radius, 16px padding. Label in Label style (11px uppercase, Margin Gray). Value in 24px / 500, Fellowship Burgundy. Used in a 3-column grid on dashboards. Each stat must be actionable — not a decoration.

### Status Badge
Pill shape (full radius), 11px / 500, 2px vertical / 10px horizontal padding. Six variants: success, warning, danger, info, gray, wine. The wine variant (Wine Blush background, #6B1222 text) is the Love Inc identity badge — used for class labels and community-specific statuses.

### Section Container
Page White background, 12px radius, 1px Rule Line border, 16px internal padding. Used for dashboard panels. No shadow. Section headers inside use Label style.

## 6. Do's and Don'ts

### Do:
- **Do** use Fellowship Burgundy exclusively for: the wordmark "Inc", active navigation states, input focus borders, avatar backgrounds, and text links. These are its only roles.
- **Do** convey depth through tonal background layering — Ink Black topbar, Archive Gray sidebar, Page White content — not shadows.
- **Do** use Inter at 500 or 600 weight and larger size for all heading hierarchy. Size and weight do the work; color does not.
- **Do** place community photos at full width or anchored in a defined content zone. They are content — document a gathering, name the people in it.
- **Do** render the wordmark as "Love" in one color + "Inc" in Fellowship Burgundy, in a single sans-serif weight. Never rearrange or decorate.
- **Do** use uppercase + letter-spacing (0.05em) exclusively for structural labels: sidebar section headers and stat card labels. Never for body copy or page headings.
- **Do** express active navigation state through Page White background + 500 weight text. No side-stripe border.
- **Do** follow the 9-level typography scale (display, headline, title, body-lg, body, body-sm, label, caption, tiny) for consistency. All sizes, weights, and line-heights are centralized in `globals.css`.

### Don't:
- **Don't** use `border-left` or `border-right` greater than 1px as a colored accent stripe on nav items, list items, or cards. This pattern currently exists in the sidebar active state and assignment list items — it must be removed.
- **Don't** use soft gradients, stock photography, or generic religious imagery. Love Inc has real photos from real gatherings at Ashesi, KNUST, UMaT, and Legon.
- **Don't** build screens that look like Canvas or Blackboard — collapsible module accordions, numbered section rows, institutional blue-gray palettes, progress bars as primary UI.
- **Don't** use corporate HR or onboarding patterns: completion percentages as the primary metric, achievement badges, gamified streaks.
- **Don't** use `box-shadow` anywhere. If a component needs to feel interactive, change its border color.
- **Don't** add a second accent color. If the interface feels too gray, the answer is larger typography and more confident spacing — not another hue.
- **Don't** color a heading or body text with Fellowship Burgundy for emphasis. Weight and size are the emphasis tools.
- **Don't** use gradient text or background-clip text effects. The wordmark is solid color — always.
