# The Leftist Map — Project Handoff

A single-page, dependency-free interactive map of left political thought. Thinkers and
schools are cards arranged in a zigzag of birth-year rows, connected by curved lines of
intellectual lineage, with a hover preview, detail modals, search, an affiliation filter,
organization icons, and links to free archives and books. Pure static HTML/CSS/JS, no
build step, hostable anywhere by opening `index.html`.

This file is the source of truth for how the project is built and the conventions any
contributor (human or agent) must follow. Read it fully before changing anything. It was
last brought current at 74 entries.

---

## How to run, and the git workflow

- Open `index.html` in a browser. Nothing to install or compile. The `tools/*.mjs`
  scripts need Node 18+ but only for data maintenance, not for viewing.
- This folder is a git repo (branch `main`). Commit after each meaningful change with a
  clear message. The working tree should be left clean.
- The folder is a Cowork-mounted directory. File deletion is gated: if `rm`/git fails with
  "Operation not permitted", request delete permission (it has already been granted this
  workspace, but a fresh session may need it again). Deleting an open file can leave a
  harmless `.fuse_hidden*` artifact; `rm -f .fuse_hidden*` before `git add` keeps the tree
  tidy.

### Permissions & environment a fresh task needs

There is exactly one permission that matters, and it may or may not persist across tasks,
so assume you might have to grant it again:

- **Cowork file-deletion permission for this folder.** This is the ONLY gate. Git cannot
  function without it (it deletes its own `index.lock` and temp objects), and any `rm`
  fails without it. It is requested automatically the first time a delete fails with
  "Operation not permitted"; approve it once and git + cleanup work for the rest of the
  session. There is NO separate "git permission" beyond this.
- **No** API keys, tokens, logins, or service config of any kind.
- **Network:** the `tools/*.mjs` scripts reach `openlibrary.org`, `en.wikipedia.org`,
  `marxists.org`, and `theanarchistlibrary.org` over the sandbox's allowlisted network. No
  action needed; if a host is ever unreachable, that is a transient sandbox issue, not a
  permission.
- **Runtime:** Node 18+ (built-in `fetch`) is preinstalled in the sandbox. `jsdom` and
  `cairosvg` (used only for the optional headless verification harness) are installed
  on demand in the scratch dir, not committed.

---

## Two kinds of work (read this before editing)

1. **Adding/editing content (the common case).** Touch only `data.js` and files under
   `entries/`. All behavior and styling already exist; new figures are pure data. Follow
   the Data Model and Hard Rules below. This is safe and low-risk.
2. **Engineering (behavior/visual changes).** Editing `app.js`, `styles.css`, `index.html`
   is allowed when the task calls for it, but these are load-bearing and interrelated.
   Verify with the headless harness (see "Verifying behavior changes") before committing.

---

## Hard rules (do not violate)

1. **No em-dashes in content. Ever.** The character `—` (U+2014) must never appear in
   `data.js` or `entries/`. When adapting Wikipedia prose, replace each with a comma,
   period, colon, or parentheses. The en-dash `–` (U+2013) is allowed ONLY inside numeric
   year ranges (e.g. `1818–1883`). Verify with `grep -rn $'—' data.js entries/` (must
   return nothing). Instructional files like this one and `README.md` MAY contain the
   literal character so they can describe the rule; the verify command does not scan them.
2. **Every entry in `data.js` has a matching `entries/<id>.js`**, and every `id` is unique,
   lowercase ASCII, no spaces or diacritics (`guerin`, not `guérin`). The `id` is also the
   content filename and the image filename.
3. **Connectors must point downward in time.** Every id in a card's `parents` must have a
   `yearSort` less than or equal to that card's `yearSort`. A parent born/prominent after
   its child produces a backward connector and is a bug. Verify (see checklist).
4. **Validate before finishing.** `node --check data.js` and `node --check` each new
   `entries/*.js`; no em-dashes; every `parents`/`orgs` id exists; no backward edges.
