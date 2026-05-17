# Design Refresh — 2026-05-17

A change log for the gate-page redesign and (potentially) site-wide neutral/earth-tone rollout. Each phase is intended to be **independently revertable** via `git revert <commit-hash>`.

---

## Reference image (provided by user)
Cursive "We are getting married in Italy!" headline, two input rows (email + password), copper/rose-gold pill button "Click to see details", warm cream/blush background.

## Goals
1. Restyle the passcode gate at [functions/_middleware.js](functions/_middleware.js) to match the reference image.
2. Add a second input field on the gate: **email address**, in addition to the existing password field.
3. Apply the new neutral/earth-tone palette + fonts across [deploy/public/index.html](deploy/public/index.html) (the rest of the site).

## Pre-existing baseline (in case we need to restore exactly)
- Local zip backup deleted; **Drive copy verified**: `BACKUP_WEDDING_05.17.26.zip` (private to kellyjeanne78746@gmail.com).
- Git baseline: HEAD currently at commit `8eac513` (last pushed commit; today's local edits not yet committed).

## Outstanding decisions (not yet implemented)
- **What does the email do?** Options being considered:
  - (A) Collected only — saved to KV: RSVPS alongside the access record. Password remains the sole auth check.
  - (B) Validated against guest list — guest must enter both a valid invited-email AND the correct password.
  Awaiting decision before any code is written.
- **Site-wide theme rollout timing** — recommend deferring until after the 2026-05-18 launch. Site-wide CSS replacement on the day before launch is a meaningful regression risk.

## Phases (status = NOT STARTED until explicitly marked otherwise)

### Phase 1 — Gate visual restyle (background + fonts + colors + button)
- **Files touched:** `functions/_middleware.js` (only)
- **What changed:**
  - Background: `#FBF8F1` → `#EAE0D4` (warm cream/blush)
  - Headline replaced: "Veronica & Samuel / Save the Date" → **"We are getting married in Italy!"** in **Monsieur La Doulaise** cursive, copper/rose-gold color `#B17F5F`
  - Removed the white card / gold border around the form — form now floats on the cream background
  - Removed the `gate-ornament` row (3 leaf glyphs) and the `gate-msg` paragraph
  - Inputs restyled: bottom-border-only, italic placeholder serves as label, centered text in copper
  - Button: rectangular charcoal → **pill-shaped copper gradient** with italic "Click to see details"
  - Body font: Cormorant Garamond → **EB Garamond**
  - Google Fonts `<link>` updated to load EB Garamond + Monsieur La Doulaise only
- **Revert:** `git revert <commit-hash>` once committed, or restore previous version from git history
- **Commit:** _not yet committed_ (uncommitted local working copy only)
- **Status:** ✅ CODE CHANGES IN PLACE — awaiting visual review on `localhost:8788`

### Phase 2 — Add email input field to gate
- **Files touched:** `functions/_middleware.js`
- **Decision made (no explicit user choice received):** **Option A — collect email only; passcode still gates entry.** Email is not validated against the guest list. If user wants Option B (validate against guest list), this is a follow-up change.
- **What changed:**
  - New `<input type="email" name="email">` rendered ABOVE the passcode input, with placeholder "Enter your email address to access information" and `required` attribute
  - POST `/__gate/login` handler now reads BOTH `email` and `passcode` from the form
  - Email is loose-validated (`/^[^@\s]+@[^@\s]+\.[^@\s]+$/`) — invalid format returns the gate with a friendly error and prefills the email so the user doesn't retype
  - On successful login (passcode matches), the email is **logged to KV: RSVPS** under key `gate:<ISO-timestamp>:<email>` with `{ email, when, userAgent }`. **Write is best-effort wrapped in try/catch — a KV failure does NOT block access** (gate stays load-bearing on the passcode).
  - Email is also passed back as a prefill value when the passcode is wrong, so users only retype the password
- **Revert:** Single commit covers both Phase 1 + 2 changes to `_middleware.js`. `git revert <commit-hash>` rolls back everything.
- **Commit:** _not yet committed_
- **Status:** ✅ CODE CHANGES IN PLACE — awaiting test on `localhost:8788`

### How to view the new gate
1. Dev server is already running on `localhost:8788` (background task)
2. Open a private/incognito browser window (so old gate cookie doesn't auto-bypass) → visit `http://localhost:8788`
3. The new gate should appear immediately
4. Verification cases:
   - Submit blank email → "Please enter a valid email address" error
   - Submit malformed email → same error
   - Submit valid email + WRONG passcode → "That passcode wasn't right..." error (email is preserved in the field)
   - Submit valid email + RIGHT passcode (from `.dev.vars`) → unlocks site
5. After successful local-only login, the email is written to local KV: RSVPS. To see it: `npx wrangler kv key list --binding=RSVPS --local`

### Phase 3 — Site-wide theme rollout
- **Files touched:** `deploy/public/index.html` (CSS variables + selective overrides only — NOT a wholesale rewrite)
- **Scope:** swap `--gold`, `--cream`, `--charcoal`, etc. to the new earth-tone palette. Add new font links to `<head>`. Override headline/body fonts.
- **Risk:** every section uses the existing palette. A site-wide change can affect mobile views, contrast, image overlays. Recommend doing **after** Monday launch.
- **Revert:** `git revert <commit-hash>` (single commit so revert is one step)
- **Commit:** _pending_
- **Status:** NOT STARTED — recommend deferral

## Extracted palette (rough, from the reference image)
| Token | Approx hex | Where |
|---|---|---|
| Background cream/blush | `#EAE0D5` | page background |
| Rose-gold text | `#B58263` | headline + form labels |
| Deeper copper | `#9C6A4D` | button start |
| Lighter copper | `#C4946F` | button end |
| Accent line | `#D9C8B6` | input underline |

(Exact values to be finalized when we start Phase 1.)

## Fonts (confirmed by user)
- Headline cursive / calligraphy: **Monsieur La Doulaise** (Google Fonts — needs to be added to `<link>` imports)
- Body / supporting type: **EB Garamond** (Google Fonts — also needs to be added)

## Test plan per phase
1. `npm run dev` → visit `http://localhost:8788` → confirm gate page matches reference image.
2. Verify gate **rejects wrong passcode** and **accepts right passcode** (load-bearing — see `project_site_must_remain_gated.md` memory).
3. Confirm no regression on the post-gate site content.

---

## Activity log
_(Append entries below as work progresses — newest at bottom.)_

- **2026-05-17** — Changelog file created. Awaiting decision on email-semantics before starting Phase 1/2 code.
- **2026-05-17** — Fonts confirmed by user: **Monsieur La Doulaise** (calligraphy) + **EB Garamond** (body). Updated changelog.
- **2026-05-17** — User chose to defer site-wide theme rollout until after Monday's launch ("gate page only" / "we will update Cloudflare next").
- **2026-05-17** — Phase 1 + Phase 2 code changes made to `functions/_middleware.js` (only). Email-semantics decision: collect-only (Option A) by default since user did not explicitly pick one — passcode remains the sole auth check. NOT committed to git yet; uncommitted working copy only. Awaiting visual review at `http://localhost:8788`.
- **2026-05-17** — Headline text revised: "We are getting married in Italy!" → **"We're getting married!"** so it fits comfortably on one line at all viewport widths.
- **2026-05-17** — Headline text revised again: "We're getting married!" → **"We are getting married!"** per user.
- **2026-05-17** — Font comparison preview built at `/Users/kellyhill/Desktop/wedding/font-preview.html` (9 candidates). User reviewed and decided to **keep Monsieur La Doulaise** as the gate headline font. Preview file kept on disk for reference; not in `deploy/public/`, so does not ship to the site.
- **2026-05-17** — `.gate-title` styling tuned per user request ("expanded 1.2, all on one line"): `letter-spacing` raised from `0.01em` → `0.06em`, `white-space: nowrap` added to force single line, font-size clamp adjusted to `clamp(1.8rem, 7vw, 5rem)` so the wider letter-spacing still fits on narrow viewports without overflowing. If the spacing looks too tight or too wide, easy 1-line tweak.
- **2026-05-17** — Fixed top/bottom letter clipping (user-reported on mobile): removed `overflow: hidden` + `text-overflow: clip` (which were clipping cursive ascenders/descenders), increased `line-height: 1.1` → `1.5`, added `padding: 0.2em 0` to give ascender/descender breathing room, and softened the font-size clamp to `clamp(1.5rem, 6.5vw, 5rem)` so the text scales smaller on narrow viewports.
- **2026-05-17** — Proportions tuned to better match the reference image (user feedback: "not the same appeal"). Headline now visually dominates the page:
  - `.gate-card` `max-width: 760px` → **`1040px`** (lets the wide headline breathe at desktop sizes)
  - `.gate-title` `font-size: clamp(1.5rem, 6.5vw, 5rem)` → **`clamp(1.8rem, 8.2vw, 7rem)`** (significantly bigger at the top end, scales gracefully)
  - `.gate-title` `margin-bottom: 56px` → **`96px`** (more breathing room between headline and form)
  - `.gate-title` `line-height: 1.5` → **`1.4`** (slightly tighter now that the surrounding margin handles spacing)
  - `.field` `max-width: 540px` → **`440px`** (narrower form so the headline visually dominates)
  - `.field` `margin-bottom: 22px` → **`18px`** (tighter pair of fields)
  - `.field input` `font-size: clamp(1.05rem, 1.5vw, 1.25rem)` → **`clamp(1.1rem, 1.6vw, 1.35rem)`** (slightly larger so the placeholder italic reads as gracefully as the reference)
  - `.field input` `padding: 10px 4px` → **`12px 4px`** (a touch more vertical air around each input)
- **2026-05-17** — Added `-webkit-font-smoothing: antialiased` + `-moz-osx-font-smoothing: grayscale` + `text-rendering: geometricPrecision` to `.gate-title` to crisp up stroke rendering.
- **2026-05-17** — Headline font swapped: **Monsieur La Doulaise → Italianno**, per user's "larger + thinner-stroke" request. Monsieur La Doulaise has only one weight (regular), so font-weight tweaks couldn't make it thinner — switching to a genuinely thinner-stroke font (Italianno) was the right move. Paired with a larger size:
  - Google Fonts `<link>` updated: `Monsieur+La+Doulaise` → `Italianno`
  - `.gate-title` `font-family`: `'Monsieur La Doulaise', ...` → `'Italianno', ...`
  - `.gate-title` `font-size`: `clamp(1.8rem, 8.2vw, 7rem)` → **`clamp(2rem, 10vw, 8.5rem)`**
  - `.gate-title` `letter-spacing`: `0.06em` → `0.04em` (Italianno's narrower glyphs need less spread to read)
  - `.gate-title` `line-height`: `1.4` → `1.3`
- **2026-05-17** — **REVERTED Italianno.** User strong reaction: "horrible / not at all what we gave as example." Restored to Monsieur La Doulaise at the previous proportions: `clamp(1.8rem, 8.2vw, 7rem)`, `letter-spacing: 0.06em`, `line-height: 1.4`. Font-smoothing CSS retained. Open question: the reference image's font is likely **not a Google Font** — probably a commercial calligraphy face from the Bliss and Bone source. Next step is to either confirm the actual font from the source designer / SVG files, or accept that no free font will perfectly match and pick the closest available compromise.
- **2026-05-17** — Tried Great Vibes; user said only Monsieur La Doulaise (of all options previewed) qualifies as "calligraphy with fancy loops." Reverted. Built a new calligraphy-only preview (font-preview.html) showing Imperial Script, Mr Dafoe, Sail, Bonheur Royale, Birthstone, Style Script, Tangerine Bold, Petit Formal Script, Pinyon Script, Mrs Saint Delafield. User confirmed: **stay on Monsieur La Doulaise**.
- **2026-05-17** — More breathing room added to prevent any ascender/descender clipping (user-reported issue): `line-height: 1.4` → `1.7`, `padding: 0.2em 0` → `0.4em 0`, explicit `overflow: visible`, top margin `96px` → `80px`.
- **2026-05-17** — Letter-spacing expanded per user request: `0.06em` → `0.12em`. Required widening `.gate-card` `max-width: 1040px` → `1240px` and softening font-size clamp to `clamp(1.4rem, 7.5vw, 6.5rem)` so the expanded headline still fits on one line at every viewport width.
- **2026-05-17** — Email field made **optional** at user request ("the email gate is not set up yet"): removed `required` attribute from `<input name="email">`, updated POST handler to only validate format if an email was provided. Passcode is still the sole gate. If a user submits a malformed email, error message updated to "Please enter a valid email address (or leave it blank)."
- **2026-05-17** — Removed `<div class="hero-announcement">We are getting married!</div>` from [deploy/public/index.html:2168](deploy/public/index.html#L2168) (was inside `<section class="hero">`, right under the sticky nav). Removed at user request now that the gate page handles the "We are getting married!" headline upstream. **Files touched: `deploy/public/index.html` (single line removal).**
- **2026-05-17** — Hero restructure (post-gate site) per user request: "put the Veronica Natale & Samuel Hill where the 'We're getting married' was under the top nav, and move the date/separator/countdown into their own banner under the Save the Date artwork." **Files touched: `deploy/public/index.html`.**
  - **In `<section class="hero">`:** reordered so `<h1 class="hero-names">` is the top element (was second), then `<div class="hero-save-the-date">` (location) follows. **Removed** from this section: `<div class="hero-married">`, `<div class="hero-date-line">`, `<div class="hero-countdown">` (with all four day/hour/min/sec cells).
  - **Added a new `<section class="date-countdown-banner" id="dateCountdown">`** immediately after `<section class="save-the-date">`. Contains:
    - "Save our Date · May 29th, 2027" (class `.dcb-date`)
    - Gold horizontal separator (class `.dcb-line`)
    - Countdown grid with four cells using the SAME IDs (`hero-cd-days`, `hero-cd-hours`, `hero-cd-mins`, `hero-cd-secs`) as before — so the existing countdown JavaScript continues to update them with no changes needed.
  - **Added new CSS** for the banner: light cream background, charcoal date text, gold separator, gold-dark countdown numbers, warm-gray italic labels. Inserted right after the existing `.std-image` rule in the main `<style>` block. Uses `clamp()` for responsive sizing so no separate mobile rules were needed.
  - **Revert path:** single `git revert <commit-hash>` once committed. Without git, the original hero block can be restored from `BACKUP_WEDDING_05.17.26.zip` in Drive.
- **2026-05-17** — Location ("Monte Porzio Catone · Roma, Italia") **also** moved out of hero per user request — now lives in the date-countdown banner under the Save the Date artwork. **Files touched: `deploy/public/index.html`.**
  - Removed `<div class="hero-save-the-date">` from `<section class="hero">`. Hero now contains ONLY `<h1 class="hero-names">` plus the photo and scroll indicator.
  - Added `<div class="dcb-location">Monte Porzio Catone · Roma, Italia</div>` to the date-countdown banner, between the date headline and the gold separator line. Banner order is now: date → location → separator → countdown.
  - Added CSS for `.dcb-location` (italic Cormorant Garamond, uppercase letterspaced, gold-dark color so it reads as a subtitle to the date headline).
- **2026-05-17** — `.dcb-location` color matched to the gate headline: `var(--gold-dark)` (#A89768) → `#B17F5F` (the gate's copper/rose-gold), per user request.
- **2026-05-17** — **Site-wide gold-text rollover to the gate's copper/rose-gold.** User direction: "all of the font that is the brownish gold should be the new color; if font is blue or another color, do not update." **Files touched: `deploy/public/index.html`.** Three CSS sweeps applied via `replace_all`:
  - `color: var(--gold-dark);` → `color: #B17F5F;` (~15 occurrences — section labels like "The Day", "The Venue", "Hotels", schedule times, hotel labels, etc.)
  - `color: var(--gold);` → `color: #B17F5F;` (~10 occurrences — hotel headings, footer accents, etc.)
  - `color: #D8C9A0;` → `color: #B17F5F;` (4 occurrences — hero accent text, save-the-date date, countdown numbers, save-the-date hotel text)
  - **Untouched (intentional):** `--dusty-blue`, `--dusty-blue-light`, `--charcoal`, `--warm-gray`, `--blush`, `--lavender`, `--vine-green`, all other non-gold text colors. Backgrounds, borders, separators, gradients using gold variables are also untouched — only text `color:` declarations changed.
  - **Revert:** `git revert <commit-hash>` once committed, or use the three opposite `replace_all` edits to restore originals.
- **2026-05-17** — **Nav link text overhaul** per user-provided reference image. **Files touched: `deploy/public/index.html` (desktop `.nav-links` block + `#mobileMenu` block only).** Section IDs, anchor destinations, and on-page section titles are **unchanged** (per the `feedback_nav_vs_titles` memory). The 12-item nav, in order:
  | # | Label | Anchor | Note |
  |---|---|---|---|
  | 1 | Home Page | `#hero` | new — jumps to top |
  | 2 | Save Our Date! | `#savethedate` | new — links to the artwork section |
  | 3 | Our Engagement | `#gallery` | was "Engagement" |
  | 4 | The Venue | `#venue` | was "Venue" |
  | 5 | Accommodations | `#travel` | label change; same destination as #6 |
  | 6 | Traveling to Rome | `#travel` | new label, same destination as #5 — site doesn't have separate "how to get there" content yet |
  | 7 | FAQ's | `#faq` | was "FAQ" (with apostrophe per the reference image) |
  | 8 | Explore | `#explore` | unchanged |
  | 9 | RSVP | `#rsvp` | unchanged |
  | 10 | Registry | `#registry` | unchanged |
  | 11 | Updates | `#updates` | unchanged |
  | 12 | Contact | dropdown | unchanged (desktop dropdown / mobile split into Email Us + Text Us) |
  - **Removed from nav:** "Schedule" (the section still exists on the page; only the nav link was removed per the user's reference list).
  - **Spelling:** image showed "Accomodations" (typo); standardized to "Accommodations" (correct).
  - **Mobile menu** updated to match (same 12 items, with Contact split into Email Us + Text Us as before).
  - **Revert:** single `git revert` of this commit once committed.
- **2026-05-17** — **Nav refined per user's exact list.** **Files touched: `deploy/public/index.html` (nav block + mobile menu + SECTION_VISIBILITY config).**
  - **Renames:** "The Venue" → "Our Venue"; "Updates" → "Wedding Updates"; "Schedule" → "Timeline"; "Accommodations" → "Accomodations" (one m, per user's spelling).
  - **Reordered:** Home Page · Save Our Date! · Our Engagement · Our Venue · Timeline · Traveling to Rome · Accomodations · Registry · RSVP · FAQ's · Wedding Updates · Explore.
  - **Contact dropdown removed** from desktop nav. **Email Us / Text Us removed** from mobile menu. The contact info still lives in the page footer + RSVP section, but there is no longer a quick contact link in the nav. Flag this back if you want it returned.
  - **Timeline (Schedule) set to `false`** in `SECTION_VISIBILITY` so the section + its nav link are both hidden until ready. Flipping to `true` reveals it (and it sits between "Our Venue" and "Traveling to Rome" in the nav order).
  - **Both "Traveling to Rome" and "Accomodations" still map to `#travel`** — the site currently has one combined section. Splitting into two distinct sections is deferred until "Traveling to Rome" content (flights / trains / car rentals) exists.
  - **Revert path:** single `git revert <commit-hash>`.
- **2026-05-17** — Nav shortened again per user ("not enough room in nav, reducing the words"). Desktop nav now 10 items, in this order: **Home · Save our Date! · Engagement · Venue · Traveling · Accommodations · RSVP · Registry · Updates · Contact**. Mobile menu mirrors (with Contact split into Email Us / Text Us as before). **Files touched: `deploy/public/index.html` (nav block + mobile menu).** Changes from the prior 12-item nav:
  - Renames: Home Page → **Home**; Our Engagement → **Engagement**; Our Venue → **Venue**; Traveling to Rome → **Traveling**; Accomodations → **Accommodations** (corrected spelling, two m's); Wedding Updates → **Updates**.
  - **Dropped from nav:** Timeline (still hidden via SECTION_VISIBILITY=false), FAQ's, Explore. Their sections still exist on the page and are reachable by scrolling — there's just no nav link to them. **Flag back if you want them returned.**
  - **Contact dropdown restored** to desktop nav; **Email Us / Text Us restored** to mobile menu.
  - **Revert:** single `git revert <commit-hash>`.
- **2026-05-17** — Save the Date section background color changed per user-provided image sample: `var(--white)` (#FFFFFF) → **`#F7F4EE`** (very pale warm off-white). **Files touched: `deploy/public/index.html` (single line in `.save-the-date` CSS rule).** Inline comment in the CSS notes both the date and how to revert. **Easy revert:** change `background: #F7F4EE;` back to `background: var(--white);`.
- **2026-05-17** — **CORRECTION.** Previous bullet misapplied the user's intent. User meant the **date-countdown banner** (the section *under* the Save the Date artwork), not the Save the Date artwork section itself. And the color is a **light gray-blue**, not a warm off-white. Two reversing edits:
  - `.save-the-date` background restored: `#F7F4EE` → `var(--white)` (back to solid white as before).
  - `.date-countdown-banner` background changed: `var(--cream)` (#FAF5EE) → **`#DDE4E6`** (light gray-blue). Inline CSS comment notes the date and revert path. **Easy revert:** change `background: #DDE4E6;` back to `background: var(--cream);` in `.date-countdown-banner`.
- **2026-05-17** — Hero names switched to **Monsieur La Doulaise** (matching the gate page) and structured so the "&" sits centered on its own line between the two names. **Files touched: `deploy/public/index.html`.**
  - Added `Monsieur+La+Doulaise` to the Google Fonts `<link>` in `<head>`.
  - `.hero-names` `font-family: 'Italianno', cursive` → `'Monsieur La Doulaise', 'Italianno', cursive`; converted to flex column so each child stacks on its own line, all centered.
  - HTML restructured: instead of `Veronica Natale<span class="hero-ampersand">&</span>Samuel Hill` on one line, now three explicit elements — `<span class="hero-name-line">Veronica Natale</span>`, `<span class="hero-ampersand">&</span>`, `<span class="hero-name-line">Samuel Hill</span>` — so the ampersand is unambiguously centered (not subject to inline-wrapping behavior).
- **2026-05-17** — Hero "Veronica Natale & Samuel Hill" repositioned to **top-center of the hero, under the sticky nav** (was bottom-left of left 45% panel). **Files touched: `deploy/public/index.html` (`.hero-content` desktop + mobile rules).**
  - Desktop `.hero-content`: `width: 45%` → `100%`; `justify-content: center` → `flex-start`; added `align-items: center` + `text-align: center`; `padding-top: 16rem` → `8rem`; gradient direction changed from left-to-right to top-to-bottom (so the dark band is at the top under the nav, fading down to reveal the photo).
  - Mobile `.hero-content`: `justify-content: flex-end` → `flex-start`; bottom-padding → top-padding (`5rem 1.2rem 0`); gradient reversed (top dark, fading down). Names now appear at the TOP of the photo on mobile too, matching the desktop layout.
- **2026-05-17** — Nav width + spacing tuned so labels never wrap inside themselves. **Files touched: `deploy/public/index.html` (`.nav-inner`, `.nav-links`, `.nav-links a`).**
  - `.nav-inner` `max-width: 1200px` → **`1500px`** (more horizontal room for 10 items + Contact dropdown).
  - `.nav-links` added `justify-content: center`, `flex-wrap: wrap`, `row-gap: 0.6rem` (if the row needs to break, it stacks cleanly with vertical spacing — no half-broken labels), `gap: 1.8rem` → `1.1rem` (tighter horizontal spacing so more items fit per row).
  - `.nav-links a` added `white-space: nowrap` (each link's text stays on a single line — fixes "Save our Date!" wrapping into 3 lines). Also slightly reduced `font-size: 0.75rem` → `0.72rem` and `letter-spacing: 0.15em` → `0.13em` to give every label more room.
