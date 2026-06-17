/* ============================================================
   repair-links.mjs  (one-off cleanup)
   Fixes the dead links found by check-links.mjs, deterministically
   and offline (file edits only, no network).

   What it does:
     1. Removes dead Bookshop ISBNs so broken book buttons vanish.
     2. Repairs Marxists.org archive/source URLs:
          - ".../works/index.htm"  ->  ".../index.htm"
          - bare ".../slug/"        ->  ".../slug/index.htm"
     3. Blanks archive links for figures with no reliable free archive
        (button is then hidden; Wikipedia remains in the footer).
     4. Removes the one dead "further reading" link (Thompson SEP).

   Run from project root:  node tools/repair-links.mjs
   ============================================================ */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

// Dead Bookshop ISBNs to strip (book button disappears).
const DEAD_ISBNS = [
  "9780394602028", "9780585015828", "9781421969671", "9781520480282", "9781508760412",
  "9780805200119", "9781548277574", "9787119019635", "9781313824408", "9780393005677",
  "9780472060962", "9780906224496", "9780906224298", "9781434618900", "9780781281478",
  "9781961775350", "9780878670055", "9788889413913", "9781502888815", "9780853153788",
  "9780906224328", "9781595478993", "9780947608101", "9788416553327", "9780717802708",
  "9780836939835", "9780460007993", "9780744800401", "9783518011584", "9780268021658",
  "9780873951753", "9780192816214", "9781976008382", "9780292701151", "9781599070360",
  "9781446496657", "9788833893273", "9780192810373", "9780863161513", "9781410203687",
  "9780826400932", "9780902308954", "9780380011674", "9781306624077", "9780241532539",
  "9781973776659", "9781859847145", "9791020924636"
];

// Archive URLs to blank (no reliable free archive for these figures).
const BLANK_ARCHIVE = [
  "https://theanarchistlibrary.org/category/author/peter-kropotkin",
  "https://www.marxists.org/reference/archive/fanon/",
  "https://www.marxists.org/reference/archive/dubois/",
  "https://www.marxists.org/reference/archive/cabral/",
  "https://www.marxists.org/reference/archive/davis/",
  "https://www.marxists.org/reference/archive/fromm/",
  "https://www.marxists.org/reference/archive/federici/",
  "https://www.marxists.org/reference/archive/thompson-ep/",
  "https://www.marxists.org/reference/archive/harvey/",
  "https://www.marxists.org/reference/archive/poulantzas/"
];

function repairMarxists(text) {
  // /works/index.htm was a wrong guess; the real page is the base index.
  text = text.split("/works/index.htm").join("/index.htm");
  // Bare Marxists.org directory URLs need an explicit index.htm.
  text = text.replace(/(https:\/\/www\.marxists\.org\/[^"]*?)\/"/g, '$1/index.htm"');
  return text;
}

// ---- data.js ----
let data = fs.readFileSync(path.join(root, "data.js"), "utf8");
let isbnHits = 0;
for (const isbn of DEAD_ISBNS) {
  const token = ', isbn: "' + isbn + '"';
  const before = data.length;
  data = data.split(token).join("");
  if (data.length !== before) isbnHits++;
}
let blanked = 0;
for (const url of BLANK_ARCHIVE) {
  const token = '"' + url + '"';
  const before = data.length;
  data = data.split(token).join('""');
  if (data.length !== before) blanked++;
}
data = repairMarxists(data);
fs.writeFileSync(path.join(root, "data.js"), data);

// ---- entries/*.js (repair source URLs; drop dead Thompson reading) ----
const entriesDir = path.join(root, "entries");
let filesTouched = 0;
for (const f of fs.readdirSync(entriesDir)) {
  if (!f.endsWith(".js")) continue;
  const p = path.join(entriesDir, f);
  let t = fs.readFileSync(p, "utf8");
  const orig = t;
  t = repairMarxists(t);
  // Remove the dead Stanford Encyclopedia reading link (E. P. Thompson).
  if (t.includes("plato.stanford.edu/entries/thompson-ep")) {
    t = t.replace(/reading:\s*\[[\s\S]*?\],\s*/, "");
  }
  if (t !== orig) { fs.writeFileSync(p, t); filesTouched++; }
}

console.log("Removed " + isbnHits + " dead book ISBNs, blanked " + blanked + " archive links,");
console.log("repaired Marxists.org URLs, touched " + filesTouched + " entry files.");
console.log("Now re-run: node tools/check-links.mjs");
