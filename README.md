# Veronica & Samuel Wedding Website

A single-page static HTML wedding website for the Natale-Hill wedding, May 29, 2027 in Rome, Italy.

## Structure

- `index.html` — The entire website (HTML, CSS, and JavaScript in one file)
- `*.jpg` / `*.jpeg` / `*.svg` — Image and illustration assets

## Email System (EmailJS)

The site uses [EmailJS](https://www.emailjs.com/) to send emails directly from the browser without a backend server. Two forms use this system:

1. **RSVP Form** — Sends the full RSVP details to Veronica, and a confirmation receipt to the guest
2. **Contact Form** — Sends a message to Veronica, and a confirmation receipt to the sender

### How It Works

When a visitor submits either form, the JavaScript:
1. Collects and formats all form data into a readable email body
2. Calls `emailjs.send()` twice:
   - Once with the **notification template** → email goes to Veronica (vnnatale@gmail.com)
   - Once with the **confirmation template** → email goes to the person who submitted the form
3. Shows a success message, or an error with fallback instructions (email Veronica directly)

### What the Guest Receives

The RSVP confirmation receipt includes a copy of **everything** the guest submitted:
- Their name, email, phone, country
- Attendance status
- Meal preference and food allergies
- Accessibility needs
- Shuttle and hotel preferences
- Children details (if applicable)
- All additional guest details (names, meals, allergies, accessibility)
- Their personal message

The Contact confirmation receipt includes a copy of their message.

### EmailJS Credentials

Four credentials are needed (stored as JavaScript constants near the top of the `<script>` block in `index.html`):

| Constant | Description | Where to Find |
|----------|-------------|---------------|
| `EMAILJS_PUBLIC_KEY` | Your EmailJS public key | EmailJS Dashboard → Account → General |
| `EMAILJS_SERVICE_ID` | The email service ID | EmailJS Dashboard → Email Services |
| `EMAILJS_TEMPLATE_NOTIFY` | Template ID for notification emails to Veronica | EmailJS Dashboard → Email Templates |
| `EMAILJS_TEMPLATE_CONFIRM` | Template ID for confirmation receipts to sender | EmailJS Dashboard → Email Templates |

These are client-side keys and are safe to include in the HTML. They only allow sending through pre-configured templates.

### EmailJS Setup Steps

1. Create a free account at https://www.emailjs.com/
2. **Add an Email Service**: Connect vnnatale@gmail.com via Gmail integration
   - Go to Email Services → Add New Service → Gmail
   - Authorize with Google → note the **Service ID**
3. **Create Template 1** — "Notification to Veronica":
   - To Email: `vnnatale@gmail.com`
   - From Name: `{{sender_name}}`
   - Reply To: `{{sender_email}}`
   - Subject: `{{subject}}`
   - Body:
     ```
     {{subject}}

     From: {{sender_name}} ({{sender_email}})

     {{message_body}}

     ---
     Sent via the wedding website. Reply directly to {{sender_email}}.
     ```
   - Note the **Template ID**
4. **Create Template 2** — "Confirmation to Sender":
   - To Email: `{{sender_email}}`
   - From Name: `Veronica & Samuel Wedding`
   - Subject: `{{confirm_subject}}`
   - Body:
     ```
     {{confirm_body}}

     ---
     Veronica & Samuel Wedding | May 29, 2027 | Rome, Italy
     ```
   - Note the **Template ID**
5. **Copy credentials into index.html**: Find the four `const` lines near the top of the `<script>` block and replace the placeholder values:
   ```javascript
   const EMAILJS_PUBLIC_KEY = 'your_actual_public_key';
   const EMAILJS_SERVICE_ID = 'your_actual_service_id';
   const EMAILJS_TEMPLATE_NOTIFY = 'your_notify_template_id';
   const EMAILJS_TEMPLATE_CONFIRM = 'your_confirm_template_id';
   ```

### Free Tier Limits

- **200 emails/month** on the free plan
- Each RSVP or Contact submission sends **2 emails** (notification + confirmation)
- This means **~100 form submissions per month** on the free tier
- For a wedding with ~100-150 guests, this should be sufficient if RSVPs come in over several weeks
- If a burst is expected, consider upgrading to the paid tier ($9/month for 1,000 emails)

### Template Variables Reference

Both forms send these parameters to EmailJS:

| Variable | RSVP Value | Contact Value |
|----------|-----------|---------------|
| `form_type` | `"rsvp"` | `"contact"` |
| `sender_name` | Guest's full name | Sender's full name |
| `sender_email` | Guest's email | Sender's email |
| `subject` | `"Wedding RSVP: Name — Status"` | `"Wedding Contact: Name"` |
| `message_body` | Full formatted RSVP details | Formatted contact message |
| `confirm_subject` | `"Your RSVP Confirmation..."` | `"Message Received..."` |
| `confirm_body` | Personalized RSVP receipt | Personalized contact receipt |

## Deployment

This is a static site — upload to any static hosting provider:

- **Netlify**: Drag and drop the folder at netlify.com/drop
- **GitHub Pages**: Push to a repo and enable Pages
- **Vercel**: Import the repo
- **Surge.sh**: Run `surge .` in the project folder
- **Any web server**: Upload all files to the document root

No build step is required. All assets are in the root directory.

## Fonts

Loaded from Google Fonts:
- **Cormorant Garamond** — Headings and decorative text
- **Josefin Sans** — Body text and UI elements
- **Italianno** — Script accents
- **Playfair Display** — Select display text