5. **Do not invent quotes or facts.** Use real, sourced quotes, or a clearly labeled
   `"Core idea: ..."` paraphrase when a famous line is apocryphal or disputed (the norm for
   Stalin, Mao, etc.). Adapt summaries from the cited sources and attribute them.

---

## Editorial policy: completeness without bias

The goal is an even-handed, complete map, including figures a partisan account would omit.

- Include the full spectrum: anarchists, council/libertarian Marxists, reformists,
  orthodox Marxists, Leninists, the authoritarian state-communist figures, anti-colonial
  and Black-radical thinkers, feminists, and labor organizers alike.
- For figures responsible for atrocities (Stalin, Mao), state the crimes plainly in the
  preview and summary, no euphemism.
- For contested figures, end the summary by naming both what supporters credit and what
  critics condemn.
- Add honest complicating notes where warranted (e.g. Trotsky at Kronstadt). Do not
  advocate; describe traditions and disputes and let the map inform.

---

## File map

- `index.html` — page structure: header (search, filter, theme buttons + their panels),
  the `#timeline` container, the `#preview` hover box, the `#modal`, the legend button and
  panel, footer. Modal has `#modal-summary`, then `#modal-connections`, then
  `#modal-sources`.
- `styles.css` — all styling and theming (CSS variables, dark default + light mode).
- `app.js` — all behavior (see "Behavior map" below). The Bookshop affiliate id (`104178`)
  lives once in `renderLinks`; never hardcode affiliate links elsewhere.
- `data.js` — `window.ORGS` (org taxonomy) and `window.ENTRIES` (the per-card index plus
  quote / archive / books / orgs / tag).
- `entries/<id>.js` — heavy modal content (summary HTML, sources, optional reading), lazy
  loaded on open.
- `img/<id>.png|jpg|webp` — localized portrait (the loader accepts webp; cards fall back to
  `initials` if an image is missing or fails).
- `tools/fetch-images.mjs` — resolves `thumb: "wiki:Page_Title"` to that Wikipedia page's
  lead image, saves `img/<id>.<ext>`, rewrites the path in `data.js`.
- `tools/fetch-books.mjs` — resolves each book `title` to an ISBN that is actually stocked
  on Bookshop and writes it into `data.js`. It gathers candidate ISBNs from Open Library
  (author-guarded: the matched doc's `author_name` must contain the entry author's surname,
  which blocks study-guide/commentary mis-hits) and then writes only the first candidate
  that returns 200 at `bookshop.org/a/104178/<isbn>`. It re-verifies any existing isbn and
  blanks it if Bookshop no longer stocks it. Resilient: writes after every change, has a
  ~30s budget under the 45s cap, and caches confirmations in `tools/.isbn-verify-cache.json`
  (gitignored) so re-runs are fast. Run one pass per bash call; re-run until it reports
  "0 changed, 0 to-do". No hand spot-checking needed: every isbn it writes is verified live.
- `tools/check-links.mjs` — read-only verifier of archive/source/reading/book/crossref links.
  Checks several at once (bounded concurrency) so it finishes within the sandbox cap. Treats
  any `bookshop.org` 403 as bot-walled/unverifiable, not dead, and lists search-link
  fallbacks (books with no isbn) separately under `--all`. For `marxists.org` it GETs and
  scans the body, because that host serves missing pages as HTTP 200 with a "File Not Found"
  body (a soft-404 a HEAD check would miss).
- `tools/repair-links.mjs`, `tools/prune-dead-sources.mjs` — one-off cleanup scripts
  already run; keep for reference.

---

## Data model — one object per entry in `window.ENTRIES`

Field order does not matter. Fields:

- `id` — unique lowercase ASCII slug; matches `entries/<id>.js` and `img/<id>.*`.
- `name` — display name (diacritics fine here, e.g. `"Slavoj Žižek"`).
- `school` — ideology/current shown on the card (e.g. `"Collectivist Anarchism"`). Keep
  distinct from `orgs` (organizational).
