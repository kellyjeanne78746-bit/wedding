// The guest list is bundled directly into the deployed worker at build time
// (esbuild inlines the JSON import). functions/guests.json is the single
// source of truth — editing it and deploying updates the live site in one
// step, with no separate KV sync needed.
//
// Trade-off vs the previous KV approach: updating the guest list now requires
// a redeploy. For a wedding site this is fine and removes the laptop-bound
// `wrangler kv key put` step.
//
// Files prefixed with "_" inside /functions/ are not routed by Pages, so this
// helper is reachable only via import. JSON files in /functions/ are not
// routed either, so guests.json is never served to a browser.

import guestList from "./guests.json";

export async function getGuestList(_env) {
  if (!guestList || !Array.isArray(guestList.parties)) {
    throw new Error(
      "Guest list is empty or malformed. Check functions/guests.json for JSON syntax errors."
    );
  }
  return guestList;
}
