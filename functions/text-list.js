// Read-only "Text-Update signup list" for Veronica & Sam.
//
// LOCK MODEL (mirrors planners.js):
//   - GET-only (no other verbs exported).
//   - Middleware allow-lists `/text-list` so the guest passcode is NOT the guard.
//   - In production it is served ONLY from planners.veronicaandsam2027.com
//     (behind Cloudflare Access). Any other host → 404. Localhost allowed for dev.
//
// DATA: reads ONLY `notify:*` keys (the "Stay In The Loop" text-update signups).
//       Never touches RSVP (`household-*`) or Contact (`contact:*`) data.

const PRODUCTION_HOSTS = new Set(["planners.veronicaandsam2027.com"]);

function isAllowedHost(hostHeader) {
  if (!hostHeader) return false;
  const host = hostHeader.toLowerCase().split(":")[0];
  if (host === "localhost" || host === "127.0.0.1") return true;
  return PRODUCTION_HOSTS.has(host);
}

function escapeHtml(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

async function loadSignups(env) {
  const out = [];
  let cursor;
  do {
    const list = await env.RSVPS.list({ prefix: "notify:", cursor });
    for (const k of list.keys) {
      const rec = await env.RSVPS.get(k.name, "json");
      if (rec) out.push(rec);
    }
    cursor = list.list_complete ? undefined : list.cursor;
  } while (cursor);
  out.sort((a, b) => String(b.submittedAt || "").localeCompare(String(a.submittedAt || "")));
  return out;
}

function renderHtml(signups) {
  const rows = signups
    .map(
      (s) => `
      <tr>
        <td>${escapeHtml(s.name)}</td>
        <td class="num">${escapeHtml(s.phone)}</td>
        <td class="date">${escapeHtml(s.submittedAt)}</td>
      </tr>`
    )
    .join("");

  const dataJson = JSON.stringify(
    signups.map((s) => ({ name: s.name || "", phone: s.phone || "", submittedAt: s.submittedAt || "" }))
  );

  return `<!DOCTYPE html><html lang="en"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Text-Update Signups</title>
<style>
  body{margin:0;background:#EAE0D4;color:#5b4636;font-family:'EB Garamond',Georgia,serif;padding:2rem 1.2rem;}
  .wrap{max-width:760px;margin:0 auto;}
  h1{font-family:'Cormorant Garamond',Georgia,serif;color:#B17F5F;font-style:italic;font-size:2.1rem;margin:0 0 .2rem;}
  .sub{color:#9C6A4D;margin:0 0 1.4rem;font-size:.95rem;}
  .bar{display:flex;gap:.6rem;flex-wrap:wrap;margin-bottom:1rem;}
  button{font-family:'EB Garamond',serif;font-size:.95rem;color:#FBF6EF;background:linear-gradient(135deg,#B5805F,#D9A175);border:0;border-radius:999px;padding:9px 20px;cursor:pointer;}
  button.ghost{background:none;color:#B17F5F;border:1px solid rgba(177,127,95,.5);}
  table{width:100%;border-collapse:collapse;background:#F5EDE3;border-radius:10px;overflow:hidden;}
  th,td{text-align:left;padding:11px 14px;border-bottom:1px solid #E4D6C6;font-size:.98rem;}
  th{background:#E7D9C8;color:#8a5a3c;font-weight:600;}
  tr:last-child td{border-bottom:0;}
  td.num{font-variant-numeric:tabular-nums;}
  td.date{color:#9C6A4D;font-size:.82rem;}
  .count{color:#9C6A4D;font-size:.9rem;margin-top:1rem;}
  .empty{padding:2.4rem;text-align:center;color:#9C6A4D;font-style:italic;background:#F5EDE3;border-radius:10px;}
</style></head><body><div class="wrap">
  <h1>Text-Update Signups</h1>
  <p class="sub">Guests who asked to receive wedding text updates &mdash; newest first. Build a report and hand this list to the planners.</p>
  <div class="bar">
    <button onclick="downloadReport()">&#8595; Build Report (CSV)</button>
    <button class="ghost" onclick="copyNumbers(this)">Copy all numbers</button>
  </div>
  ${
    signups.length
      ? `<table><thead><tr><th>Name</th><th>Phone</th><th>Signed up</th></tr></thead><tbody>${rows}</tbody></table>`
      : `<div class="empty">No text-update signups yet.</div>`
  }
  <div class="count">${signups.length} signup${signups.length === 1 ? "" : "s"}</div>
</div>
<script>
  var DATA = ${dataJson};
  function stamp(){ var d=new Date(); function p(n){return String(n).padStart(2,'0');} return d.getFullYear()+'-'+p(d.getMonth()+1)+'-'+p(d.getDate())+'_'+p(d.getHours())+p(d.getMinutes()); }
  function csvCell(v){ v=String(v==null?'':v); return /[",\\n]/.test(v) ? '"'+v.replace(/"/g,'""')+'"' : v; }
  function downloadReport(){
    var lines=[];
    lines.push('Text-Update Signups — report generated '+csvCell(new Date().toString()));
    lines.push('');
    lines.push(['Name','Phone','Signed up'].map(csvCell).join(','));
    DATA.forEach(function(r){ lines.push([r.name,r.phone,r.submittedAt].map(csvCell).join(',')); });
    lines.push('');
    lines.push('Total signups,'+DATA.length);
    var blob=new Blob([lines.join('\\n')],{type:'text/csv;charset=utf-8;'});
    var a=document.createElement('a'); a.href=URL.createObjectURL(blob);
    a.download='text-update-signups_'+stamp()+'.csv';
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
  }
  function copyNumbers(btn){
    var nums=DATA.map(function(r){return r.phone;}).filter(Boolean).join(', ');
    function done(){ var o=btn.textContent; btn.textContent='Copied \\u2713'; setTimeout(function(){btn.textContent=o;},1500); }
    if(navigator.clipboard && navigator.clipboard.writeText){ navigator.clipboard.writeText(nums).then(done, done); } else { done(); }
  }
</script></body></html>`;
}

export async function onRequestGet(context) {
  const { request, env } = context;
  const host = request.headers.get("host");
  if (!isAllowedHost(host)) return new Response("Not found", { status: 404 });
  if (!env.RSVPS) return new Response("RSVPS KV binding missing", { status: 503 });
  const signups = await loadSignups(env);
  return new Response(renderHtml(signups), {
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "no-store",
      "x-robots-tag": "noindex, nofollow",
    },
  });
}