- `years` — lifespan, en-dash range (`"1854–1938"`) or `"b. 1947"`.
- `yearSort` — the number that orders cards top-to-bottom. It is NOT strictly a birth year:
  it is an era/prominence ordinal chosen so lineage flows downward (e.g. Bakunin is 1868,
  not his 1814 birth, so he sits below Marx whom he descends from). When adding a figure,
  pick a value that places them among their actual influences and keeps rule #3 (no
  backward edges).
- `era` — short free-text grouping label.
- `parents` — array of ids this thinker descends from. Drives the connector lines. Multiple
  allowed; bridges list a parent from each tradition. Must obey rule #3.
- `orgs` — array of org ids from `window.ORGS` (see below). May be `[]`.
- `quote` — one real sourced quote OR a `"Core idea: ..."` paraphrase.
- `archive` — `{ label, url }`. Prefer the collected-works page on
  `marxists.org/archive/<name>/` or `theanarchistlibrary.org/category/author/<slug>`. If no
  archive exists, use `{ label: "...", url: "" }` (the button is hidden when url is empty).
- `books` — array of `{ title: "..." }`, each on its own line (the book script matches the
  literal string to inject `isbn`). Leave ISBN out; `fetch-books.mjs` fills it with a
  Bookshop-verified ISBN. Every book renders a buy button: a direct product link when an
  isbn is present, otherwise a title+author Bookshop search link (so older/obscure works
  with no stocked edition still get a working, never-404 button).
- `thumb` — `"wiki:Wikipedia_Page_Title"`; the image script localizes it to `img/<id>`. If
  Wikipedia exposes no API lead image, the fetch fails and the card shows `initials` (add
  an image manually to `img/<id>.<ext>` and point `thumb` at it).
- `thumbPos` — optional CSS `object-position` (e.g. `"center 22%"`).
- `initials` — fallback text shown when no image.
- `tag` — OPTIONAL. Overrides the auto-derived surname used on connection-tag chips. Only
  needed to disambiguate shared surnames; currently `clrjames` → `"C. L. R. James"` and
  `selma-james` → `"S. James"` (the only collision among 74 entries).
- `center`, `pinNear`, `row`, `lane` — VESTIGIAL. Earlier layouts used these; the current
  zigzag layout ignores them. Leave existing ones in place (harmless); do not rely on them.

### `entries/<id>.js` — modal content

```
window.LM_CONTENT = window.LM_CONTENT || {};
window.LM_CONTENT["kautsky"] = {
  reading: [ { label: "Stanford Encyclopedia of Philosophy: ...", url: "https://plato.stanford.edu/entries/..." } ],
  summary: `
    <p>Who they were and their core contribution.</p>
    <p>Life and key works (<em>Work Title</em>).</p>
    <p>Legacy and disputes; for contested figures, what supporters credit and critics condemn.</p>
  `,
  sources: [
    { label: "Wikipedia: Karl Kautsky (CC BY-SA)", url: "https://en.wikipedia.org/wiki/Karl_Kautsky" },
    { label: "Kautsky Archive (Marxists.org)", url: "https://www.marxists.org/archive/kautsky/index.htm" }
  ],
  crossrefs: [
    { about: "lenin", label: "The Dictatorship of the Proletariat (1918)", url: "https://www.marxists.org/archive/kautsky/1918/dictprole/index.htm" },
    { about: "trotsky", label: "Terrorism and Communism (1919)", url: "https://www.marxists.org/archive/kautsky/1919/terrcomm/index.htm" }
  ]
};
```

- `summary` — 2 to 3 short `<p>` paragraphs. Use `&amp;`, `&ndash;`/`–` for ranges, named
  entities or literal accented letters. No em-dashes.
- `sources` — MUST include the Wikipedia page (the footer shows Wikipedia + `reading` and
  drops the archive source, which is the top button).
