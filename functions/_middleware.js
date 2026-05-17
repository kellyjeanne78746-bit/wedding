// Site-wide passcode gate. Runs SERVER-SIDE before any HTML, asset, or API
// route is served (Cloudflare Pages routes a top-level functions/_middleware.js
// in front of every request, including static-asset requests).
//
// Auth model:
//   - Shared passcode stored as the SITE_PASSCODE secret (NEVER in source).
//   - On submit, we set an HttpOnly cookie containing SHA-256(passcode + salt).
//   - On every subsequent request, middleware recomputes the expected hash
//     from SITE_PASSCODE and compares constant-time. If the passcode is
//     rotated, all existing cookies become invalid automatically.
//
// To set or rotate the passcode:
//   npx wrangler pages secret put SITE_PASSCODE
//   (or set it under Pages → Settings → Environment variables in the dashboard)
// For local development, put `SITE_PASSCODE=<value>` in `.dev.vars`.

const COOKIE_NAME = "vsw_gate";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days
const SALT = "vsw-gate-v1";

const GATE_LOGIN_PATH = "/__gate/login";

async function expectedToken(passcode) {
  const data = new TextEncoder().encode(`${passcode}::${SALT}`);
  const buf = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function readCookie(request, name) {
  const header = request.headers.get("cookie") || "";
  const match = header.match(new RegExp(`(?:^|;\\s*)${name}=([^;]+)`));
  return match ? match[1] : null;
}

function timingSafeEqual(a, b) {
  if (typeof a !== "string" || typeof b !== "string" || a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}

function gatePage(errorMessage, prefillEmail) {
  const errorHtml = errorMessage
    ? `<p class="gate-error">${errorMessage}</p>`
    : "";
  const emailValue = prefillEmail
    ? ` value="${String(prefillEmail).replace(/"/g, "&quot;")}"`
    : "";
  const body = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Veronica &amp; Samuel &mdash; We are getting married in Italy!</title>
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=EB+Garamond:ital,wght@0,400;0,500;1,400;1,500&family=Monsieur+La+Doulaise&display=swap" rel="stylesheet">
  <style>
    html, body { margin: 0; padding: 0; min-height: 100vh; }
    body {
      background: #EAE0D4;
      color: #B17F5F;
      font-family: 'EB Garamond', 'Times New Roman', serif;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 32px 24px;
      box-sizing: border-box;
    }
    .gate-card {
      background: transparent;
      border: none;
      box-shadow: none;
      max-width: 1240px;
      width: 100%;
      padding: 0;
      text-align: center;
      box-sizing: border-box;
    }
    .gate-title {
      font-family: 'Monsieur La Doulaise', 'EB Garamond', cursive;
      font-size: clamp(1.4rem, 7.5vw, 6.5rem);
      color: #B17F5F;
      margin: 0 0 80px;
      padding: 0.4em 0;
      font-weight: 400;
      line-height: 1.7;
      letter-spacing: 0.12em;
      white-space: nowrap;
      overflow: visible;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
      text-rendering: geometricPrecision;
    }
    .field {
      max-width: 440px;
      margin: 0 auto 18px;
      padding: 6px 0;
      border-bottom: 1px solid #D6C4B0;
    }
    .field input {
      width: 100%;
      border: 0;
      background: transparent;
      padding: 12px 4px;
      font-family: 'EB Garamond', serif;
      font-style: italic;
      font-size: clamp(1.1rem, 1.6vw, 1.35rem);
      color: #B17F5F;
      text-align: center;
      letter-spacing: 0.02em;
      box-sizing: border-box;
    }
    .field input::placeholder { color: #B17F5F; opacity: 0.95; font-style: italic; }
    .field input:focus { outline: none; }
    .field:focus-within { border-bottom-color: #9C6A4D; }
    button {
      margin-top: 36px;
      padding: 14px 56px;
      font-family: 'EB Garamond', serif;
      font-style: italic;
      font-size: 1.05rem;
      letter-spacing: 0.06em;
      color: #FBF6EF;
      background: linear-gradient(135deg, #B5805F 0%, #D9A175 50%, #B5805F 100%);
      border: 0;
      border-radius: 999px;
      cursor: pointer;
      box-shadow: 0 4px 14px rgba(156, 106, 77, 0.22);
      transition: filter 0.18s ease, transform 0.18s ease;
    }
    button:hover { filter: brightness(1.05); transform: translateY(-1px); }
    button:active { transform: translateY(0); }
    .gate-error {
      max-width: 540px;
      margin: 0 auto 24px;
      color: #9C4F3A;
      font-style: italic;
      font-size: 1rem;
    }
  </style>
</head>
<body>
  <form class="gate-card" method="POST" action="${GATE_LOGIN_PATH}">
    <h1 class="gate-title">We are getting married!</h1>
    ${errorHtml}
    <!-- EMAIL FIELD TEMPORARILY DISABLED (kept here for easy re-enable when guest emails are collected).
         To re-enable: remove the surrounding HTML comment around this <div class="field"> block. -->
    <!--
    <div class="field">
      <input id="email" name="email" type="email" autocomplete="email" placeholder="Enter your email address to access information" aria-label="Email address"${emailValue}>
    </div>
    -->
    <div class="field">
      <input id="passcode" name="passcode" type="password" autocomplete="off" placeholder="Please enter password to access site" aria-label="Password" required>
    </div>
    <button type="submit">Click to see details</button>
  </form>
</body>
</html>`;
  return new Response(body, {
    status: 200,
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}

export async function onRequest(context) {
  const { request, env, next } = context;
  const url = new URL(request.url);
  const path = url.pathname;

  if (!env.SITE_PASSCODE) {
    return new Response(
      "Site is not yet configured. The administrator must set the SITE_PASSCODE secret.",
      { status: 503, headers: { "content-type": "text/plain; charset=utf-8" } }
    );
  }

  // Handle the gate's own login submission.
  if (path === GATE_LOGIN_PATH) {
    if (request.method !== "POST") {
      return new Response(null, { status: 303, headers: { location: "/" } });
    }
    let email = "";
    let submitted = "";
    try {
      const form = await request.formData();
      email = (form.get("email") || "").toString().trim().slice(0, 200);
      submitted = (form.get("passcode") || "").toString();
    } catch {
      return gatePage("Something went wrong. Please try again.");
    }

    // Email is OPTIONAL for now — the email-gate flow isn't fully wired yet.
    // If provided, validate the format loosely; if blank, just let it pass.
    if (email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      return gatePage("Please enter a valid email address (or leave it blank).", email);
    }

    if (timingSafeEqual(submitted, env.SITE_PASSCODE)) {
      // Best-effort log of the email (only if one was supplied) so the couple
      // can see who's accessed the site. KV write must NOT block access if it
      // fails — wrapped in try/catch.
      if (email && env?.RSVPS) {
        try {
          const when = new Date().toISOString();
          await env.RSVPS.put(
            `gate:${when}:${email.slice(0, 80)}`,
            JSON.stringify({
              email,
              when,
              userAgent: (request.headers.get("user-agent") || "").slice(0, 300),
            })
          );
        } catch (err) {
          console.error("Gate email log failed:", err);
        }
      }

      const token = await expectedToken(env.SITE_PASSCODE);
      const secureFlag = url.protocol === "https:" ? " Secure;" : "";
      const cookie = `${COOKIE_NAME}=${token}; Path=/; Max-Age=${COOKIE_MAX_AGE}; HttpOnly;${secureFlag} SameSite=Lax`;
      return new Response(null, {
        status: 303,
        headers: { location: "/", "set-cookie": cookie },
      });
    }
    return gatePage("That passcode wasn't right. Please check your invitation and try again.", email);
  }

  // Authed requests pass through to the static asset / route handler.
  const cookie = readCookie(request, COOKIE_NAME);
  if (cookie) {
    const expected = await expectedToken(env.SITE_PASSCODE);
    if (timingSafeEqual(cookie, expected)) {
      return next();
    }
  }

  // Unauthed: APIs get JSON 401, everything else gets the gate page.
  if (path.startsWith("/api/")) {
    return new Response(JSON.stringify({ error: "Authentication required." }), {
      status: 401,
      headers: { "content-type": "application/json; charset=utf-8" },
    });
  }
  return gatePage();
}
