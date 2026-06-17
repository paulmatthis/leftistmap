/* ============================================================
   prune-dead-sources.mjs  (one-off cleanup, final pass)
   Offline file edits only.

     1. Blanks the three archive buttons that still 404 (Proudhon,
        Saint-Simon, Owen are not on Marxists.org at those paths).
     2. Removes the dead, non-displayed archive-duplicate "source"
        citations from the entry files (Wikipedia source stays).

   Run from project root:  node tools/prune-dead-sources.mjs
   ============================================================ */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

// Dead source URLs to remove from entries/*.js (and to blank in data.js where noted).
const DEAD = [
  "https://theanarchistlibrary.org/category/author/peter-kropotkin",
  "https://www.marxists.org/reference/archive/proudhon/index.htm",
  "https://www.marxists.org/reference/archive/saint-simon/index.htm",
  "https://www.marxists.org/reference/archive/owen/index.htm",
  "https://www.marxists.org/reference/archive/fanon/index.htm",
  "https://www.marxists.org/reference/archive/dubois/index.htm",
  "https://www.marxists.org/reference/archive/cabral/index.htm",
  "https://www.marxists.org/reference/archive/davis/index.htm",
  "https://www.marxists.org/reference/archive/fromm/index.htm",
  "https://www.marxists.org/reference/archive/federici/index.htm",
  "https://www.marxists.org/reference/archive/thompson-ep/index.htm",
  "https://www.marxists.org/reference/archive/harvey/index.htm",
  "https://www.marxists.org/reference/archive/poulantzas/index.htm"
];

// These three still have a (dead) archive button in data.js; blank it.
const BLANK_IN_DATA = [
  "https://www.marxists.org/reference/archive/proudhon/index.htm",
  "https://www.marxists.org/reference/archive/saint-simon/index.htm",
  "https://www.marxists.org/reference/archive/owen/index.htm"
];

function esc(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }

// ---- data.js: blank dead archive urls ----
const dataPath = path.join(root, "data.js");
let data = fs.readFileSync(dataPath, "utf8");
let blanked = 0;
for (const url of BLANK_IN_DATA) {
  const token = '"' + url + '"';
  const before = data.length;
  data = data.split(token).join('""');
  if (data.length !== before) blanked++;
}
fs.writeFileSync(dataPath, data);

// ---- entries/*.js: remove dead source items (item plus its leading comma) ----
const entriesDir = path.join(root, "entries");
let removed = 0, files = 0;
for (const f of fs.readdirSync(entriesDir)) {
  if (!f.endsWith(".js")) continue;
  const p = path.join(entriesDir, f);
  let t = fs.readFileSync(p, "utf8");
  const orig = t;
  for (const url of DEAD) {
    const re = new RegExp(",\\s*\\{[^}]*" + esc(url) + "[^}]*\\}", "g");
    t = t.replace(re, function () { removed++; return ""; });
  }
  if (t !== orig) { fs.writeFileSync(p, t); files++; }
}

console.log("Blanked " + blanked + " archive links in data.js; removed " + removed +
  " dead source citations across " + files + " entry files.");
console.log("Re-run: node tools/check-links.mjs");
