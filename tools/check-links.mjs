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

// Collect link items
const items = [];
for (const e of entries) {
  if (e.archive && e.archive.url) items.push({ id: e.id, field: "archive", url: e.archive.url });
  for (const bk of (e.books || [])) {
    if (bk.isbn) items.push({ id: e.id, field: "book(" + bk.title + ")", url: "https://bookshop.org/a/104178/" + bk.isbn });
  }
  const c = win.LM_CONTENT[e.id] || {};
  for (const s of (c.sources || [])) items.push({ id: e.id, field: "source", url: s.url });
  for (const r of (c.reading || [])) items.push({ id: e.id, field: "reading", url: r.url });
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
  try {
    let res = await withTimeout("HEAD");
    if (res.status === 405 || res.status === 501) res = await withTimeout("GET"); // some servers refuse HEAD
    return res.status;
  } catch (err) {
    try { const res = await withTimeout("GET"); return res.status; }
    catch (e2) { return "ERR:" + e2.message; }
  }
}

const dead = [], errored = [], ok = [];
const urls = Array.from(byUrl.keys());
console.log("Checking " + urls.length + " unique links across " + entries.length + " entries...\n");

for (const url of urls) {
  const status = await check(url);
  const where = byUrl.get(url).join(", ");
  if (typeof status === "number" && status >= 200 && status < 400) ok.push({ url, status, where });
  else if (typeof status === "number") dead.push({ url, status, where });
  else errored.push({ url, status, where });
}

function dump(title, list) {
  if (!list.length) return;
  console.log("\n" + title + " (" + list.length + ")");
  for (const r of list) console.log("  [" + r.status + "] " + r.url + "\n           used by: " + r.where);
}

dump("DEAD (4xx/5xx), fix or remove these:", dead);
dump("UNREACHABLE (network/timeout, may be transient), recheck:", errored);
if (showAll) dump("OK", ok);

console.log("\nSummary: " + ok.length + " ok, " + dead.length + " dead, " + errored.length + " unreachable.");
console.log("This script changes nothing. Use the DEAD list to correct data.js / entries/ by hand,");
console.log("or feed it to the bulk agent to repair. Wikipedia links are the safe fallback.");