- `reading` — OPTIONAL stable academic/encyclopedic links (SEP, IEP). Do not guess journal
  URLs. SEP exists for some figures (Marx, Engels, Luxemburg) and not others (Lenin, Trotsky,
  Stalin, Kautsky have none); when there is no SEP/IEP entry, prefer leaving `reading` out
  over padding it with a tangential paper. Britannica is bot-walled (403) and not auto-
  verifiable, so avoid it.
- `crossrefs` — OPTIONAL. Works THIS thinker wrote about (or in direct answer to) ANOTHER
  figure on the map: `{ about: "<entry-id>", label, url }`. `about` must be a real entry id.
  The modal renders these under "On fellow thinkers" with an "on <Name>" tag, and the id
  makes them the raw material for the planned debate mode. Add the reciprocal
  where it exists (Lenin's reply to Kautsky on one card, Kautsky's original on the other).
  Prefer a primary full text on `marxists.org`/`theanarchistlibrary.org`. Co-authored works
  (e.g. the Manifesto) count and go on both authors' cards. Verify every URL (see below).

---

## `window.ORGS` (affiliation icons) — 6 ids

These are ORGANIZATIONAL affiliations, not ideology. Leave `orgs: []` if none apply.

- `first-intl` — First International (IWA, 1864–1876)
- `anti-auth` — Anarchist movement (Anti-Authoritarian International)
- `second-intl` — Second International (1889–1916)
- `third-intl` — Third International / Comintern (1919–1943)
- `fourth-intl` — Fourth International (1938– )
- `frankfurt` — Frankfurt School
- `industrial` — Industrial Unionism (IWW / CIO tradition); currently `connolly`, `parsons`
  (IWW), `mazzocchi` (CIO), `mcalevey` (contemporary). Kept separate from anarcho-
  syndicalism on purpose.

Add a new org only if genuinely needed: extend `window.ORGS` with `{ label, mono, color }`.
The badge grows to fit the mono, so 2 to 3 characters are fine; pick a distinct muted
color. These also populate the legend key and the filter.

---

## How the layout works (zigzag rows)

`app.js` `layout()` is deterministic, no physics:

1. Cards are sorted by `yearSort` (strict birth-order reading), pure birth-year sequence.
2. The sequence is sliced into rows of a fixed `perRow` count computed from the viewport
   width (responsive; leaves room for the nudge so a shifted row never clips the rails).
3. Each row is evenly spaced and centered on the axis, then nudged: even rows shift left,
   odd rows shift right, by `ZIG` (a small fraction of the spacing). This zigzag keeps the
   inter-row connectors at an angle instead of stacking into right angles.
4. Rows stack vertically using real card heights; height is set on `#timeline`.

There is no Marx-centering or pin special case anymore: in birth-year order Marx lands near
the middle of the top rows on common desktop widths, with Engels beside him. Tuning knobs
near the top of `layout()`: `SP` (spacing), `ZIG` (nudge), `VGAP` (row gap).

History worth knowing (so it is not re-litigated): we tried a hand-rolled force-directed
simulation (rail-stacking, width blow-ups) and a barycenter genealogy tree (left/right
holes, uneven row counts). The user chose the zigzag grid for its consistency. Do not
reintroduce physics or barycenter placement without an explicit ask.

---

## Behavior map (where things live in app.js)

- Render: builds `.entry > .card` for each entry, sorted by `yearSort`; attaches hover,
  focus, click handlers.
- `connectionsOf(e)` / `childrenMap` / `shortName(e)` / `renderConnTags(container, e)` —
  the connection-tag system. A card's connections = its `parents` plus the cards that name
  it as a parent. Chips show `entry.tag || shortName(entry)`.
