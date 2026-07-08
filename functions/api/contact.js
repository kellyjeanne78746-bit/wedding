// POST /api/contact
// Body: { name, email, message }
// Stores the message in KV (binding: RSVPS, key prefix "contact:") and emails
// Veronica via Resend (best-effort). Mirrors notify-signup.js exactly.

const json = (status, body) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });

const FROM_ADDRESS = "Veronica & Samuel <hello@veronicaandsam2027.com>";
const NOTIFY_TO = "hello@veronicaandsam2027.com";

async function resendSend(apiKey, payload) {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    console.error(`Resend send failed (${res.status}): ${errText}`);
  }
}

export async function onRequestPost(context) {
  const { request, env } = context;

  let payload;
  try {
    payload = await request.json();
  } catch {
    return json(400, { error: "Invalid request." });
  }

  const name = (payload?.name || "").toString().trim().slice(0, 160);
  const email = (payload?.email || "").toString().trim().slice(0, 160);
  const phone = (payload?.phone || "").toString().trim().slice(0, 40);
  const message = (payload?.message || "").toString().trim().slice(0, 4000);

  if (!name || !email || !message) {
    return json(400, { error: "Name, email, and message are required." });
  }
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return json(400, { error: "Please enter a valid email address." });
  }

  const submittedAt = new Date().toISOString();
  const record = { name, email, phone, message, submittedAt };

  if (env?.RSVPS) {
    try {
      await env.RSVPS.put(`contact:${submittedAt}:${email}`, JSON.stringify(record));
    } catch (err) {
      return json(500, { error: "Could not send your message. Please try again." });
    }
  }

  const emailTask = (async () => {
    if (!env?.RESEND_API_KEY) {
      console.log("RESEND_API_KEY not set; contact saved but no email sent.");
      return;
    }
    await resendSend(env.RESEND_API_KEY, {
      from: FROM_ADDRESS,
      to: [NOTIFY_TO],
      reply_to: email,
      subject: `New contact message from ${name}`,
      text: [
        "NEW CONTACT MESSAGE",
        "═".repeat(45),
        "",
        `Name:  ${name}`,
        `Email: ${email}`,
        `Phone: ${phone || "(not provided)"}`,
        `When:  ${submittedAt}`,
        "",
        "Message:",
        message,
      ].join("\n"),
    }).catch((err) => console.error("Contact email threw:", err));
  })();

  if (typeof context.waitUntil === "function") {
    context.waitUntil(emailTask);
  }

  return json(200, { ok: true });
}

export const onRequest = () => json(405, { error: "Method not allowed." });
