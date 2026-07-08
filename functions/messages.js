// Read-only "Contact Messages" view for Veronica.
//
// LOCK MODEL (mirrors planners.js / text-list.js):
//   - GET-only. Middleware allow-lists `/messages`.
//   - Served ONLY on planners.veronicaandsam2027.com (behind Cloudflare Access)
//     in production; any other host -> 404. Localhost allowed for dev.
//
// DATA: reads ONLY `contact:*` keys (Contact-form submissions).
//       Never touches RSVP (`household-*`) or Updates (`notify:*`) data.

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

async function loadMessages(env) {
  const out = [];
  let cursor;
  do {
    const list = await env.RSVPS.list({ prefix: "contact:", cursor });
    for (const k of list.keys) {
      const rec = await env.RSVPS.get(k.name, "json");
      if (rec) out.push(rec);
    }
    cursor = list.list_complete ? undefined : list.cursor;
  } while (cursor);
  out.sort((a, b) => String(b.submittedAt || "").localeCompare(String(a.submittedAt || "")));
  return out;
}

function renderHtml(messages) {
  const cards = messages
    .map((m) => {
      const email = escapeHtml(m.email);
      const phoneLine = m.phone
        ? `<span class="dot">&bull;</span><a href="tel:${escapeHtml(m.phone)}">${escapeHtml(m.phone)}</a>`
        : "";
      return `
      <div class="msg">
        <div class="msg-head">
          <span class="msg-name">${escapeHtml(m.name)}</span>
          <span class="msg-date">${escapeHtml(m.submittedAt)}</span>
        </div>
        <div class="msg-contact"><a href="mailto:${email}">${email}</a>${phoneLine}</div>
        <div class="msg-body">${escapeHtml(m.message)}</div>
        <div class="msg-actions"><a class="reply" href="mailto:${email}?subject=Re%3A%20Your%20message%20to%20Veronica%20%26%20Samuel">Reply</a></div>
      </div>`;
    })
    .join("");

  const dataJson = JSON.stringify(
    messages.map((m) => ({
      name: m.name || "",
      email: m.email || "",
      phone: m.phone || "",
      message: m.message || "",
      submittedAt: m.submittedAt || "",
    }))
  );

  return `<!DOCTYPE html><html lang="en"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Contact Messages</title>
<style>
  body{margin:0;background:#EAE0D4;color:#5b4636;font-family:'EB Garamond',Georgia,serif;padding:2rem 1.2rem;}
  .wrap{max-width:760px;margin:0 auto;}
  h1{font-family:'Cormorant Garamond',Georgia,serif;color:#B17F5F;font-style:italic;font-size:2.1rem;margin:0 0 .2rem;}
  .sub{color:#9C6A4D;margin:0 0 1.4rem;font-size:.95rem;}
  .bar{display:flex;gap:.6rem;flex-wrap:wrap;margin-bottom:1.2rem;}
  button{font-family:'EB Garamond',serif;font-size:.95rem;color:#FBF6EF;background:linear-gradient(135deg,#B5805F,#D9A175);border:0;border-radius:999px;padding:9px 20px;cursor:pointer;}
  .msg{background:#F5EDE3;border-radius:12px;padding:1.1rem 1.2rem;margin-bottom:1rem;box-shadow:0 2px 10px rgba(0,0,0,.05);}
  .msg-head{display:flex;justify-content:space-between;align-items:baseline;gap:1rem;}
  .msg-name{font-size:1.2rem;color:#B17F5F;font-weight:600;}
  .msg-date{color:#9C6A4D;font-size:.78rem;white-space:nowrap;}
  .msg-contact{margin:.2rem 0 .7rem;font-size:.95rem;}
  .msg-contact a{color:#9C6A4D;text-decoration:none;}
  .msg-contact .dot{margin:0 .5rem;color:#c9b7a3;}
  .msg-body{white-space:pre-wrap;line-height:1.55;color:#5b4636;font-size:1.02rem;border-left:3px solid #E0CDB6;padding-left:.9rem;}
  .msg-actions{margin-top:.8rem;}
  .reply{display:inline-block;font-size:.85rem;color:#FBF6EF;background:linear-gradient(135deg,#B5805F,#D9A175);border-radius:999px;padding:5px 16px;text-decoration:none;}
  .count{color:#9C6A4D;font-size:.9rem;margin-top:.5rem;}
  .empty{padding:2.4rem;text-align:center;color:#9C6A4D;font-style:italic;background:#F5EDE3;border-radius:12px;}
</style></head><body><div class="wrap">
  <h1>Contact Messages</h1>
  <p class="sub">Messages from the site's Contact form &mdash; newest first. For Veronica.</p>
  <div class="bar"><button onclick="downloadReport()">&#8595; Build Report (CSV)</button></div>
  ${messages.length ? cards : `<div class="empty">No messages yet.</div>`}
  <div class="count">${messages.length} message${messages.length === 1 ? "" : "s"}</div>
</div>
<script>
  var DATA = ${dataJson};
  function stamp(){ var d=new Date(); function p(n){return String(n).padStart(2,'0');} return d.getFullYear()+'-'+p(d.getMonth()+1)+'-'+p(d.getDate())+'_'+p(d.getHours())+p(d.getMinutes()); }
  function csvCell(v){ v=String(v==null?'':v); return /[",\\n]/.test(v) ? '"'+v.replace(/"/g,'""')+'"' : v; }
  function downloadReport(){
    var lines=[];
    lines.push('Contact Messages — report generated '+csvCell(new Date().toString()));
    lines.push('');
    lines.push(['Name','Email','Phone','Message','Received'].map(csvCell).join(','));
    DATA.forEach(function(r){ lines.push([r.name,r.email,r.phone,r.message,r.submittedAt].map(csvCell).join(',')); });
    lines.push('');
    lines.push('Total messages,'+DATA.length);
    var blob=new Blob([lines.join('\\n')],{type:'text/csv;charset=utf-8;'});
    var a=document.createElement('a'); a.href=URL.createObjectURL(blob);
    a.download='contact-messages_'+stamp()+'.csv';
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
  }
</script></body></html>`;
}

export async function onRequestGet(context) {
  const { request, env } = context;
  const host = request.headers.get("host");
  if (!isAllowedHost(host)) return new Response("Not found", { status: 404 });
  if (!env.RSVPS) return new Response("RSVPS KV binding missing", { status: 503 });
  const messages = await loadMessages(env);
  return new Response(renderHtml(messages), {
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "no-store",
      "x-robots-tag": "noindex, nofollow",
    },
  });
}
