// Read-only RSVP view for wedding planners.
//
// HOW THIS IS LOCKED DOWN:
//   - GET-only by construction (no onRequestPost/Put/Delete exported).
//   - Middleware allow-lists `/planners` so the site passcode is NOT what
//     guards this page.
//   - Host-allowlist: in production this page is served ONLY from the
//     planners.veronicaandsam2027.com subdomain, which is locked behind
//     Cloudflare Access (email + one-time PIN). Requests on the main
//     wedding domain return 404. Defense in depth — Access is the real lock.
//   - Localhost is allowed for wrangler dev preview.
//
// DATA MODEL:
//   - functions/guests.json — the master invite list (76 households, 142
//     people). Loaded via getGuestList().
//   - env.RSVPS KV namespace — one record per partyId; submitter overwrites
//     on resubmission (no history). Keys look like "household-N".
//   - This page joins the two: it shows every invited household, cross-
//     references with any submitted RSVP, and surfaces who is still missing.

import { getGuestList } from "./_guests.js";

const PRODUCTION_HOSTS = new Set(["planners.veronicaandsam2027.com"]);

function escapeHtml(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function isAllowedHost(hostHeader) {
  if (!hostHeader) return false;
  const host = hostHeader.toLowerCase().split(":")[0];
  if (host === "localhost" || host === "127.0.0.1") return true;
  return PRODUCTION_HOSTS.has(host);
}

function formatDate(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d)) return iso;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function titleCase(s) {
  return String(s ?? "")
    .trim()
    .split(/\s+/)
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1).toLowerCase() : ""))
    .join(" ");
}

const norm = (s) => (s || "").trim().toLowerCase();

async function loadRsvpMap(env) {
  const map = new Map();
  let cursor;
  do {
    const list = await env.RSVPS.list({ prefix: "household-", cursor });
    for (const k of list.keys) {
      const rec = await env.RSVPS.get(k.name, "json");
      if (rec) map.set(rec.partyId || k.name, rec);
    }
    cursor = list.list_complete ? undefined : list.cursor;
  } while (cursor);
  return map;
}

function householdLabel(party) {
  const members = party.members || [];
  if (!members.length) return party.id;
  const lasts = new Set(members.map((m) => norm(m.lastName)));
  if (lasts.size === 1) {
    const firsts = members.map((m) => titleCase(m.firstName)).join(", ");
    const last = titleCase(members[0].lastName);
    return `${firsts} ${last}`;
  }
  return members
    .map((m) => `${titleCase(m.firstName)} ${titleCase(m.lastName)}`)
    .join(" & ");
}

// Per-member status: accepted | declined | missing (invited but not in the
// submission's responses) | unanswered (no submission for this household)
function statusForMember(member, rsvp) {
  if (!rsvp) return "unanswered";
  const key = `${norm(member.firstName)}|${norm(member.lastName)}`;
  const hit = (rsvp.responses || []).find(
    (r) => `${norm(r.firstName)}|${norm(r.lastName)}` === key
  );
  if (!hit) return "missing";
  return hit.accepted ? "accepted" : "declined";
}

function dietaryForMember(member, rsvp) {
  if (!rsvp) return "";
  const key = `${norm(member.firstName)}|${norm(member.lastName)}`;
  const hit = (rsvp.responses || []).find(
    (r) => `${norm(r.firstName)}|${norm(r.lastName)}` === key
  );
  return hit?.dietary || "";
}

function householdBucket(party, rsvp) {
  if (!rsvp) return "unanswered";
  const accepted = (rsvp.responses || []).some((r) => r.accepted === true);
  const anyDeclined = (rsvp.responses || []).some((r) => r.accepted === false);
  if (accepted) return "accepted";
  if (anyDeclined) return "declined";
  return "unanswered";
}