- Hover preview (`openPreview`/`hidePreview`/`scheduleHidePreview`): an interactive
  `#preview` box (pointer-events auto) with summary text, a "Connects to" row of clickable
  chips, and an `×` close button. Safe-hover: stays open while the pointer/focus is over the
  card OR the box; hides on a 260ms grace timer. `openPreview` extinguishes the previous
  card's lit connectors before lighting the new one (prevents stranded highlights).
  Hover-intent applies to the BOX ONLY, not the connectors. The mouse path is `onCardEnter`,
  which (1) lights the card's connectors immediately via `lightCard` (tracked by `litId`,
  separate from the box's `previewId`) and (2) calls `requestPreview`, which waits
  `PREVIEW_SHOW_DELAY` (280ms) of linger before opening the box. So sweeping the pointer
  highlights lineage instantly card-to-card while the box never pops; a card-leave cancels a
  pending open (`cancelPreviewShow`). Entering a different card while a box is open dismisses
  that stale box at once (the new one still waits out the linger). `hidePreview` extinguishes
  `litId` and clears the box together, so the grace-hide is unchanged. Keyboard `focus` calls
  `openPreview` directly (box immediate, no linger) for accessibility.
  Placement is `computePreviewPos(r, pw, ph, vw, vh, gap)` (pure, unit-tested via the
  `window.__LM_TEST__` seam): it prefers BELOW the card, then ABOVE (the zigzag row gap is
  the emptiest space), and only falls back to the right/left side when neither fits, always
  clamped inside the viewport.
- `litConnectors(id, on)` — toggles the `.lit` class on connector paths touching a card.
- Modal (`openModal`): header, quote, link buttons, lazy summary, then
  `#modal-connections` (same chips, click closes modal + jumps), then the sources footer.
  The footer builds "Sources & further reading" (Wikipedia + `reading`) and, when the entry
  has `crossrefs`, a second "On fellow thinkers" block, each link tagged `on <Name>`
  (resolved from the `about` id via `byId`).
- `jumpToCard(id)` — used by search results AND connection chips. Scrolls the card to
  center and plays the `cardjump` highlight (hover-style lift + radiating red glow, ~1.5s)
  while lighting its connectors.
- Search (`renderResults`): filters by name/school; each result has "open" (modal) and a
  pin "jump" button.
- Filter (`activeFilters`, `applyFilter`, `toggleFilter`): funnel button in header + a tiny
  funnel toggle on each legend row, kept in sync via `[data-filter]` + `syncFilterUI`.
  Multi-select, OR logic, empty = show all. Non-matching cards get `.filtered-out` (fade);
  `layout()` skips them and the rest reflow. `lm-animate` is toggled on `#timeline` only
  during a filter change so the slide animates (not on resize/load).
- `drawConnectors()` — curved SVG paths; skips any connector touching a `.filtered-out`
  card. `reflowConnectors(dur)` redraws each frame for ~580ms so curves track cards while
  they slide during a filter reflow.
- Theme, legend, mobile auto-summary: as before.

---

## Book links (Bookshop) — how it works, the process, and a known limitation

**How a buy button is built.** Each book in `data.js` is `{ title }` or `{ title, isbn }`.
The modal (`renderLinks` in `app.js`) builds the link two ways, and EVERY book gets a button:
- isbn present: `https://bookshop.org/a/104178/<isbn>`, a direct affiliate product link.
- no isbn: `https://bookshop.org/search?keywords=<title author>&affiliate=104178`, a
  title+author search. A search page always resolves for a human, so it never 404s.

**Why two ways (the failure this fixes).** The old approach pinned every button to one
Open Library ISBN and trusted it. Open Library knows about editions Bookshop does not stock,
so a third of the buttons 404'd. An ISBN is only written now if Bookshop actually serves it;
books with no stocked edition fall back to the search link instead of pointing nowhere.

**How the ISBNs get there (the process, repeat it for new books).**
1. Add the book as `{ title: "..." }` (no isbn). Run `node tools/fetch-books.mjs`, one pass
   per bash call (chaining passes in one call hits the timeout and they collide), and re-run
   until a pass reports "0 changed, 0 to-do".
2. Per book it gathers candidate ISBNs from Open Library (queries in order: title+author,
   title, subtitle-stripped, general), keeps only docs whose `author_name` contains the
   entry author's surname, then writes the FIRST candidate that returns 200 at
   `bookshop.org/a/104178/<isbn>`. The author guard blocks similar-titled commentaries and
   study guides (this really happened: Beauvoir got "Nature of the Second Sex", Graeber a
   Debt study guide, Davis an unrelated anthology). If you ever loosen the queries, keep it.
