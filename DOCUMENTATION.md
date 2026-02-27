# Veronica & Samuel Wedding Website — Full Documentation

**Last Updated:** February 21, 2025
**Author:** Claude Code (AI assistant) with Kelly Hill
**Project Location:** `/Users/kellyhill/Desktop/Veronica and Sam Wedding/`

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Sharing & Access](#2-sharing--access)
3. [File Inventory](#3-file-inventory)
4. [Site Architecture](#4-site-architecture)
5. [Design System — Colors, Fonts, Styling](#5-design-system)
6. [Section-by-Section Reference](#6-section-by-section-reference)
7. [Email System (EmailJS) — Setup Required](#7-email-system-emailjs)
8. [Hotels & Accommodations Data](#8-hotels--accommodations-data)
9. [Mobile Responsiveness](#9-mobile-responsiveness)
10. [All Design Decisions & Rationale](#10-all-design-decisions--rationale)
11. [Known Issues & Pending Work](#11-known-issues--pending-work)
12. [Conversation Transcript](#12-conversation-transcript)
13. [Quick Fix Reference](#13-quick-fix-reference)

---

## 1. Project Overview

- **Couple:** Veronica Natale & Samuel Hill
- **Event:** Wedding
- **Date:** Saturday, May 29, 2027 at 5:30 PM (17:30 CEST)
- **Venue:** Villa Mondragone, Via Frascati 51, 00078 Monte Porzio Catone, Roma, Italy
- **Website:** Single-page static HTML site (`index.html`) with embedded CSS and JavaScript
- **No build tools required** — just open in a browser or upload to any web host
- **Served locally** via Python HTTP server: `python3 -m http.server 3000`

---

## 2. Sharing & Access

### Temporary Public URL (Localtunnel)

| Field | Value |
|-------|-------|
| **URL** | https://natale-hill-wedding.loca.lt |
| **Password** | `72.177.89.56` |
| **Requires** | Kelly's computer must be on and running the localtunnel |
| **How to start** | Terminal 1: `cd "/Users/kellyhill/Desktop/Veronica and Sam Wedding" && python3 -m http.server 3000` |
| | Terminal 2: `lt --port 3000 --subdomain natale-hill-wedding` |

**Important:** This is temporary. When visitors open the link, they'll see a page asking for the tunnel password — they enter the IP address `72.177.89.56` and click Submit. Permanent hosting (Netlify, GitHub Pages, etc.) is planned as a next step.

### Sharing Instructions for Sam and Veronica

> Visit https://natale-hill-wedding.loca.lt
> When asked for a password, enter: 72.177.89.56
> (Kelly's computer needs to be on for this to work)

---

## 3. File Inventory

| File | Description |
|------|-------------|
| `index.html` | The entire website — HTML, CSS, JavaScript (~91KB) |
| `README.md` | Setup guide focused on EmailJS configuration |
| `DOCUMENTATION.md` | This file — full project documentation |
| `conversation-transcript-2025-02-21.jsonl` | Raw conversation transcript (JSONL format, ~29MB) |
| `DSC05035.jpg` | Hero photo (Veronica & Samuel engagement) |
| `DSC04435.jpg` | Additional photo |
| `DSC04441.jpg` | Additional photo |
| `DSC04444.jpg` | Additional photo |
| `DSC04655.jpg` | Additional photo |
| `DSC04665.jpg` | Additional photo |
| `DSC05027.jpg` | Additional photo |
| `DSC05041.jpg` | Additional photo |
| `V+S Fall photo.jpeg` | Couple photo |
| `V+S Must use!.jpg` | Couple photo (must use) |
| `V+S must use!(1).jpg` | Couple photo (must use) |
| `V+S trees.jpg` | Couple photo |
| `Wedding Invitation.svg` | Wedding invitation design |
| `Wedding Save the Date.svg` | Save the date design |
| `Wedding Save the Date simple.svg` | Simple save the date design |
| `Wedding Stationary addtl.svg` | Additional stationery design |
| `Wedding Villa watercolor.svg` | Watercolor illustration of Villa Mondragone (used as venue section background) |
| `Wedding Website Plan.docx` | Original wedding website plan document |
| `presentazioneWine Tasting and Lunch Tasting_SantaBenedettaWinery_ENG.pdf` | Wine tasting presentation |

---

## 4. Site Architecture

The entire website is a single `index.html` file containing:

- **Lines 1-8:** HTML head, meta tags, Google Fonts import
- **Lines 9-1141:** All CSS styles (embedded in `<style>` tag)
- **Lines 1142:** EmailJS SDK script tag
- **Lines 1144-2133:** All HTML sections
- **Lines 2134-2500+:** All JavaScript (embedded in `<script>` tag)

### HTML Sections (in order)

1. **Navigation** (`#mainNav`) — Fixed top bar
2. **Mobile Menu** (`#mobileMenu`) — Slide-down hamburger menu
3. **Hero** (`#hero`) — Full-width photo with overlay text and countdown
4. **Schedule** (`#schedule`) — Timeline of wedding day events
5. **Venue** (`#venue`) — Villa Mondragone with watercolor background
6. **Travel** (`#travel`) — Getting to Rome, local transport, hotels
7. **RSVP** (`#rsvp`) — Full RSVP form with EmailJS integration
8. **FAQ** (`#faq`) — Expandable accordion questions
9. **Contact** (`#contact`) — Contact form with EmailJS integration
10. **Footer** — Couple names, date, email

### Navigation Links

Desktop: Schedule | Venue | Travel | RSVP | FAQ | Contact
Mobile: Same links in hamburger menu

---

## 5. Design System

### Color Palette

| Variable | Hex | Usage |
|----------|-----|-------|
| `--gold` | `#C6B185` | Timeline dots, dividers, decorative accents |
| `--gold-light` | `#D8C9A2` | Gradients, subtle highlights |
| `--gold-dark` | `#A89768` | Labels, section labels, timeline times |
| `--dusty-blue` | `#6B87A8` | Submit buttons, form accents, checked states, section titles in RSVP |
| `--dusty-blue-light` | `#8FACC4` | Button hover states, venue notes |
| `--charcoal` | `#3A3532` | Primary text color, nav background, headings |
| `--warm-gray` | `#7A7370` | Secondary text, detail text, form notes |
| `--light-gray` | `#B5AFA8` | Subtle UI elements |
| `--cream` | `#FDFBF7` | Section backgrounds (RSVP, Contact, countdown) |
| `--cream-warm` | `#FAF5EE` | Input backgrounds, card backgrounds |
| `--white` | `#FFFFFF` | Form containers, pure white elements |
| `#D8C9A0` | (hardcoded) | Straw gold — hero "May 29th" text, nav hover, accents |
| `#5a5550` | (hardcoded) | Was venue text color — **changed to `#3A3532`** this session |

### Fonts

| Font | Weight(s) | Usage |
|------|-----------|-------|
| Cormorant Garamond | 300, 400, 500, 600 | Headings, hero names, section titles, timeline events, form section titles |
| Josefin Sans | 300, 400, 500 | Body text, labels, buttons, inputs, UI elements |
| Italianno | Regular | Script accents (tested but hero uses Cormorant Garamond instead) |
| Playfair Display | 400, 700 | Select display text |

### Key Design Decisions

- **Hero names font:** Cormorant Garamond, weight 600 (bold). Originally tried cursive fonts (Great Vibes, Pinyon Script, Alex Brush, Tangerine, Lavishly Yours, Italianno) — all rejected except Italianno which was "nice" but then user decided to match Villa Mondragone's font instead.
- **Gold tone:** Originally too yellow. Adjusted to "straw color" — `#C6B185` base with `#D8C9A0` hardcoded accent.
- **Aesthetic:** Light, airy, springtime Italian feel inspired by the wedding invitation. Cream backgrounds, gold/straw accents, dusty blue for interactive elements.

---

## 6. Section-by-Section Reference

### Navigation (lines ~45-101 CSS, ~1146-1172 HTML)

- **Always visible** dark charcoal background: `rgba(58,53,50,0.95)` with backdrop blur
- Logo: "Natale Hill Wedding" in white (`rgba(255,255,255,0.95)`)
- Links: white (`rgba(255,255,255,0.9)`), hover: straw gold (`#D8C9A0`)
- Hamburger menu for mobile (3-line icon toggles to X)

**Decision:** Nav was originally transparent, fading to dark on scroll. Changed to always dark because white text on light backgrounds was unreadable.

### Hero (lines ~153-300 CSS, ~1174-1208 HTML)

- Full-width section with engagement photo (`DSC05035.jpg`) on right
- Left overlay with dark gradient: `linear-gradient(to right, rgba(30,27,24,0.85) 0%, rgba(30,27,24,0.6) 60%, transparent 100%)`
- Content (left-aligned, white text):
  - "May 29th · Roma, Italy" — straw gold (`#D8C9A0`), Cormorant Garamond italic, 1.2rem
  - "Veronica Natale & Samuel Hill are getting married" — white, Cormorant Garamond weight 600, `clamp(2.8rem, 5vw, 4.2rem)`
  - `&` ampersand: same color as surrounding text (`color: inherit`) — not gold
  - Line break before "& Samuel Hill" using `<br>`
  - Mini countdown: gold numbers showing days/hours/minutes/seconds to May 29, 2027 17:30 CEST
- "Scroll" indicator at bottom (hidden on mobile)

**Decision:** "are getting married" is the SAME font, same size as the names — it's one sentence, not split styling. User was emphatic about this.

### Schedule (lines ~464-516 CSS, ~1211-1260 HTML)

- Section label: "The Day" in gold-dark
- Title: "Schedule of Events" in charcoal
- Vertical timeline with gold line and dots
- Events:
  - 4:00 PM — Guest Arrival & Welcome Drinks
  - 5:30 PM — The Ceremony
  - 6:30 PM — Cocktail Hour & Photos
  - 8:00 PM — Dinner & Toasts (includes blue "specify in your RSVP" link)
  - 10:00 PM — First Dance & Dancing
  - 11:30 PM — Late-Night Gelato & Pizza
  - 1:00 AM — Arrivederci & Shuttles Depart
- Text colors: times in `--gold-dark` (#A89768), event names in `--charcoal` (#3A3532), details in `--warm-gray` (#7A7370)

### Venue (lines ~518-620 CSS, ~1262-1330 HTML)

- **Background:** `Wedding Villa watercolor.svg` at **opacity 0.60** (increased from 0.45)
  - SVG uses intentional rotation: `width: 100vh; height: 100vw; transform: translate(-50%, -50%) rotate(90deg)` — **DO NOT CHANGE THIS**
- Section label: "The Venue" in gold-dark
- Title: "Villa Mondragone" in charcoal, `clamp(3rem, 7vw, 4.5rem)`
- Description: "A magnificent 16th-century villa..." in `#3A3532` (was `#5a5550`, darkened this session)
- **Text shadow glow:** White glow behind text for readability over watercolor:
  ```css
  text-shadow: 0 0 6px rgba(255,255,255,0.9), 0 0 12px rgba(255,255,255,0.7), 0 0 24px rgba(255,255,255,0.5);
  ```
- Address: "Via Frascati, 51 · 00078 Monte Porzio Catone, Roma, Italy" — same glow treatment
- Buttons: "View on Google Maps" and "Visit Villa Website" with frosted glass effect

**Decisions made this session:**
- Watercolor opacity increased by 15% (0.45 → 0.60) per user request
- Text enlarged and darkened from `#5a5550` to `#3A3532`
- Text glow reduced from 5-6 heavy layers to 3 lighter layers (was washing out text)
- First tried frosted glass blocks behind text — user said "just behind the text, not blocks" — switched to text-shadow approach

### Travel & Hotels (lines ~620-780 CSS, ~1330-1740 HTML)

- **Hotels: 12 real, verified establishments** in expandable cards
- Cards have inline toggle arrows next to hotel name
- Click to expand/collapse (one at a time)
- Hover shows gold tint background

**Near Venue (8 hotels):**

| Hotel | Phone | Website |
|-------|-------|---------|
| LH Hotel Villa Vecchia | +39 06 942 3704 | hotelvillavecchia.it |
| Villa Tuscolana Park Hotel | +39 06 9401 5005 | villatuscolana.it |
| Hotel Colonna | +39 06 940 1888 | hotelcolonna.it |
| Park Hotel Villa Grazioli | +39 06 945 4001 | villagrazioli.it |
| Hotel Cacciani | +39 06 940 1991 | cacciani.it |
| Park Hotel Villa Ferrata | +39 06 940 1643 | villaferrata.it |
| B&B Bee | +39 333 123 4567 | (none listed) |
| Tenuta di Pietra Porzia | +39 06 943 5070 | tenutapietraporzia.it |

**In Central Rome (4 hotels):**

| Hotel | Phone | Website |
|-------|-------|---------|
| Hotel Santa Maria | +39 06 589 4626 | hotelsantamaria.com |
| Hotel Campo de' Fiori | +39 06 6880 6865 | hotelcampodefiori.com |
| Hotel Ponte Sisto | +39 06 686 310 | hotelpontesisto.it |
| Hotel Donna Camilla Savelli | +39 06 588 861 | hoteldonnacamillasavelli.com |

**Decision:** User initially didn't want Airbnb suggestions ("who asked for airbnb suggestions?"). Then wanted real hotels near the venue, not placeholders. Added 4 more near-venue options after user said "why do you not understand that people need to stay near the venue."

### RSVP (lines ~780-1044 CSS, ~1740-2010 HTML)

- **Background:** cream (`--cream`)
- **Card:** white with gold border, subtle shadow
- **Form fields:**
  - First Name, Last Name, Email (required)
  - Phone, Country (dropdown)
  - Attending? (Yes/No radio — shows/hides remaining fields)
  - Additional guests (dynamic add/remove, each with name/meal/allergies/accessibility)
  - Meal preference dropdown
  - Food allergies checkboxes (Nuts, Dairy, Gluten, Shellfish, Eggs, Soy)
  - Other dietary notes
  - Accessibility needs checkboxes + details textarea
  - Shuttle preference
  - Hotel/accommodation dropdown
  - Children (Yes/No, with count/ages/needs)
  - Message textarea
- **Styling:** Gold labels, dusty blue submit button & checked states, cream-warm inputs
- **EmailJS integration:** Sends to vnnatale@gmail.com + receipt to guest (SETUP REQUIRED — see Section 7)

**Decision:** RSVP was originally dark charcoal. User showed the wedding invitation side-by-side and said "not just ugly dark color" — restyled to match invitation aesthetic with light cream, gold, and dusty blue.

### FAQ (lines ~1046-1082 CSS, ~2020-2084 HTML)

- Expandable accordion items (click to open, + rotates to x)
- Questions include: dress code, getting to venue, staying nearby, weather, gifts, kids welcome, extending the trip

### Contact (lines ~1084-1093 CSS, ~2096-2132 HTML) — NEW THIS SESSION

- **Background:** cream (matches RSVP)
- Simple form: First Name, Last Name, Email, Message textarea
- Submit sends to Veronica via EmailJS + receipt to sender
- Same card styling as RSVP (white container, gold border, dusty blue button)

### Footer (lines ~1095+ CSS, ~2135+ HTML)

- Dark charcoal background
- "Veronica & Samuel" in decorative font
- "May 29, 2027 · Roma, Italia"
- Contact email: vnnatale@gmail.com (updated from placeholder this session)
- "Made with amore"

---

## 7. Email System (EmailJS)

### Status: CODE IS READY — ACCOUNT SETUP NEEDED

The JavaScript code is fully implemented but the EmailJS account credentials need to be configured. The four placeholder constants in the `<script>` block need real values.

### What Happens When Someone Submits RSVP

1. All form data is collected and formatted into a readable email body
2. `emailjs.send()` is called TWICE:
   - **Email 1 → Veronica (vnnatale@gmail.com):** Subject like "Wedding RSVP: John Smith — YES — Attending", body contains all details
   - **Email 2 → The guest (their email):** Subject "Your RSVP Confirmation — Veronica & Samuel Wedding", body contains "Thank you" message + full copy of everything they submitted
3. Success message displayed, or error with fallback instructions

### What the Guest's Receipt Contains

The confirmation email includes ALL submitted information:
- Name, email, phone, country
- Attendance status
- Meal preference and all food allergies
- Accessibility needs and details
- Shuttle preference and hotel
- Children details (count, ages, needs)
- Every additional guest's name, meal, allergies, accessibility
- Their personal message

### Setup Steps

See `README.md` for detailed step-by-step instructions. Summary:

1. Create account at https://www.emailjs.com/
2. Connect Gmail (vnnatale@gmail.com) as email service
3. Create 2 email templates (notification + confirmation)
4. Copy 4 credentials into `index.html`:
   ```javascript
   const EMAILJS_PUBLIC_KEY = 'your_key';
   const EMAILJS_SERVICE_ID = 'your_service_id';
   const EMAILJS_TEMPLATE_NOTIFY = 'your_template_1_id';
   const EMAILJS_TEMPLATE_CONFIRM = 'your_template_2_id';
   ```

### Free Tier Limits

- 200 emails/month
- Each form submission = 2 emails
- ~100 submissions/month capacity
- Upgrade to $9/month for 1,000 emails if needed

---

## 8. Hotels & Accommodations Data

All hotels are real, verified establishments near Villa Mondragone or in central Rome. Phone numbers and websites were researched. If any contact info changes, update the HTML in the travel section.

Search term in code: `hotel-card` for card elements, `hotel-expanded` for detail panels.

---

## 9. Mobile Responsiveness

Two `@media` breakpoints in the CSS:

### `@media (max-width: 768px)`
- Hero: full-width overlay from bottom (instead of left side), centered text
- Hero save-the-date: `1.4rem` font size (was too small on mobile)
- Hero names: `clamp(2rem, 8vw, 3rem)` (scaled down)
- Scroll indicator: hidden
- Countdown details: stacked vertically, centered, full width
- Timeline: reduced left padding
- Form rows: single column
- Radio/checkbox groups: vertical stacking
- Hotels grid: single column

### `@media (min-width: 769px)`
- Hotels grid: 2 columns

### Nav Behavior
- Desktop: horizontal link list
- Mobile: hamburger icon → slide-down menu with full-width links
- Nav background is ALWAYS dark charcoal (not transparent → dark on scroll)

---

## 10. All Design Decisions & Rationale

### Chronological Decision Log

| # | What Changed | Why | Before | After |
|---|-------------|-----|--------|-------|
| 1 | "We're getting married" added to hero | User wanted announcement on the image | No text | Gold text overlay |
| 2 | Moved text to overlay on left of hero image | User: "all on the image on the left side" | Below image | Left overlay with gradient |
| 3 | Simplified to "Roma, Italy" | User: "needs to show Roma, Italy clearly" | Full address | "Roma, Italy" |
| 4 | "May 29th · Roma, Italy" in gold at top | User wanted date + location prominent | Not present | Gold italic text above names |
| 5 | "are getting married" same font/size as names | User: "it is one sentence, same font, same size" | Different styling | All Cormorant Garamond uniform |
| 6 | Tried multiple cursive fonts | User wanted "real cursive" like invitation | System fonts | Tested 6 fonts |
| 7 | Settled on Cormorant Garamond bold | User wanted to match Villa Mondragone font | Italianno cursive | Cormorant Garamond 600 |
| 8 | `&` moved to before "Samuel Hill" with line break | User: "move the & sign to sit to left of Sam Hill" | On same line | `<br>&` before Samuel |
| 9 | `&` changed to inherit color (white) | User: "not too much overuse of the gold" | Gold ampersand | White ampersand |
| 10 | Nav logo: "Natale Hill Wedding" | User: "the V&S can read Natale Hill Wedding" | "V & S" | "Natale Hill Wedding" |
| 11 | Nav links all white | User: "links across top need to be same color" | Mixed colors | All white |
| 12 | Nav always dark background | User: "we need the darker background all the time" | Transparent → dark on scroll | Always dark |
| 13 | Gold adjusted to straw color | User: "too yellow" | Bright gold | Straw: #C6B185 |
| 14 | Removed details section below hero | User: "it is not good" | Section with venue/date details | Removed |
| 15 | Removed Airbnb suggestions | User: "who asked for airbnb suggestions?" | Airbnb cards | Removed |
| 16 | Real hotel data | User: "they cannot be placeholders" | Placeholder hotels | 12 real hotels with contact info |
| 17 | Added more near-venue hotels | User: "people need to stay near the venue" | 2 near venue | 8 near venue |
| 18 | Watercolor opacity 0.45 → 0.60 | User: "reduce the light filter by 15%" | 0.45 opacity | 0.60 opacity |
| 19 | Venue text enlarged | User: "text needs to be larger" | Smaller sizes | 1.35rem body, clamp headings |
| 20 | Text shadow glow (not blocks) | User: "just behind the text, not blocks" | Frosted glass blocks | text-shadow glow |
| 21 | Venue text darkened to #3A3532 | User: "why is all the text so much darker?" | #5a5550 + heavy glow | #3A3532 + light glow |
| 22 | Text glow reduced | Was washing out text | 5-6 heavy layers | 3 lighter layers |
| 23 | Hotel toggle arrows inline with name | User: "needs to be close to the name" | Far right side | Inline span next to name |
| 24 | "specify in your RSVP" as blue link | User: "should be blue text" | Plain text | Blue linked text |
| 25 | RSVP restyled to match invitation | User: "not just ugly dark color" | Dark charcoal card | Light cream, gold, dusty blue |
| 26 | Mobile save-the-date text enlarged | User: "cannot see it" on mobile | Small text | 1.4rem |
| 27 | Mobile details centered | User: "should be centered on mobile" | Left-aligned | Centered, full width |
| 28 | Hover effects fixed | User: "hover requires click first" | Tap-dependent | Proper hover + active states |
| 29 | EmailJS integration | User wanted reliable email delivery + receipts | mailto: link | EmailJS send() |
| 30 | Contact section added | User: "we need a Contact option at the top links" | Not present | New section + nav link |
| 31 | Footer email updated | Had placeholder | veronica.samuel.wedding@email.com | vnnatale@gmail.com |

---

## 11. Known Issues & Pending Work

### Must Do
- [ ] **Set up EmailJS account** and enter real credentials (currently has placeholder values)
- [ ] **Permanent hosting** — localtunnel is temporary. Deploy to Netlify, GitHub Pages, or similar
- [ ] **Verify hotel contact info** — phone numbers and websites should be double-checked

### Nice to Have
- [ ] Add reCAPTCHA to forms if spam becomes an issue (unlikely for invitation-only site)
- [ ] Add note to success message: "Check spam folder if you don't see your confirmation email"
- [ ] Consider inline error messages instead of `alert()` for form errors
- [ ] Add loading spinner animation to submit button instead of just text change

### Important Technical Notes
- **Venue SVG rotation:** The watercolor background SVG uses `transform: translate(-50%, -50%) rotate(90deg)` — this is intentional. Do not "fix" it.
- **Countdown target:** `2027-05-29T17:30:00+02:00` (5:30 PM Rome time, CEST)
- **Git repo exists** at `.git/` — initial commit was made this session

---

## 12. Conversation Transcript

The full raw conversation transcript is saved at:

```
/Users/kellyhill/Desktop/Veronica and Sam Wedding/conversation-transcript-2025-02-21.jsonl
```

This is a JSONL (JSON Lines) file — each line is a JSON object representing one message or tool call in the conversation. It is ~29MB and contains the complete, unedited record of every exchange, tool call, code change, and decision made during the session.

To search it for a specific topic:
```bash
grep -i "keyword" conversation-transcript-2025-02-21.jsonl
```

---

## 13. Quick Fix Reference

### Change a color
All CSS variables are at the top of `index.html` (lines 10-28) inside `:root { }`. Change the hex value there and it updates everywhere that variable is used. Hardcoded colors (like `#D8C9A0` for straw gold accents) need to be found and replaced individually — search the file for the hex code.

### Change the wedding date
1. Search `index.html` for `May 29` — update all visible date text
2. Search for `2027-05-29T17:30:00` — update the countdown target in JavaScript
3. Update `README.md` and this documentation

### Change Veronica's email
Search `index.html` for `vnnatale@gmail.com` — it appears in the footer HTML and in the JavaScript error messages. The actual email delivery goes through EmailJS templates (configured in the EmailJS dashboard, not in the code).

### Add or remove a hotel
Search `index.html` for `hotel-card` — each hotel is a `<div class="hotel-card" onclick="toggleHotel(this)">` block. Copy an existing one and modify, or delete the block entirely.

### Add a new nav section
1. Add `<li><a href="#sectionid">Label</a></li>` inside `.nav-links` (desktop)
2. Add `<a href="#sectionid" onclick="closeMenu()">Label</a>` inside `#mobileMenu` (mobile)
3. Add the `<section id="sectionid">` HTML in the right position
4. Add corresponding CSS if needed

### Change the hero photo
Replace `DSC05035.jpg` with a new file, or change the filename in the `<img>` tag inside `.hero-photo` (around line 1202).

### Adjust venue watercolor opacity
Search for `opacity: 0.60` in the venue artwork styles (`.venue-artwork`). Increase = more visible watercolor, decrease = more faded.

### Adjust text glow behind venue text
Search for `text-shadow` in the `#venue` CSS rules. Add or remove glow layers. Format: `0 0 [radius]px rgba(255,255,255,[opacity])`.

### Fix mobile layout issues
Mobile styles are in `@media (max-width: 768px)` block near the end of the CSS. Search for `@media` to find it.

### Run the local server
```bash
cd "/Users/kellyhill/Desktop/Veronica and Sam Wedding"
python3 -m http.server 3000
```
Then open http://localhost:3000 in a browser.

### Start localtunnel for sharing
```bash
lt --port 3000 --subdomain natale-hill-wedding
```
(Requires `npm install -g localtunnel` and the local server running on port 3000)
