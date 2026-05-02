// Reads the guest list from the GUESTS KV binding (key: "list").
// The canonical source is /functions/guests.json; `npm run sync-guests` (run
// automatically by `npm run deploy`) copies that file into KV before each
// deploy. Handlers must call this INSIDE their request function — not at
// module scope — because Pages Functions disallows runtime APIs in global
// scope ("Disallowed operation called within global scope").
//
// Files prefixed with "_" inside /functions/ are not routed by Pages, so this
// helper is reachable only via import.

export async function getGuestList(env) {
  if (!env || !env.GUESTS) {
    throw new Error("Guest list KV binding (GUESTS) is not configured.");
  }
  const data = await env.GUESTS.get("list", "json");
  if (!data || !Array.isArray(data.parties)) {
    throw new Error(
      "Guest list is empty or malformed in KV. Run `npm run sync-guests` to seed it from functions/guests.json."
    );
  }
  return data;
}