function computeSummary(parties, rsvpMap) {
  let totalPeople = 0;
  let peopleAccepted = 0;
  let peopleDeclined = 0;
  let peopleUnanswered = 0;
  let households = { accepted: 0, declined: 0, unanswered: 0 };
  const dietary = {};

  for (const party of parties) {
    const rsvp = rsvpMap.get(party.id);
    households[householdBucket(party, rsvp)]++;
    for (const m of party.members || []) {
      totalPeople++;
      const s = statusForMember(m, rsvp);
      if (s === "accepted") peopleAccepted++;
      else if (s === "declined") peopleDeclined++;
      else peopleUnanswered++;
      const d = dietaryForMember(m, rsvp);
      const note = (d || "").trim().toLowerCase();
      if (note) dietary[note] = (dietary[note] || 0) + 1;
    }
  }
  return {
    totalHouseholds: parties.length,
    totalPeople,
    peopleAccepted,
    peopleDeclined,
    peopleUnanswered,
    householdsAccepted: households.accepted,
    householdsDeclined: households.declined,
    householdsUnanswered: households.unanswered,
    dietary,
  };
}

function buildCsvRows(parties, rsvpMap) {
  const rows = [];
  for (const party of parties) {
    const rsvp = rsvpMap.get(party.id);
    const submitterName = rsvp
      ? titleCase(`${rsvp.submitter?.firstName || ""} ${rsvp.submitter?.lastName || ""}`).trim()
      : "";
    const submittedAt = rsvp ? formatDate(rsvp.submittedAt) : "";
    for (const m of party.members || []) {
      const s = statusForMember(m, rsvp);
      rows.push({
        "Household ID": party.id,
        "Household Label": householdLabel(party),
        "Guest First Name": titleCase(m.firstName || ""),
        "Guest Last Name": titleCase(m.lastName || ""),
        "Guest Invite Email": m.email || "",
        "Status": s === "accepted" ? "Accepted" : s === "declined" ? "Declined" : s === "missing" ? "Missing from submission" : "Unanswered",
        "Dietary": dietaryForMember(m, rsvp) || "",
        "Submitted By Name": submitterName,
        "Submitted By Email": rsvp?.submitter?.email || "",
        "Submitted By Phone": rsvp?.submitter?.phone || "",
        "Submitted At": submittedAt,
      });
    }
  }
  return rows;
}

function statusBadge(s) {
  if (s === "accepted") return `<span class="badge yes">Accepted</span>`;
  if (s === "declined") return `<span class="badge no">Declined</span>`;
  if (s === "missing") return `<span class="badge missing">Missing from submission</span>`;
  return `<span class="badge none">Unanswered</span>`;
}

function renderHouseholdCard(party, rsvp) {
  const bucket = householdBucket(party, rsvp);
  const label = householdLabel(party);
  const memberCount = (party.members || []).length;

  let auditLine = "";
  if (rsvp) {
    const sName = titleCase(`${rsvp.submitter?.firstName || ""} ${rsvp.submitter?.lastName || ""}`).trim() || "—";
    const sEmail = rsvp.submitter?.email || "—";
    const sPhone = rsvp.submitter?.phone || "—";
    const sDate = formatDate(rsvp.submittedAt) || "—";
    auditLine = `
      <div class="audit">
        <div class="audit-email">${escapeHtml(sEmail)}</div>
        <div class="audit-meta">
          Submitted by <strong>${escapeHtml(sName)}</strong>
          <span class="dot">•</span>${escapeHtml(sPhone)}
          <span class="dot">•</span>${escapeHtml(sDate)}
        </div>
      </div>`;
  } else {
    auditLine = `<div class="audit none"><div class="audit-meta muted">No RSVP submitted yet.</div></div>`;
  }

  const peopleRows = (party.members || [])
    .map((m) => {
      const s = statusForMember(m, rsvp);
      const name = titleCase(`${m.firstName || ""} ${m.lastName || ""}`).trim() || "—";
      const dietary = dietaryForMember(m, rsvp);
      const dietaryCell = dietary ? escapeHtml(dietary) : `<span class="muted">—</span>`;
      const inviteEmail = m.email ? escapeHtml(m.email) : `<span class="muted">—</span>`;
      return `
        <tr>
          <td>${escapeHtml(name)}</td>
          <td>${statusBadge(s)}</td>
          <td>${dietaryCell}</td>
          <td class="invite-email">${inviteEmail}</td>
        </tr>`;
    })
    .join("");

  return `
    <section class="group" data-bucket="${bucket}">
      <header class="group-head">
        <div class="group-title">
          <span class="household-label">${escapeHtml(label)}</span>
          <span class="member-count">${memberCount} invited</span>
        </div>
        ${auditLine}
      </header>
      <table class="people">
        <thead>
          <tr><th>Guest</th><th>Status</th><th>Dietary</th><th>Invite Email</th></tr>
        </thead>
        <tbody>${peopleRows}</tbody>
      </table>
    </section>`;
}

