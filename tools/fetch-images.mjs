/* ============================================================
   fetch-images.mjs
   Localizes remote thumbnails referenced in data.js.

   For every entry whose `thumb` is a remote URL or a "wiki:<Title>"
   reference, it:
     1. resolves "wiki:<Title>" to that Wikipedia page's lead portrait
        via the API (plain URLs are used as-is), then downloads it to
        img/<id>.<ext>, where <id> is the entry's id field (e.g. "marx"
        -> marx.png). Ids are unique, filesystem-safe, and match the
        entries/<id>.js files.
     2. rewrites that entry's `thumb` in data.js to the local path

   Run from the project root (the folder containing data.js):
       node tools/fetch-images.mjs

   Requires Node 18+ (uses built-in fetch). No packages to install.
   ============================================================ */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dataPath = path.join(root, "data.js");
const imgDir = path.join(root, "img");

let code = fs.readFileSync(dataPath, "utf8");

// Evaluate data.js in a tiny sandbox to read window.ENTRIES.
const sandbox = { window: {} };
new Function("window", code)(sandbox.window);
const entries = sandbox.window.ENTRIES || [];

fs.mkdirSync(imgDir, { recursive: true });

const EXT = /\.(png|jpe?g|webp|gif|svg)(?=$|\?)/i;

// Wikimedia requires a descriptive User-Agent. Edit the contact if you like.
const UA = "LeftistMap/1.0 (https://github.com/leftist-map; image localiser script)";

async function tryFetch(url) {
  return fetch(url, {
    headers: {
      "User-Agent": UA,
      "Accept": "image/avif,image/webp,image/png,image/jpeg,image/*,*/*;q=0.8",
      "Accept-Language": "en",
      "Referer": "https://en.wikipedia.org/"
    },
    redirect: "follow"
  });
}

// Given a Wikimedia /thumb/ URL, derive the full-size original as a fallback.
function originalFromThumb(u) {
  if (!u.includes("/thumb/")) return null;
  return u.replace("/commons/thumb/", "/commons/").replace(/\/[^/]+$/, "");
}

// Resolve "wiki:Page_Title" to that page's lead image URL (sized thumbnail).
async function resolveWiki(title) {
  const api = "https://en.wikipedia.org/w/api.php?action=query&format=json" +
    "&prop=pageimages&piprop=original%7Cthumbnail&pithumbsize=500&titles=" +
    encodeURIComponent(title);
  const res = await tryFetch(api);
  if (!res.ok) throw new Error("wiki API HTTP " + res.status);
  const data = await res.json();
  const pages = (data && data.query && data.query.pages) || {};
  const page = Object.values(pages)[0];
  if (!page) return null;
  return (page.thumbnail && page.thumbnail.source) ||
         (page.original && page.original.source) || null;
}

let changed = false;
let ok = 0, skip = 0, fail = 0;

for (const e of entries) {
  if (!e.thumb) { skip++; continue; }
  const isRemote = /^https?:\/\//i.test(e.thumb);
  const isWiki = e.thumb.startsWith("wiki:");
  if (!isRemote && !isWiki) { skip++; continue; } // already a local path

  const token = e.thumb; // the exact string to replace in data.js
  try {
    // Resolve a wiki:<Title> reference to a real image URL.
    let srcUrl = e.thumb;
    if (isWiki) {
      srcUrl = await resolveWiki(e.thumb.slice(5));
      if (!srcUrl) throw new Error("no lead image found for " + e.thumb);
    }

    const m = srcUrl.split("?")[0].match(EXT);
    const ext = (m ? m[1] : "jpg").toLowerCase().replace("jpeg", "jpg");
    const rel = `img/${e.id}.${ext}`;
    const dest = path.join(root, rel);

    let res = await tryFetch(srcUrl);
    if (!res.ok) {
      const orig = originalFromThumb(srcUrl);
      if (orig) res = await tryFetch(orig);
    }
    if (!res.ok) {
      let body = "";
      try { body = (await res.text()).slice(0, 220).replace(/\s+/g, " ").trim(); } catch (_) {}
      throw new Error(`HTTP ${res.status} ${res.statusText}${body ? " :: " + body : ""}`);
    }
    const buf = Buffer.from(await res.arrayBuffer());
    fs.writeFileSync(dest, buf);
    // Replace the exact thumb token with the local path in data.js text.
    if (code.includes(token)) {
      code = code.split(token).join(rel);
      changed = true;
    }
    console.log(`saved  ${rel}  (${(buf.length / 1024).toFixed(0)} KB)`);
    ok++;
  } catch (err) {
    console.error(`FAILED ${e.id}: ${err.message}`);
    fail++;
  }
}

if (changed) {
  fs.writeFileSync(dataPath, code);
  console.log("\ndata.js updated to point at local images.");
}
console.log(`\nDone. ${ok} downloaded, ${skip} skipped (already local), ${fail} failed.`);
