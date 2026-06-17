/* ============================================================
   fetch-books.mjs
   Resolves each entry's book titles to an ISBN that is ACTUALLY
   STOCKED on Bookshop, and writes it into data.js so the modal can
   build a direct affiliate product link (/a/104178/<isbn>).

   Why this exists in this form: the old version trusted the first
   ISBN that Open Library returned. Open Library knows about editions
   Bookshop does not stock, so a third of those links 404'd. This
   version never writes an ISBN it has not confirmed resolves to a
   live product page on bookshop.org. Books with no stocked edition
   are left with no isbn; the modal then renders a title+author
   Bookshop SEARCH link (see renderLinks in app.js), which is always
   valid, so every book still gets a working button.

   What a pass does, per book:
     1. If the book already has an isbn, re-verify it against Bookshop.
        Still 200  -> keep it.
        404/gone   -> blank it (persisted immediately) and re-resolve.
     2. To resolve: ask Open Library for candidate ISBNs (author-guarded,
        most-specific query first), then test each against Bookshop and
        write the FIRST that returns 200.
     3. If no candidate is stocked, leave the book with no isbn.

   It writes after every change and stops before the 45s sandbox cap,
   so a partial run is never lost. RE-RUN it until a pass reports
   "0 changed, 0 to-do": each pass skips books whose isbn is already
   confirmed (a local cache, tools/.isbn-verify-cache.json, remembers
   recent confirmations so re-runs are fast). Run one pass per bash
   call; chaining passes in one call hits the timeout and they collide.

   Run from the project root:
       node tools/fetch-books.mjs

   Requires Node 18+ (built-in fetch). No packages to install.
   ============================================================ */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dataPath = path.join(root, "data.js");
const cachePath = path.join(root, "tools", ".isbn-verify-cache.json");
const AFFILIATE = "104178";

let code = fs.readFileSync(dataPath, "utf8");
const sandbox = { window: {} };
new Function("window", code)(sandbox.window);
const entries = sandbox.window.ENTRIES || [];

// Local cache of recent Bookshop confirmations: isbn -> epoch ms when we last
// saw it return 200. Re-runs skip re-verifying anything confirmed inside the
// TTL, so a clean re-run is fast. Stock changes, so confirmations expire.
const TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days
let cache = {};
try { cache = JSON.parse(fs.readFileSync(cachePath, "utf8")); } catch (_) {}
function fresh(key) {
  const ts = cache[key];
  return typeof ts === "number" && (Date.now() - ts) < TTL_MS;
}
function cacheGood(isbn) { return fresh(isbn); }
// Negative cache, keyed by title, so a book with no stocked edition is not
// re-resolved (≈21 failed lookups) on every pass. This is what lets a pass
// advance past the search-fallback books instead of starving on them.
function searchCached(title) { return fresh("nf:" + title); }
function markSearch(title) { cache["nf:" + title] = Date.now(); saveCache(); }
function saveCache() {
  try { fs.writeFileSync(cachePath, JSON.stringify(cache)); } catch (_) {}
}

const UA = "Mozilla/5.0 (compatible; LeftistMap/1.0; book ISBN verifier)";

function withTimeout(url, opts, ms) {
  const ac = new AbortController();
  const t = setTimeout(function () { ac.abort(); }, ms);
  return fetch(url, Object.assign({ signal: ac.signal }, opts)).finally(function () { clearTimeout(t); });
}

// Does /a/<affiliate>/<isbn> resolve to a live product page? 200 = stocked.
// 404 = Bookshop has no such edition. A bot-wall 403 or a network blip is
// treated as "unknown" (we do not write or blank on it).
async function bookshopStatus(isbn) {
  const url = "https://bookshop.org/a/" + AFFILIATE + "/" + encodeURIComponent(isbn);
  try {
    let r = await withTimeout(url, { method: "HEAD", headers: { "User-Agent": UA }, redirect: "follow" }, 12000);
    if (r.status === 405 || r.status === 501) {
      r = await withTimeout(url, { method: "GET", headers: { "User-Agent": UA }, redirect: "follow" }, 12000);
    }
    return r.status;
  } catch (_) { return "ERR"; }
}
async function bookshopOk(isbn) {
  if (!isbn) return false;
  if (cacheGood(isbn)) return true;
  const s = await bookshopStatus(isbn);
  if (s === 200) { cache[isbn] = Date.now(); saveCache(); return true; }
  return false; // 404 (not stocked) or unknown (403/ERR); caller decides
}

// Guard against similar-title commentaries/study-guides: a matched doc's
// author_name must contain the entry author's surname.
function authorOk(doc, author) {
  if (!author) return true;
  const names = ((doc && doc.author_name) || []).join(" | ").toLowerCase();
  const parts = author.toLowerCase().trim().split(/\s+/);
  const surname = parts[parts.length - 1];
  return surname.length > 1 && names.indexOf(surname) >= 0;
}

