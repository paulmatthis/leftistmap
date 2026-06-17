/* ============================================================
   fetch-books.mjs
   Resolves each entry's book titles to ISBNs via the free Open
   Library search API, and writes them into data.js so the modal
   can build Bookshop affiliate links (/a/104178/<isbn>).

   Run from the project root:
       node tools/fetch-books.mjs

   Requires Node 18+ (built-in fetch). No packages to install.

   NOTE: Open Library returns a real ISBN, but not every ISBN is
   stocked on Bookshop. Spot-check a few of the generated links;
   if one 404s on bookshop.org, swap the isbn in data.js by hand.
   ============================================================ */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dataPath = path.join(root, "data.js");
let code = fs.readFileSync(dataPath, "utf8");

const sandbox = { window: {} };
new Function("window", code)(sandbox.window);
const entries = sandbox.window.ENTRIES || [];

const UA = "LeftistMap/1.0 (book ISBN lookup)";

function pickIsbn(doc) {
  const list = (doc && doc.isbn) || [];
  const t13 = list.find(function (x) { return /^(978|979)\d{10}$/.test(x); });
  return t13 || list[0] || null;
}

// Guard against similar-title commentaries/study-guides: the matched book's
// author_name must contain the entry author's surname.
function authorOk(doc, author) {
  if (!author) return true;
  const names = ((doc && doc.author_name) || []).join(" | ").toLowerCase();
  const parts = author.toLowerCase().trim().split(/\s+/);
  const surname = parts[parts.length - 1];
  return surname.length > 1 && names.indexOf(surname) >= 0;
}

async function lookup(title, author) {
  // Try most-specific first, then progressively looser queries. The author
  // field in our data does not always match Open Library's author_name, so a
  // title-only and a general query recover most well-known books.
  var bare = title.split(":")[0].trim();   // drop subtitle after a colon
  const variants = [
    "title=" + encodeURIComponent(title) + "&author=" + encodeURIComponent(author),
    "title=" + encodeURIComponent(title),
    "title=" + encodeURIComponent(bare) + "&author=" + encodeURIComponent(author),
    "title=" + encodeURIComponent(bare),
    "q=" + encodeURIComponent(title + " " + author)
  ];
  for (const qs of variants) {
    const url = "https://openlibrary.org/search.json?limit=5&fields=isbn,title,author_name&" + qs;
    let res;
    try { res = await fetch(url, { headers: { "User-Agent": UA } }); } catch (_) { continue; }
    if (!res.ok) continue;
    const data = await res.json();
    for (const doc of (data.docs || [])) {
      if (!authorOk(doc, author)) continue;
      const isbn = pickIsbn(doc);
      if (isbn) return isbn;
    }
  }
  return null;
}

let ok = 0, skip = 0, fail = 0;
// Stop well before the sandbox's 45s cap, and write progress incrementally, so
// a partial run is never lost. Re-run until "0 unresolved-this-pass": each pass
// skips books that already have an isbn.
const START = Date.now();
const BUDGET_MS = 38000;
let stop = false;

outer:
for (const e of entries) {
  for (const bk of (e.books || [])) {
    if (bk.isbn) { skip++; continue; }
    if (Date.now() - START > BUDGET_MS) { stop = true; break outer; }
    try {
      const isbn = await lookup(bk.title, e.name);
      if (!isbn) { console.error("no ISBN  " + e.id + " / " + bk.title); fail++; continue; }
      const find = "{ title: " + JSON.stringify(bk.title) + " }";
      const repl = "{ title: " + JSON.stringify(bk.title) + ", isbn: " + JSON.stringify(isbn) + " }";
      if (code.includes(find)) {
        code = code.split(find).join(repl);
        fs.writeFileSync(dataPath, code);   // persist after every hit
        ok++;
        console.log("ok    " + e.id + "  " + bk.title + "  ->  " + isbn);
      } else {
        console.error("place fail  " + e.id + " / " + bk.title);
        fail++;
      }
    } catch (err) {
      console.error("FAIL  " + e.id + " / " + bk.title + ": " + err.message);
      fail++;
    }
  }
}

if (stop) console.log("\n(time budget reached; stopped early. Re-run to continue.)");
console.log("\nPass done. " + ok + " resolved this pass, " + skip + " already set, " + fail + " unresolved.");
console.log("Reminder: spot-check a few links on bookshop.org; swap any unstocked ISBNs by hand.");
