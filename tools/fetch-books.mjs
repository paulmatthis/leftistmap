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

async function lookup(title, author) {
  const url = "https://openlibrary.org/search.json?limit=3&fields=isbn,title,author_name" +
    "&title=" + encodeURIComponent(title) + "&author=" + encodeURIComponent(author);
  const res = await fetch(url, { headers: { "User-Agent": UA } });
  if (!res.ok) throw new Error("HTTP " + res.status);
  const data = await res.json();
  for (const doc of (data.docs || [])) {
    const isbn = pickIsbn(doc);
    if (isbn) return isbn;
  }
  return null;
}

let changed = false, ok = 0, skip = 0, fail = 0;

for (const e of entries) {
  for (const bk of (e.books || [])) {
    if (bk.isbn) { skip++; continue; }
    try {
      const isbn = await lookup(bk.title, e.name);
      if (!isbn) { console.error("no ISBN  " + e.id + " / " + bk.title); fail++; continue; }
      const find = "{ title: " + JSON.stringify(bk.title) + " }";
      const repl = "{ title: " + JSON.stringify(bk.title) + ", isbn: " + JSON.stringify(isbn) + " }";
      if (code.includes(find)) {
        code = code.split(find).join(repl);
        changed = true; ok++;
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

if (changed) { fs.writeFileSync(dataPath, code); console.log("\ndata.js updated with ISBNs."); }
console.log("\nDone. " + ok + " resolved, " + skip + " already set, " + fail + " unresolved.");
console.log("Reminder: spot-check a few links on bookshop.org; swap any unstocked ISBNs by hand.");
