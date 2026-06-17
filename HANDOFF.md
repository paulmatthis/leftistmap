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
- `tools/fetch-books.mjs` — resolves each book `title` to an ISBN via Open Library and
  writes it into `data.js`. Resilient: writes after every hit and stops before the 45s
  sandbox cap, so re-run it until it reports no new resolutions (each pass skips books that
  already have an isbn). It tries title+author, title, subtitle-stripped, and general
  queries, and REQUIRES the matched book's `author_name` to contain the entry author's
  surname (prevents study-guide/commentary mis-hits). Spot-check a few links on bookshop.org.
- `tools/check-links.mjs` — read-only verifier of archive/source/reading/book links.
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
  literal string to inject `isbn`). Leave ISBN out; the script fills it. The modal renders
  a Bookshop button only for books that HAVE an isbn.
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
  ]
};
```

- `summary` — 2 to 3 short `<p>` paragraphs. Use `&amp;`, `&ndash;`/`–` for ranges, named
  entities or literal accented letters. No em-dashes.
- `sources` — MUST include the Wikipedia page (the footer shows Wikipedia + `reading` and
  drops the archive source, which is the top button).
- `reading` — OPTIONAL stable academic links (SEP, IEP). Do not guess journal URLs.

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
- `litConnectors(id, on)` — toggles the `.lit` class on connector paths touching a card.
- Modal (`openModal`): header, quote, link buttons, lazy summary, then
  `#modal-connections` (same chips, click closes modal + jumps), then sources footer.
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

**How a buy button is built.** Each book in `data.js` is `{ title, isbn }`. The modal
(`renderLinks` in `app.js`) builds `https://bookshop.org/a/104178/<isbn>` and renders a
button ONLY when the book has an `isbn`. No isbn = no button (graceful).

**How the ISBNs get there (the process used, repeat it for new books).**
1. `tools/fetch-books.mjs` looks each `title` up on the free Open Library search API and
   writes the resulting ISBN back into `data.js`. It is resilient: it writes after every
   hit and stops before the 45s sandbox cap, so you RE-RUN it until a pass reports no new
   resolutions (each pass skips books that already have an isbn). Running it as a chained
   loop in one bash call will hit the timeout and the processes collide; run one pass per
   bash call.
2. It tries several queries in order (title+author, title, subtitle-stripped, general) and
   REQUIRES the matched doc's `author_name` to contain the entry author's surname. This
   author guard exists because the looser queries otherwise grab similar-titled
   commentaries and study guides (this actually happened: Beauvoir got "Nature of the
   Second Sex", Graeber got a Debt study guide, Davis got an unrelated anthology). If you
   ever loosen the queries, keep the author guard.
3. After a bulk run, REVERSE-CHECK a sample: fetch `https://openlibrary.org/isbn/<isbn>.json`
   and confirm the returned title matches. If you find mis-hits, blank all isbns
   (`code.replace(/, isbn: "[^"]*"/g, "")`) and re-fetch with the guard, rather than trying
   to surgically fix.
4. Validate: all isbns well-formed (`/^(97[89]\d{10}|\d{9}[\dX])$/`), and no isbn appears on
   two DIFFERENT books (a shared isbn is a mis-hit, EXCEPT the legitimately co-authored
   `Dialectic of Enlightenment`, which Adorno and Horkheimer share on purpose).

**Known limitation (address in the future).** Pinning a buy link to one Open Library ISBN
is fragile on two fronts: (a) Open Library often has no ISBN for older/obscure works, so
those books get no button at all (7 currently), and (b) even a valid ISBN is not
necessarily stocked on Bookshop, so a button can 404. A better future approach: link to a
Bookshop *search* by title+author (resilient, never 404s on a missing edition) or use a
curated/verified ISBN list, instead of trusting whatever single edition Open Library
returns. Until then, the script's reminder stands: spot-check links and swap unstocked
ISBNs by hand.

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
5. `node tools/fetch-books.mjs` for ISBNs (chunk it to avoid the timeout).
6. `rm -f .fuse_hidden*`, then commit.

---

## Current status

- 74 entries with full data, modal content, org icons, quotes, connectors, and connection
  tags. Coverage spans proto-socialists, classical Marxism, anarchism and anarcho-
  syndicalism, Leninism and its authoritarian outcomes, council/left communism, Western
  Marxism and the Frankfurt School, anti-colonial and Black-radical thought, a strong
  leftist-feminist set, and a labor-organizing branch (IWW → CIO → Mazzocchi → McAlevey,
  plus Fred Ross's community-organizing line into McAlevey).
- All portraits are localized (no `wiki:` thumbs remain).
- Book ISBNs populated: 143 of 150 books have author-validated ISBNs (Bookshop buttons
  render). 7 obscure pamphlets/biographies have no standard ISBN and simply show no button
  (proudhon Philosophy of Poverty, kollontai Sexual Relations and the Class Struggle,
  saint-simon New Christianity, durruti Durruti in the Spanish Revolution, pankhurst Soviet
  Russia As I Saw It, the Mazzocchi biography (different author), ross Axioms for Organizers).
- Features built this session: interactive hover preview with connection chips + close
  button; connection chips in the modal; search jump + the `cardjump` flash; the affiliation
  filter (header + legend, multi-select, animated reflow); the `industrial` org; the zigzag
  layout; the `tag` override.

---

## Deferred ideas / next steps

- Rework book buy-links so they do not depend on one Open Library ISBN (which fails
  often: missing editions, or valid-but-unstocked-on-Bookshop 404s). Prefer a Bookshop
  title+author search link or a curated ISBN list. See "Book links" above.
- A few entries could still gain academic `reading` links beyond Wikipedia.
- Possible labor-organizing expansion (Alinsky, Mazzocchi peers) if the branch grows.
- "Battle" mode (designed, not built): pick two+ thinkers; they rise and face off; the
  earlier opens a claim, the other responds; outcomes can be agreement, disagreement, or
  qualified agreement, narrated in tongue-in-cheek theory language. Its own task; no data
  work needed beyond what exists.
