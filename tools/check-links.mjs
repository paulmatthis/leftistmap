/* ============================================================
   check-links.mjs
   Verifies every external link in the project and reports the dead
   ones, so links are checked rather than trusted. Read-only: it
   changes nothing, it just tells you what is broken.

   Checks, per entry:
     - archive.url            (data.js)
     - each book's Bookshop link  (data.js, /a/104178/<isbn>)
     - each sources[].url     (entries/<id>.js)
     - each reading[].url     (entries/<id>.js)

   Notes on Bookshop:
     - A book WITH an isbn renders a direct product link (/a/104178/<isbn>);
       those return real 200/404 and are checked. fetch-books.mjs only ever
       writes an isbn it confirmed returns 200, so these should stay green.
     - A book WITHOUT an isbn renders a title+author SEARCH link instead. The
       search endpoint is bot-walled (it returns 403 to any script), so it is
       NOT HTTP-checked here; it is structurally valid by construction and is
       reported separately under --all so you can eyeball it.
     - Any bookshop.org 403 is treated as bot-walled (UNVERIFIABLE), never DEAD.

   Run from the project root:
       node tools/check-links.mjs          # report dead + errors
       node tools/check-links.mjs --all    # also list the OK links

   Requires Node 18+ (built-in fetch). No packages to install.
   ============================================================ */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const showAll = process.argv.includes("--all");

// Load data.js
const dataWin = { window: {} };
new Function("window", fs.readFileSync(path.join(root, "data.js"), "utf8"))(dataWin.window);
const entries = dataWin.window.ENTRIES || [];

// Load every entries/<id>.js into one shared LM_CONTENT
const win = { LM_CONTENT: {} };
const entriesDir = path.join(root, "entries");
for (const f of fs.readdirSync(entriesDir)) {
  if (!f.endsWith(".js")) continue;
  try { new Function("window", fs.readFileSync(path.join(entriesDir, f), "utf8"))(win); }
  catch (err) { console.error("parse fail " + f + ": " + err.message); }
}

// Collect link items. Books with an isbn are HTTP-checked; books without one
// render a search link (bot-walled, structurally valid) collected separately.
const items = [];
const searchItems = [];
for (const e of entries) {
  if (e.archive && e.archive.url) items.push({ id: e.id, field: "archive", url: e.archive.url });
  for (const bk of (e.books || [])) {
    if (bk.isbn) {
      items.push({ id: e.id, field: "book(" + bk.title + ")", url: "https://bookshop.org/a/104178/" + bk.isbn });
    } else {
      const q = encodeURIComponent(bk.title + " " + e.name);
      searchItems.push({ id: e.id, field: "book(" + bk.title + ")", url: "https://bookshop.org/search?keywords=" + q + "&affiliate=104178" });
    }
  }
  const c = win.LM_CONTENT[e.id] || {};
  for (const s of (c.sources || [])) items.push({ id: e.id, field: "source", url: s.url });
  for (const r of (c.reading || [])) items.push({ id: e.id, field: "reading", url: r.url });
  for (const x of (c.crossrefs || [])) items.push({ id: e.id, field: "crossref(on " + x.about + ")", url: x.url });
}

// Dedupe by URL (remember every place it appears)
const byUrl = new Map();
for (const it of items) {
  if (!byUrl.has(it.url)) byUrl.set(it.url, []);
  byUrl.get(it.url).push(it.id + " / " + it.field);
}

const UA = "LeftistMap/1.0 (link checker)";
async function check(url) {
  const opts = { headers: { "User-Agent": UA }, redirect: "follow" };
  function withTimeout(method) {
    const ac = new AbortController();
    const t = setTimeout(function () { ac.abort(); }, 12000);
    return fetch(url, Object.assign({ method: method, signal: ac.signal }, opts))
      .finally(function () { clearTimeout(t); });
  }
  // marxists.org serves missing pages as HTTP 200 with a "File Not Found" body,
  // so HEAD status alone misses those soft-404s. For that host, GET and scan.
  if (isSoftDeadHost(url)) {
    try {
      const res = await withTimeout("GET");
      if (res.status >= 200 && res.status < 400) {
        var body = "";
        try { body = (await res.text()).slice(0, 4000); } catch (_) {}
        if (/file not found|page not found|404 not found|could not be found/i.test(body)) return 404;
      }
      return res.status;
    } catch (e1) { return "ERR:" + e1.message; }
  }
  try {
    let res = await withTimeout("HEAD");
    if (res.status === 405 || res.status === 501) res = await withTimeout("GET"); // some servers refuse HEAD
    return res.status;
  } catch (err) {
    try { const res = await withTimeout("GET"); return res.status; }
    catch (e2) { return "ERR:" + e2.message; }
  }
}
function isSoftDeadHost(url) { try { return new URL(url).hostname.endsWith("marxists.org"); } catch (_) { return false; } }

const dead = [], errored = [], ok = [], botwalled = [];
const urls = Array.from(byUrl.keys());
console.log("Checking " + urls.length + " unique links across " + entries.length + " entries...");
console.log("(" + searchItems.length + " more are search-link fallbacks, listed under --all, not HTTP-checked.)\n");

function isBookshop(url) { try { return new URL(url).hostname.endsWith("bookshop.org"); } catch (_) { return false; } }

function classify(url, status) {
  const where = byUrl.get(url).join(", ");
  if (typeof status === "number" && status >= 200 && status < 400) ok.push({ url, status, where });
  else if (status === 403 && isBookshop(url)) botwalled.push({ url, status, where });
  else if (typeof status === "number") dead.push({ url, status, where });
  else errored.push({ url, status, where });
}

// Bounded-concurrency pool: sequential checking of ~280 links overruns the
// sandbox's per-call time limit, so check several at once. 8 is polite across
// the mix of hosts and finishes well inside the cap.
const CONCURRENCY = 8;
let cursor = 0;
async function worker() {
  while (cursor < urls.length) {
    const url = urls[cursor++];
    classify(url, await check(url));
  }
}
await Promise.all(Array.from({ length: Math.min(CONCURRENCY, urls.length) }, worker));

function dump(title, list) {
  if (!list.length) return;
  console.log("\n" + title + " (" + list.length + ")");
  for (const r of list) console.log("  [" + r.status + "] " + r.url + "\n           used by: " + r.where);
}

dump("DEAD (4xx/5xx), fix or remove these:", dead);
dump("UNREACHABLE (network/timeout, may be transient), recheck:", errored);
if (showAll) dump("BOT-WALLED (bookshop 403, not auto-verifiable, assumed valid):", botwalled);
if (showAll) dump("SEARCH-LINK FALLBACK (no isbn; not HTTP-checked):", searchItems.map(function (it) { return { url: it.url, status: "n/a", where: it.id + " / " + it.field }; }));
if (showAll) dump("OK", ok);

console.log("\nSummary: " + ok.length + " ok, " + dead.length + " dead, " + errored.length +
  " unreachable, " + botwalled.length + " bot-walled, " + searchItems.length + " search-fallback (unchecked).");
console.log("DEAD book links should be empty: fetch-books.mjs only writes Bookshop-verified ISBNs.");
console.log("To repair a dead book link, re-run tools/fetch-books.mjs (it re-verifies and blanks dead ISBNs).");
console.log("This script changes nothing. Wikipedia links are the safe fallback for sources.");
