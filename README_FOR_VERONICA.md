# Wedding Website — How to Edit & Deploy

Hi Veronica! This is the cheat sheet for everything you might need to do.
You can do all of it from the Terminal app on your Mac. **Open Terminal, then
run this once at the start of each session so you're in the right folder:**

```
cd "/Users/kellyhill/Desktop/Veronica and Sam Wedding"
```

(Every command below assumes you're already in that folder.)

---

## One-time setup (only needed once, ever)

Skip this section if Kelly has already done it.

1. **Install Node.js** (one-time): https://nodejs.org → download "LTS".
2. **Install Wrangler & log in:**
   ```
   npm install
   npx wrangler login
   ```
   This opens a browser window; sign in with the Cloudflare account that owns
   the wedding site.
3. **Create the two KV namespaces** (one stores the guest list, the other
   stores RSVPs):
   ```
   npx wrangler kv namespace create GUESTS
   npx wrangler kv namespace create GUESTS --preview
   npx wrangler kv namespace create RSVPS
   npx wrangler kv namespace create RSVPS --preview
   ```
   Each command prints an `id`. Open `wrangler.toml` in TextEdit and paste
   each `id` in the matching `id =` / `preview_id =` slot.
4. **Set the site passcode** (the one guests will type to enter the site):
   ```
   npx wrangler pages secret put SITE_PASSCODE
   ```
   It will prompt you to type the passcode. Pick something you'll share with
   guests on the invitation, e.g. `forever-and-always`.

---

## Editing the guest list

The guest list lives in **one file only**: `functions/guests.json`.

1. Open `functions/guests.json` in TextEdit.
2. Each "household" is one entry under `"parties"`. Add, remove, or change
   names there. Whoever RSVPs will answer for everyone in their household.
3. Save the file.
4. In Terminal, run:
   ```
   npm run deploy
   ```
   That uploads the updated guest list AND publishes the site in one step.

**Format example** (already in the file as a starter):

```json
{
  "parties": [
    {
      "id": "smith-family",
      "members": [
        { "firstName": "John", "lastName": "Smith" },
        { "firstName": "Jane", "lastName": "Smith" }
      ]
    }
  ]
}
```

Rules:
- Every household needs a unique `id` (any short label works — e.g.
  `smith-family`, `aunt-mary`, `college-roommates`). The id is just used
  internally to file their RSVP — guests never see it.
- `firstName` and `lastName` matching is case-insensitive ("kelly" matches
  "Kelly").
- Keep the JSON punctuation exactly as shown — every `{`, `}`, `[`, `]`, and
  `,` matters. If `npm run deploy` complains, you probably have a stray comma
  or missing quote.

---

## Changing the passcode

Run:

```
npx wrangler pages secret put SITE_PASSCODE
```

Type the new passcode when prompted. That's it — no redeploy needed. Anyone
who already entered the old passcode will be asked for the new one the next
time they visit (their saved cookie becomes invalid automatically).

---

## Editing the page itself

The website is a single file: `index.html`. Open it in TextEdit, change wording
or photos, save, then run:

```
npm run deploy
```

Photos referenced in `index.html` need to exist inside `deploy/public/` (or
`deploy/public/images/`). To add a new photo: drop the file into
`deploy/public/images/`, then reference it in `index.html` like
`<img src="images/your-photo.jpg">`.

---

## Reading submitted RSVPs

```
npx wrangler kv key list --binding=RSVPS --remote
```

That lists every party that has RSVP'd (one per household id). To read a
specific one:

```
npx wrangler kv key get --binding=RSVPS --remote smith-family
```

(Replace `smith-family` with the `id` from `functions/guests.json`.)

You'll also still get an email via EmailJS each time someone RSVPs — KV is
just the durable backup.

---

## Testing locally before deploying

1. Copy `.dev.vars.example` to `.dev.vars` and put a test passcode in it
   (any string is fine — only used locally).
2. Seed your local guest list:
   ```
   npm run sync-guests:local
   ```
3. Start the local server:
   ```
   npm run dev
   ```
4. Open http://127.0.0.1:8788. You'll see the passcode page first; enter the
   one from `.dev.vars` to view the site.

When you're happy, deploy with `npm run deploy`.

---

## Quick reference

| Task                         | Command                                      |
|------------------------------|----------------------------------------------|
| Edit + publish guest list    | edit `functions/guests.json`, `npm run deploy` |
| Edit + publish the page      | edit `index.html`, `npm run deploy`          |
| Change the passcode          | `npx wrangler pages secret put SITE_PASSCODE` |
| List submitted RSVPs         | `npx wrangler kv key list --binding=RSVPS --remote` |
| Read one RSVP                | `npx wrangler kv key get --binding=RSVPS --remote <party-id>` |
| Test locally                 | `npm run dev`                                |

---

## Where things live

```
.
├── README_FOR_VERONICA.md     ← you are here
├── index.html                 ← the website itself (edit text/photos here)
├── functions/                 ← server-side code (runs in Cloudflare's cloud)
│   ├── guests.json            ← THE GUEST LIST — edit this in TextEdit
│   ├── _guests.js             ← internal helper (don't edit)
│   ├── _middleware.js         ← passcode gate (don't edit unless changing styling)
│   └── api/                   ← lookup + RSVP handlers (don't edit)
├── deploy/public/             ← what gets uploaded — only static page assets
├── wrangler.toml              ← Cloudflare config (KV ids live here)
├── package.json               ← npm scripts
└── .dev.vars                  ← local-only secret (NEVER commit)
```

The website you deploy lives in `deploy/public/`. The guest list and passcode
gate live in `functions/` and never end up in `deploy/public/` — meaning a
visitor's browser can never download the guest list, no matter what URL they
try.

---

## If something goes wrong

- "**Disallowed operation**" or any deploy error → run `npm run deploy` again.
  If it fails twice in a row, check `functions/guests.json` for typos
  (missing comma, unclosed bracket).
- "**Authentication required**" / **passcode page won't accept anything** →
  the `SITE_PASSCODE` secret may not be set. Run
  `npx wrangler pages secret put SITE_PASSCODE`.
- "**Guest list temporarily unavailable**" → the GUESTS KV is empty. Run
  `npm run sync-guests` (or `npm run deploy`).
- Anything else → text Kelly.