3. It also RE-VERIFIES any isbn already in `data.js` against Bookshop and blanks one that no
   longer resolves, so stale stock self-heals on the next run. The script is therefore the
   repair tool too: to fix a dead book link, just re-run it. Confirmations are cached in
   `tools/.isbn-verify-cache.json` (gitignored, 30-day TTL) so re-runs are fast; a book with
   no stocked edition is negative-cached so passes do not keep re-resolving it.
4. Validate with `node tools/check-links.mjs`: book product links should report 0 dead
   (the script only writes verified ISBNs). Also confirm all isbns are well-formed
   (`/^(97[89]\d{10}|\d{9}[\dX])$/`) and no isbn appears on two DIFFERENT books (a shared
   isbn is a mis-hit, EXCEPT the legitimately co-authored `Dialectic of Enlightenment`,
   which Adorno and Horkheimer share on purpose).

**Residual caveat.** A search-link fallback lands on a results page, not a product page, and
Bookshop's search endpoint is bot-walled (it 403s any script), so the checker cannot
auto-verify those links; they are valid by construction. And because retail stock changes,
an ISBN verified today can stop being stocked later. That is caught the next time
`fetch-books.mjs` or `check-links.mjs` runs, so re-run them periodically rather than treating
the data as permanently correct.

---

## Citations and cross-references (the process)

The `reading` and `crossrefs` fields are being built out per entry. The goal is a clean,
verifiable citation section, not volume: a few well-chosen links beat seven sloppy ones.

Sourcing, in priority order:

1. **Primary cross-references first.** A work the thinker wrote about another figure on the
   map, ideally a full text on `marxists.org` or `theanarchistlibrary.org`. These are the
   richest material and the seed for debate mode. Add the reciprocal where it exists.
2. **Encyclopedic.** Stanford Encyclopedia of Philosophy (`plato.stanford.edu/entries/<x>/`)
   where an entry exists; the Internet Encyclopedia of Philosophy otherwise. Both are open
   and authoritative.
3. **Academic.** Use the open scholarly-metadata APIs (no key needed) the way a tool like
   Zotero does: OpenAlex (`api.openalex.org/works?search=...&filter=is_oa:true`) and Crossref
   (`api.crossref.org/works?query=...`) to find DOIs, preferring open-access. EYEBALL the
   results: a keyword search returns a lot of tangential papers, so only keep ones clearly
   and centrally about the figure. A wrong citation is worse than none.

Do NOT use Sci-Hub or other pirated-paper mirrors. Do not invent works or guess URLs.

Verification (mandatory, this is the whole point):

- Confirm the page actually exists before writing the link. `marxists.org` returns HTTP 200
  with a "File Not Found" body for missing pages, so check the page TITLE/body, not just the
  status (fetch the page and read its `<title>`; `check-links.mjs` now does this for that
  host automatically). Several plausible paths 404 or soft-404, so test, do not assume.
- After writing, run `node tools/check-links.mjs` and confirm 0 dead for the entries touched.
- Every `crossrefs[].about` must be a real entry id (a quick node script over `LM_CONTENT`
  catches typos).

Status of the build-out: a first cluster is done as a pilot (see Current status). The same
process scales to the rest of the map cluster by cluster.

---

## Verifying behavior changes (headless harness)

When changing `app.js`/`styles.css`/`index.html`, verify with jsdom in the sandbox before
committing (this caught real bugs this session):

- `npm install jsdom --no-save` in the scratch dir, build a JSDOM from `index.html` (strip
  the two `<script src>` tags), stub `window.matchMedia` and `requestAnimationFrame`, then
  `new window.Function(code).call(window)` for `data.js` then `app.js`.
- Dispatch events (`mouseenter`, `click`) to exercise hover/preview/filter/modal and assert
  on DOM state (e.g. `.lit` count, `.filtered-out` count, chip counts).
