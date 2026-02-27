# Wedding Website Session Notes — February 26, 2026

## Summary
Continued building the wedding website for Veronica Natale & Samuel Hill (May 29, 2027, Villa Mondragone, Italy). This session focused on visual design refinements and adding new sections.

---

## Changes Made This Session

### 1. Hotel/Accommodation Cards — Image Redesign
- Converted all 12 hotel cards (8 Near Venue + 4 Central Rome) to image-on-top design
- Added `<img class="hotel-img">` with Unsplash photos to each card
- CSS: rounded corners, hover lift (`translateY(-4px)`), image zoom on hover (`scale(1.05)`)
- Elegant typography: gold italic type labels, Cormorant Garamond headings

### 2. Footer Image Update
- Swapped footer image from `DSC04665.jpg` to `DSC04655.jpg` (couple embracing under trees)
- Zoomed in: `transform: scale(1.35)` (was `scale(0.75)`)
- Positioned at `object-position: center 68%` to show the couple
- Subtle left-edge gradient blending into charcoal background
- Right-side gradient for text overlay area
- "Made with amore" text bumped to 0.95rem with 0.7 opacity

### 3. RSVP Form — Made Compact
- Form container: max-width 700px → 540px, reduced padding
- Labels: 0.97rem → 0.78rem
- Inputs/selects: smaller padding (0.55rem 0.75rem) and font (0.9rem)
- Section titles: 1.52rem → 1.2rem
- Radio/checkbox buttons: smaller padding and font (0.85rem)
- Guest blocks: reduced padding and header size
- Submit button: smaller (0.75rem padding, 0.88rem font)

### 4. Registry Cards — Made Compact
- Card width: 200px → 160px
- Reduced padding, icon size (2rem → 1.5rem), text sizes

### 5. Photo Gallery — 5-Across Grid
- Converted from horizontal scroll carousel to 5-column CSS grid
- Removed scroll nav arrows
- Image height: 280px, max-width: 1200px
- Mobile: drops to 2-column grid
- 8 placeholder images (need real photos of Veronica & Sam)

### 6. Cleanup
- Removed duplicate `</script>`, `</body>`, `</html>` fragments at end of file
- These were causing raw JS code to render visibly on the page

---

## Current State of Website Sections
1. **Hero** — Full-screen with countdown, engagement photo background
2. **Save the Date** — May 29, 2027
3. **Photo Gallery (Our Story)** — 5-across grid, placeholder images
4. **Schedule** — Timeline of wedding day events
5. **Venue** — Villa Mondragone with info panels
6. **Accommodations** — Tabbed (Near Venue / Central Rome), cards with images
7. **Things to Do (Explore)** — 8 cards with Unsplash images of Rome/Frascati
8. **Travel Tips** — Getting there info
9. **RSVP** — Comprehensive form with EmailJS integration
10. **Registry** — Amazon, Zola, Honeymoon Fund cards
11. **FAQ** — Accordion items
12. **Footer** — DSC04655.jpg with "Veronica & Samuel" overlay

---

## Still Needs Real Content
- **Photo Gallery**: 8 placeholder images need real childhood/couple photos
- **Registry**: Amazon, Zola, and Honeymoon Fund links are placeholders
- **EmailJS**: RSVP form credentials still set to placeholder values
- **Hotel images**: Currently using Unsplash stock photos (could be replaced with actual hotel photos)

---

## Key File
- `/Users/kellyhill/Desktop/Veronica and Sam Wedding/index.html` — Single-file website (HTML + CSS + JS)

## Git
- Commit `92921d3` — "Wedding website: major design overhaul and new sections"
- Branch: `main`
