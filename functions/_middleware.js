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

function gatePage(errorMessage) {
  const errorHtml = errorMessage
    ? `<p class="gate-error">${errorMessage}</p>`
    : "";
  const body = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Veronica &amp; Samuel — Save the Date</title>
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600&family=Italiana&display=swap" rel="stylesheet">
  <style>
    html, body { margin: 0; padding: 0; min-height: 100vh; }
    body {
      background: #FBF8F1;
      color: #3a2e1f;
      font-family: 'Cormorant Garamond', 'Times New Roman', serif;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 24px;
      box-sizing: border-box;
    }
    .gate-card {
      background: #ffffff;
      border: 1px solid #E8C87A;
      border-radius: 6px;
      max-width: 440px;
      width: 100%;
      padding: 48px 36px 40px;
      box-shadow: 0 8px 32px rgba(60, 40, 10, 0.08);
      text-align: center;
      box-sizing: border-box;
    }
    .gate-ornament {
      font-size: 22px;
      letter-spacing: 0.6em;
      color: #C9A961;
      margin: 0 0 14px;
    }
    .gate-title {
      font-family: 'Italiana', 'Cormorant Garamond', serif;
      font-size: 34px;
      letter-spacing: 0.06em;
      color: #8a6f3f;
      margin: 0 0 4px;
      font-weight: 400;
    }
    .gate-sub {
      font-size: 13px;
      letter-spacing: 0.32em;
      text-transform: uppercase;
      color: #6b5a3a;
      margin: 0 0 28px;
    }
    .gate-msg {
      font-size: 17px;
      line-height: 1.5;
      margin: 0 0 26px;
      color: #4a3d28;
    }
    label {
      display: block;
      font-size: 11px;
      letter-spacing: 0.24em;
      text-transform: uppercase;
      color: #6b5a3a;
      margin: 0 0 10px;
      text-align: left;
    }
    input[type="password"] {
      width: 100%;
      padding: 14px 16px;
      font-size: 18px;
      font-family: inherit;
      letter-spacing: 0.08em;
      border: 1px solid #d8c8a3;
      border-radius: 3px;
      background: #fdfaf3;
      box-sizing: border-box;
      color: #3a2e1f;
    }
    input[type="password"]:focus { outline: none; border-color: #8a6f3f; box-shadow: 0 0 0 2px rgba(201,169,97,0.18); }
    button {
      margin-top: 22px;
      width: 100%;
      padding: 15px 18px;
      font-size: 12px;
      letter-spacing: 0.28em;
      text-transform: uppercase;
      background: #8a6f3f;
      color: #fff;
      border: 0;
      border-radius: 3px;
      cursor: pointer;
      font-family: inherit;
      transition: background 0.18s ease;
    }
    button:hover { background: #6b5a3a; }
    .gate-error {
      color: #a23b3b;
      font-size: 14px;
      margin: -8px 0 18px;
    }
  </style>
</head>
<body>
  <form class="gate-card" method="POST" action="${GATE_LOGIN_PATH}">
    <div class="gate-ornament">&#10086; &#10086; &#10086;</div>
    <h1 class="gate-title">Veronica &amp; Samuel</h1>
    <p class="gate-sub">Save the Date</p>
    <p class="gate-msg">Please enter the passcode from your invitation to view our wedding website.</p>
    ${errorHtml}
    <label for="passcode">Passcode</label>
    <input id="passcode" name="passcode" type="password" autocomplete="off" autofocus required>
    <button type="submit">Enter</button>
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
    let submitted = "";
    try {
      const form = await request.formData();
      submitted = (form.get("passcode") || "").toString();
    } catch {
      return gatePage("Something went wrong. Please try again.");
    }
    if (timingSafeEqual(submitted, env.SITE_PASSCODE)) {
      const token = await expectedToken(env.SITE_PASSCODE);
      const secureFlag = url.protocol === "https:" ? " Secure;" : "";
      const cookie = `${COOKIE_NAME}=${token}; Path=/; Max-Age=${COOKIE_MAX_AGE}; HttpOnly;${secureFlag} SameSite=Lax`;
      return new Response(null, {
        status: 303,
        headers: { location: "/", "set-cookie": cookie },
      });
    }
    return gatePage("That passcode wasn't right. Please check your invitation and try again.");
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