- For layout/visual tuning, render an SVG mock of card positions and rasterize with
  `cairosvg` to actually look at it before editing the real file.

---

## Validation checklist (run every batch)

1. `node --check data.js` and `node --check entries/<new>.js`.
2. `grep -rn $'—' data.js entries/` returns nothing.
3. Every `id` unique; every entry has `entries/<id>.js`; every `parents`/`orgs` id exists;
   no backward edges (parent `yearSort` <= child `yearSort`). A quick node script that
   loads `window.ENTRIES` and checks all of this is the fastest way.
4. `node tools/fetch-images.mjs` for new portraits (manual add if Wikipedia has none).
5. `node tools/fetch-books.mjs` for ISBNs, one pass per bash call, until "0 changed,
   0 to-do". Then `node tools/check-links.mjs` should report 0 dead book links.
6. If you touched `reading`/`crossrefs`: every `crossrefs[].about` is a real entry id, and
   `node tools/check-links.mjs` reports 0 dead (it soft-404-checks marxists.org).
7. `rm -f .fuse_hidden*`, then commit.

---

## Current status

- 74 entries with full data, modal content, org icons, quotes, connectors, and connection
  tags. Coverage spans proto-socialists, classical Marxism, anarchism and anarcho-
  syndicalism, Leninism and its authoritarian outcomes, council/left communism, Western
  Marxism and the Frankfurt School, anti-colonial and Black-radical thought, a strong
  leftist-feminist set, and a labor-organizing branch (IWW → CIO → Mazzocchi → McAlevey,
  plus Fred Ross's community-organizing line into McAlevey).
- All portraits are localized (no `wiki:` thumbs remain).
- Book buy-links overhauled to be reliable: 131 of 150 books carry an ISBN that was
  verified live on Bookshop (`/a/104178/<isbn>` returns 200), and the other 19 (older or
  obscure works with no stocked edition) fall back to a title+author Bookshop search link.
  Every book renders a working button; `check-links.mjs` reports 0 dead, down from 95.
  ISBNs are no longer trusted on faith: `fetch-books.mjs` confirms each against Bookshop
  before writing it and re-verifies/blanks stale ones on re-run.
- Features built this session: interactive hover preview with connection chips + close
  button; connection chips in the modal; search jump + the `cardjump` flash; the affiliation
  filter (header + legend, multi-select, animated reflow); the `industrial` org; the zigzag
  layout; the `tag` override.
- Citations build-out STARTED. The `crossrefs` field and its modal section ("In their own
  words: on fellow thinkers") exist, and a pilot cluster is done: marx, engels, lenin,
  trotsky, stalin, kautsky, luxemburg (18 verified cross-references plus SEP further-reading
  where it exists). All reciprocal (Lenin↔Kautsky, Lenin↔Luxemburg, Lenin↔Trotsky,
  Lenin↔Stalin, Trotsky↔Stalin, Trotsky↔Kautsky, Marx↔Engels). The remaining ~67 entries
  still need this treatment, cluster by cluster, per "Citations and cross-references".

---

## Deferred ideas / next steps

- Extend `crossrefs`/`reading` to the remaining ~67 entries, cluster by cluster, following
  "Citations and cross-references". Natural next clusters: the anarchists (Bakunin, Kropotkin,
  Malatesta, Goldman, Berkman) and the Frankfurt School (Adorno, Horkheimer, Marcuse, Benjamin,
  Fromm), both dense with works-about-each-other.
- Possible labor-organizing expansion (Alinsky, Mazzocchi peers) if the branch grows.
- "Battle" mode (designed, not built): pick two+ thinkers; they rise and face off; the
  earlier opens a claim, the other responds; outcomes can be agreement, disagreement, or
  qualified agreement, narrated in tongue-in-cheek theory language. The `crossrefs` field now
  feeds this directly: it records which thinker wrote about which (the `about` id) and links
  the primary text, so the debate can be grounded in their own words rather than invented.
