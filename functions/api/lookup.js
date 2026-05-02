// POST /api/lookup
// Body: { firstName, lastName }  OR  { email }
// Returns: { partyId, members: [{ firstName, lastName }] }
// On no match: 404 with a generic message — does NOT reveal whether the
// identifier exists in our list (so the endpoint can't be used as a scraper).

import { getGuestList } from "../_guests.js";

const norm = (s) => (s || "").trim().toLowerCase();

const json = (status, body) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });

export async function onRequestPost({ request, env }) {
  let payload;
  try {
    payload = await request.json();
  } catch {
    return json(400, { error: "Invalid request." });
  }

  const firstName = norm(payload.firstName);
  const lastName = norm(payload.lastName);
  const email = norm(payload.email);

  if (!email && !(firstName && lastName)) {
    return json(400, { error: "Please provide a name or email." });
  }

  let guestList;
  try {
    guestList = await getGuestList(env);
  } catch (err) {
    return json(503, { error: "Guest list is temporarily unavailable. Please try again." });
  }

  const match = guestList.parties.find((p) =>
    (p.members || []).some((m) => {
      if (email) return norm(m.email) === email;
      return norm(m.firstName) === firstName && norm(m.lastName) === lastName;
    })
  );

  if (!match) {
    return json(404, {
      error:
        "We couldn't find that on our guest list. Please double-check the spelling, or contact Veronica.",
    });
  }

  return json(200, {
    partyId: match.id,
    members: match.members.map((m) => ({
      firstName: m.firstName,
      lastName: m.lastName,
    })),
  });
}

export const onRequest = () => json(405, { error: "Method not allowed." });