function renderHtml(parties, rsvpMap) {
  const summary = computeSummary(parties, rsvpMap);
  const csvData = buildCsvRows(parties, rsvpMap);
  const safeJson = JSON.stringify(csvData).replace(/</g, "\\u003c");

  const dietaryList = Object.entries(summary.dietary)
    .sort((a, b) => b[1] - a[1])
    .map(([k, v]) => `<li>${escapeHtml(k)}: <strong>${v}</strong></li>`)
    .join("");

  // Sort households: unanswered first (planners need to chase these), then
  // accepted, then declined. Within each bucket, alphabetize by label.
  const bucketOrder = { unanswered: 0, accepted: 1, declined: 2 };
  const sorted = [...parties].sort((a, b) => {
    const ba = householdBucket(a, rsvpMap.get(a.id));
    const bb = householdBucket(b, rsvpMap.get(b.id));
    if (bucketOrder[ba] !== bucketOrder[bb]) return bucketOrder[ba] - bucketOrder[bb];
    return householdLabel(a).localeCompare(householdLabel(b));
  });

  const groupsHtml = sorted.map((p) => renderHouseholdCard(p, rsvpMap.get(p.id))).join("");

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Wedding RSVPs — Planner View</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600&family=EB+Garamond:wght@400;500&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg: #FAF5EE;
      --card: #FFFFFF;
      --line: #E6DCCB;
      --copper: #8a5a3e;
      --copper-light: #B17F5F;
      --text: #4a3a2e;
      --muted: #9a8c7d;
      --yes: #4a7c46;
      --no: #a85c4a;
      --warn: #b88a2c;
      --accent: #F2EDE5;
    }
    * { box-sizing: border-box; }
    html, body { margin: 0; padding: 0; }
    body {
      background: var(--bg);
      color: var(--text);
      font-family: 'EB Garamond', Georgia, serif;
      font-size: 16px;
      line-height: 1.5;
      padding: 2rem 1.5rem 4rem;
    }
    .wrap { max-width: 1200px; margin: 0 auto; }
    h1 {
      font-family: 'Cormorant Garamond', Georgia, serif;
      font-size: clamp(1.75rem, 3.5vw, 2.5rem);
      color: var(--copper);
      margin: 0 0 0.25rem;
      font-weight: 500;
      letter-spacing: 0.01em;
    }
    .subtitle {
      color: var(--muted);
      font-style: italic;
      margin: 0 0 1.5rem;
      font-size: 1rem;
    }
    .summary {
      background: var(--accent);
      border: 1px solid var(--line);
      border-radius: 8px;
      padding: 1.25rem 1.5rem;
      margin-bottom: 1.5rem;
    }
    .summary-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 1rem 1.5rem;
    }
    .stat .label {
      display: block;
      font-size: 0.72rem;
      text-transform: uppercase;
      letter-spacing: 0.15em;
      color: var(--muted);
      margin-bottom: 0.15rem;
    }
    .stat .value {
      font-family: 'Cormorant Garamond', serif;
      font-size: 1.75rem;
      color: var(--copper);
      font-weight: 500;
    }
    .stat .sub { font-size: 0.8rem; color: var(--muted); font-style: italic; }
    .dietary-list {
      list-style: none;
      padding: 0;
      margin: 0.25rem 0 0;
      font-size: 0.95rem;
    }
    .dietary-list li { padding: 0.1rem 0; }
    .toolbar {
      display: flex;
      gap: 0.5rem;
      margin-bottom: 1.5rem;
      flex-wrap: wrap;
      align-items: center;
    }
    .filters {
      display: flex;
      gap: 0.4rem;
      flex-wrap: wrap;
    }
    .filter-btn {
      font-family: 'EB Garamond', serif;
      font-size: 0.92rem;
      padding: 0.42rem 1.05rem;
      border: 1px solid var(--copper-light);
      background: transparent;
      color: var(--copper);
      border-radius: 999px;
      cursor: pointer;
      transition: all 0.18s ease;
      letter-spacing: 0.02em;
    }
    .filter-btn:hover { background: rgba(177, 127, 95, 0.08); }
    .filter-btn.active {
      background: linear-gradient(135deg, #B5805F 0%, #D9A175 50%, #B5805F 100%);
      color: #FBF6EF;
      border-color: transparent;
    }
    .filter-btn .count { font-size: 0.78rem; opacity: 0.8; margin-left: 0.3rem; }
    button.csv-btn {
      margin-left: auto;
      font-family: 'EB Garamond', serif;
      font-style: italic;
      font-size: 0.95rem;
      padding: 0.5rem 1.4rem;
      border: 0;
      border-radius: 999px;
      background: linear-gradient(135deg, #B5805F 0%, #D9A175 50%, #B5805F 100%);
      color: #FBF6EF;
      cursor: pointer;
      box-shadow: 0 3px 10px rgba(156, 106, 77, 0.18);
    }
    button.csv-btn:hover { filter: brightness(1.05); }
    .group {
      background: var(--card);
      border: 1px solid var(--line);
      border-radius: 8px;
      margin-bottom: 1rem;
      overflow: hidden;
    }
    .group-head {
      background: var(--accent);
      padding: 0.85rem 1.25rem;
      border-bottom: 1px solid var(--line);
    }
    .group-title {
      display: flex;
      align-items: baseline;
      gap: 0.75rem;
      flex-wrap: wrap;
    }
    .household-label {
      font-family: 'Cormorant Garamond', serif;
      font-size: 1.2rem;
      color: var(--copper);
      font-weight: 500;
    }
    .member-count {
      font-size: 0.78rem;
      color: var(--muted);
      text-transform: uppercase;
      letter-spacing: 0.15em;
    }
    .audit { margin-top: 0.45rem; }
    .audit-email {
      font-family: 'EB Garamond', serif;
      font-weight: 500;
      color: var(--copper);
      word-break: break-word;
      font-size: 0.97rem;
    }
    .audit-meta { font-size: 0.85rem; color: var(--muted); margin-top: 0.1rem; }
    .audit-meta .dot { margin: 0 0.4rem; opacity: 0.6; }
    .audit.none .audit-meta { font-style: italic; }
    table.people { width: 100%; border-collapse: collapse; }
    table.people th, table.people td {
      padding: 0.55rem 1.25rem;
      text-align: left;
      font-size: 0.95rem;
    }
    table.people thead th {
      background: #FCF8F0;
      color: var(--muted);
      font-size: 0.7rem;
      text-transform: uppercase;
      letter-spacing: 0.15em;
      font-weight: 500;
      border-bottom: 1px solid var(--line);
    }
    table.people tbody tr + tr td { border-top: 1px solid var(--line); }
    .badge {
      display: inline-block;
      padding: 0.18rem 0.7rem;
      border-radius: 999px;
      font-size: 0.78rem;
      letter-spacing: 0.03em;
      font-weight: 500;
    }
    .badge.yes { background: rgba(74, 124, 70, 0.12); color: var(--yes); }
    .badge.no { background: rgba(168, 92, 74, 0.12); color: var(--no); }
    .badge.missing { background: rgba(184, 138, 44, 0.14); color: var(--warn); }
    .badge.none { background: rgba(154, 140, 125, 0.14); color: var(--muted); }
    .muted { color: var(--muted); }
    .invite-email { font-size: 0.88rem; color: var(--muted); word-break: break-word; }
    .footnote {
      color: var(--muted);
      font-style: italic;
      font-size: 0.85rem;
      margin-top: 2rem;
      text-align: center;
    }
    @media (max-width: 600px) {
      body { padding: 1rem 0.75rem 3rem; }
      table.people th, table.people td { padding: 0.5rem 0.85rem; }
      .group-head { padding: 0.75rem 0.85rem; }
      button.csv-btn { margin-left: 0; width: 100%; }
    }
  </style>
</head>
<body>
  <div class="wrap">
    <h1>Wedding RSVPs — Planner View</h1>
    <p class="subtitle">Live, read-only. Cross-references the invite list with submitted responses.</p>

    <div class="summary">
      <div class="summary-grid">
        <div class="stat">
          <span class="label">Invited</span>
          <span class="value">${summary.totalPeople}</span>
          <span class="sub">across ${summary.totalHouseholds} households</span>
        </div>
        <div class="stat">
          <span class="label">Accepted</span>
          <span class="value">${summary.peopleAccepted}</span>
          <span class="sub">people</span>
        </div>
        <div class="stat">
          <span class="label">Declined</span>
          <span class="value">${summary.peopleDeclined}</span>
          <span class="sub">people</span>
        </div>
        <div class="stat">
          <span class="label">Unanswered</span>
          <span class="value">${summary.peopleUnanswered}</span>
          <span class="sub">people</span>
        </div>
        <div class="stat">
          <span class="label">Dietary needs</span>
          ${dietaryList ? `<ul class="dietary-list">${dietaryList}</ul>` : `<span class="muted" style="font-size:0.95rem">None reported</span>`}
        </div>
      </div>
    </div>

    <div class="toolbar">
      <div class="filters">
        <button class="filter-btn active" data-filter="all">All <span class="count">${summary.totalHouseholds}</span></button>
        <button class="filter-btn" data-filter="unanswered">Unanswered <span class="count">${summary.householdsUnanswered}</span></button>
        <button class="filter-btn" data-filter="accepted">Accepted <span class="count">${summary.householdsAccepted}</span></button>
        <button class="filter-btn" data-filter="declined">Declined <span class="count">${summary.householdsDeclined}</span></button>
      </div>
      <button class="csv-btn" id="dl">Download CSV</button>
    </div>

    ${groupsHtml}

    <p class="footnote">Read-only view. Status badges: <strong style="color:var(--yes)">Accepted</strong> / <strong style="color:var(--no)">Declined</strong> / <strong style="color:var(--warn)">Missing from submission</strong> (invited but not in the RSVP response — flag with submitter) / <strong style="color:var(--muted)">Unanswered</strong> (no RSVP yet).</p>
  </div>

  <script>
    const rows = ${safeJson};
    document.getElementById('dl').addEventListener('click', () => {
      if (!rows.length) return;
      const headers = Object.keys(rows[0]);
      const esc = (v) => '"' + String(v ?? '').replace(/"/g, '""') + '"';
      const csv = [headers.join(',')]
        .concat(rows.map((r) => headers.map((h) => esc(r[h])).join(',')))
        .join('\\r\\n');
      const d = new Date();
      const p = (n) => String(n).padStart(2, '0');
      const stamp = d.getFullYear() + '-' + p(d.getMonth()+1) + '-' + p(d.getDate())
                  + '_' + p(d.getHours()) + p(d.getMinutes());
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'wedding-rsvps_' + stamp + '.csv';
      a.click();
      URL.revokeObjectURL(a.href);
    });

    const buttons = document.querySelectorAll('.filter-btn');
    const groups = document.querySelectorAll('.group');
    buttons.forEach((btn) => {
      btn.addEventListener('click', () => {
        buttons.forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        const f = btn.dataset.filter;
        groups.forEach((g) => {
          g.style.display = (f === 'all' || g.dataset.bucket === f) ? '' : 'none';
        });
      });
    });
  </script>
</body>
</html>`;
}

export async function onRequestGet(context) {
  const { request, env } = context;
  const host = request.headers.get("host");

  if (!isAllowedHost(host)) {
    return new Response("Not found", { status: 404 });
  }

  if (!env.RSVPS) {
    return new Response("RSVPS KV binding missing", { status: 503 });
  }

  let guestList;
  try {
    guestList = await getGuestList(env);
  } catch (err) {
    return new Response("Guest list unavailable: " + err.message, { status: 503 });
  }

  const rsvpMap = await loadRsvpMap(env);
  return new Response(renderHtml(guestList.parties, rsvpMap), {
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "no-store",
      "x-robots-tag": "noindex, nofollow",
    },
  });
}
