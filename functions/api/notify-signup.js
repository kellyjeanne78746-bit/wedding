// POST /api/notify-signup
// Body: { name: string, phone: string }
// Stores the submission in KV (binding: RSVPS, key prefix "notify:") and
// emails Veronica via Resend (best-effort) so she can add the number to her
// manual phone group chat for wedding updates.

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

  const name = (payload?.name || "").toString().trim().slice(0, 120);
  const phone = (payload?.phone || "").toString().trim().slice(0, 40);

  if (!name || !phone) {
    return json(400, { error: "Name and phone number are required." });
  }
  // Loose phone sanity check: must contain at least 7 digits.
  const digitCount = (phone.match(/\d/g) || []).length;
  if (digitCount < 7) {
    return json(400, { error: "Please enter a valid mobile number with country code." });
  }

  const submittedAt = new Date().toISOString();
  const record = { name, phone, submittedAt };

  if (env?.RSVPS) {
    try {
      // Key: notify:<ISO timestamp>:<phone> — keeps each signup distinct.
      await env.RSVPS.put(`notify:${submittedAt}:${phone}`, JSON.stringify(record));
    } catch (err) {
      return json(500, { error: "Could not save your number. Please try again." });
    }
  }

  const emailTask = (async () => {
    if (!env?.RESEND_API_KEY) {
      console.log("RESEND_API_KEY not set; signup saved but no email sent.");
      return;
    }
    await resendSend(env.RESEND_API_KEY, {
      from: FROM_ADDRESS,
      to: [NOTIFY_TO],
      subject: `New wedding-updates signup: ${name}`,
      text: [
        "NEW SIGNUP — Wedding Updates Group",
        "═".repeat(45),
        "",
        `Name:  ${name}`,
        `Phone: ${phone}`,
        `When:  ${submittedAt}`,
        "",
        "Add this number to the wedding-updates text group on your phone.",
      ].join("\n"),
    }).catch((err) => console.error("Notify email threw:", err));
  })();

  if (typeof context.waitUntil === "function") {
    context.waitUntil(emailTask);
  }

  return json(200, { ok: true });
}

export const onRequest = () => json(405, { error: "Method not allowed." });
