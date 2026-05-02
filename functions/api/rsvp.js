// POST /api/rsvp
// Body: {
//   partyId: string,
//   submitter: { firstName, lastName, email, phone? },
//   responses: [{ firstName, lastName, accepted: boolean, dietary?: string }]
// }
// Validates partyId + members against the live guest list (in KV), stores the
// RSVP in KV (binding: RSVPS) keyed by partyId, then fires two notification
// emails via Resend (if RESEND_API_KEY is set as a Pages secret):
//   - Notify Veronica at hello@veronicaandsam2027.com
//   - Confirm back to the submitter's email
// Email sends are best-effort and run via waitUntil — they do NOT gate the
// response, and a Resend failure never causes the save itself to fail.

import { getGuestList } from "../_guests.js";

const norm = (s) => (s || "").trim().toLowerCase();

const json = (status, body) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });

const FROM_ADDRESS = "Veronica & Samuel <hello@veronicaandsam2027.com>";
const NOTIFY_TO = "hello@veronicaandsam2027.com";

const dietLabel = (v) =>
  ({ vegetarian: "Vegetarian", pescatarian: "Pescatarian", "gluten-free": "Gluten-free" }[v] || v);

function buildEmailBody(record) {
  const anyAccept = record.responses.some((r) => r.accepted);
  const lines = [
    "RSVP RESPONSE — Veronica & Samuel Wedding",
    "═".repeat(45),
    "",
    `Submitted by: ${record.submitter.firstName} ${record.submitter.lastName}`,
    `Email: ${record.submitter.email}`,
    `Phone: ${record.submitter.phone || "Not provided"}`,
    "",
    "PARTY RESPONSES",
    "─".repeat(45),
  ];
  for (const r of record.responses) {
    const label = r.accepted ? "Joyfully Accepts" : "Regretfully Declines";
    lines.push(`  • ${r.firstName} ${r.lastName} — ${label}`);
    if (r.accepted && r.dietary) lines.push(`      Dietary: ${dietLabel(r.dietary)}`);
  }
  lines.push("");
  lines.push(`Status: ${anyAccept ? "YES — At least one accept" : "NO — All declined"}`);
  lines.push(`Submitted at: ${record.submittedAt}`);
  return lines.join("\n");
}

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

async function sendRsvpEmails(env, record) {
  if (!env?.RESEND_API_KEY) {
    console.log("RESEND_API_KEY not set; RSVP saved but no emails sent.");
    return;
  }
  const body = buildEmailBody(record);
  const anyAccept = record.responses.some((r) => r.accepted);
  const subject = `Wedding RSVP: ${record.submitter.firstName} ${record.submitter.lastName} — ${
    anyAccept ? "YES" : "DECLINED"
  }`;

  await resendSend(env.RESEND_API_KEY, {
    from: FROM_ADDRESS,
    to: [NOTIFY_TO],
    reply_to: record.submitter.email,
    subject,
    text: body,
  }).catch((err) => console.error("Notify email threw:", err));

  await resendSend(env.RESEND_API_KEY, {
    from: FROM_ADDRESS,
    to: [record.submitter.email],
    reply_to: NOTIFY_TO,
    subject: "Your RSVP Confirmation — Veronica & Samuel Wedding",
    text:
      `Dear ${record.submitter.firstName},\n\n` +
      `Thank you for your RSVP! Here is a copy of what you submitted:\n\n` +
      `${body}\n\n` +
      `If you need to make any changes, please email ${NOTIFY_TO}.\n\n` +
      `With love,\nVeronica & Samuel`,
  }).catch((err) => console.error("Confirm email threw:", err));
}

export async function onRequestPost(context) {
  const { request, env } = context;

  let payload;
  try {
    payload = await request.json();
  } catch {
    return json(400, { error: "Invalid request." });
  }

  const { partyId, submitter, responses } = payload || {};

  if (!partyId || !submitter || !Array.isArray(responses) || responses.length === 0) {
    return json(400, { error: "Missing required fields." });
  }
  if (!submitter.firstName || !submitter.lastName || !submitter.email) {
    return json(400, { error: "Submitter name and email are required." });
  }

  let guestList;
  try {
    guestList = await getGuestList(env);
  } catch (err) {
    return json(503, { error: "Guest list is temporarily unavailable. Please try again." });
  }

  const party = guestList.parties.find((p) => p.id === partyId);
  if (!party) return json(404, { error: "Party not found." });

  const memberSet = new Set(
    party.members.map((m) => `${norm(m.firstName)}|${norm(m.lastName)}`)
  );

  const cleanResponses = [];
  for (const r of responses) {
    const key = `${norm(r.firstName)}|${norm(r.lastName)}`;
    if (!memberSet.has(key)) {
      return json(400, { error: "Response member doesn't belong to this party." });
    }
    const accepted = !!r.accepted;
    const dietary = accepted ? String(r.dietary || "").trim().slice(0, 500) : "";
    cleanResponses.push({
      firstName: r.firstName,
      lastName: r.lastName,
      accepted,
      dietary,
    });
  }

  const record = {
    partyId,
    submittedAt: new Date().toISOString(),
    submitter: {
      firstName: submitter.firstName,
      lastName: submitter.lastName,
      email: submitter.email,
      phone: submitter.phone || "",
    },
    responses: cleanResponses,
  };

  if (env?.RSVPS) {
    try {
      await env.RSVPS.put(partyId, JSON.stringify(record));
    } catch (err) {
      return json(500, { error: "Could not save RSVP. Please try again." });
    }
  } else {
    return json(500, { error: "Storage is not configured. Please contact Veronica." });
  }

  // Fire the two emails in the background; don't make the user wait.
  const emailTask = sendRsvpEmails(env, record).catch((err) =>
    console.error("Email task failed:", err)
  );
  if (typeof context.waitUntil === "function") {
    context.waitUntil(emailTask);
  }

  return json(200, { ok: true });
}

export const onRequest = () => json(405, { error: "Method not allowed." });