// Collect candidate ISBNs from Open Library, author-guarded, ISBN-13 first,
// de-duplicated, most-specific query first. Returns an ordered array.
// `outOfTime` lets the caller's deadline abort the query sequence mid-way so a
// single book cannot stack several network waits past the sandbox's 45s wall.
async function candidates(title, author, outOfTime) {
  const bare = title.split(":")[0].trim(); // drop subtitle after a colon
  const variants = [
    "title=" + encodeURIComponent(title) + "&author=" + encodeURIComponent(author),
    "title=" + encodeURIComponent(title),
    "title=" + encodeURIComponent(bare) + "&author=" + encodeURIComponent(author),
    "title=" + encodeURIComponent(bare),
    "q=" + encodeURIComponent(title + " " + author)
  ];
  const seen = new Set();
  const thirteens = [], others = [];
  for (const qs of variants) {
    if (outOfTime && outOfTime()) break;
    const url = "https://openlibrary.org/search.json?limit=5&fields=isbn,title,author_name&" + qs;
    let res;
    try { res = await withTimeout(url, { headers: { "User-Agent": UA } }, 12000); } catch (_) { continue; }
    if (!res.ok) continue;
    let data; try { data = await res.json(); } catch (_) { continue; }
    for (const doc of (data.docs || [])) {
      if (!authorOk(doc, author)) continue;
      for (const isbn of ((doc && doc.isbn) || [])) {
        if (seen.has(isbn)) continue;
        seen.add(isbn);
        if (/^(978|979)\d{10}$/.test(isbn)) thirteens.push(isbn);
        else others.push(isbn);
      }
    }
    if (thirteens.length >= 12) break; // enough to test
  }
  return thirteens.concat(others).slice(0, 16);
}

function escapeRe(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }

function setIsbn(title, isbn) {
  // Replace whichever form is currently present for this exact title.
  const reAny = new RegExp("\\{ title: " + escapeRe(JSON.stringify(title)) + "(?:, isbn: \"[^\"]*\")? \\}");
  const repl = "{ title: " + JSON.stringify(title) + ", isbn: " + JSON.stringify(isbn) + " }";
  if (reAny.test(code)) { code = code.replace(reAny, repl); fs.writeFileSync(dataPath, code); return true; }
  return false;
}
function clearIsbn(title) {
  const reAny = new RegExp("\\{ title: " + escapeRe(JSON.stringify(title)) + ", isbn: \"[^\"]*\" \\}");
  const repl = "{ title: " + JSON.stringify(title) + " }";
  if (reAny.test(code)) { code = code.replace(reAny, repl); fs.writeFileSync(dataPath, code); return true; }
  return false;
}

let kept = 0, fixed = 0, blanked = 0, search = 0, changed = 0, todo = 0;
const START = Date.now();
const BUDGET_MS = 30000; // leave generous headroom under the 45s sandbox wall
let stop = false;
function outOfTime() { return Date.now() - START > BUDGET_MS; }

outer:
for (const e of entries) {
  for (const bk of (e.books || [])) {
    // Cheap path: an isbn we confirmed recently. Skip without a network call.
    if (bk.isbn && cacheGood(bk.isbn)) { kept++; continue; }
    // No isbn and recently found to have no stocked edition: leave it on the
    // search-link fallback without paying for resolution again.
    if (!bk.isbn && searchCached(bk.title)) { search++; continue; }
    if (outOfTime()) { stop = true; todo++; continue; }

    // Verify an existing isbn against Bookshop.
    if (bk.isbn) {
      if (await bookshopOk(bk.isbn)) { kept++; continue; }
      // Not stocked: blank it now so the modal stops rendering a 404.
      clearIsbn(bk.title); changed++; blanked++;
      console.log("blank " + e.id + "  " + bk.title + "  (" + bk.isbn + " not on Bookshop)");
    }

    if (outOfTime()) { stop = true; todo++; continue; }

    // Resolve: first Open-Library candidate that Bookshop actually stocks.
    let chosen = null;
    const cands = await candidates(bk.title, e.name, outOfTime);
    for (const c of cands) {
      if (outOfTime()) { stop = true; break; }
      if (await bookshopOk(c)) { chosen = c; break; }
    }
    if (chosen) {
      setIsbn(bk.title, chosen); changed++; fixed++;
      console.log("ok    " + e.id + "  " + bk.title + "  ->  " + chosen);
    } else if (stop) {
      todo++;
    } else {
      search++;
      markSearch(bk.title); // remember: no stocked edition, skip next time
      console.log("search " + e.id + "  " + bk.title + "  (no stocked edition; search-link fallback)");
    }
  }
}

saveCache();
if (stop) console.log("\n(time budget reached; stopped early. Re-run to continue.)");
console.log("\nPass done. " + kept + " kept, " + fixed + " fixed, " + blanked + " blanked, " +
  search + " search-fallback, " + changed + " changed, " + todo + " to-do.");
console.log("Re-run until '0 changed, 0 to-do'. Then run tools/check-links.mjs to confirm no dead links.");
