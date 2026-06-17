# The Leftist Map — Project Handoff

A single-page, dependency-free interactive map of left political thought. Thinkers and
schools are cards in a force-directed "mindmap," connected by lines of intellectual
lineage, with detail modals, search, organization icons, and links to free archives and
books. Pure static HTML/CSS/JS, no build step, hostable anywhere.

This file is the source of truth for how the project is built and the conventions any
contributor (human or agent) must follow. Read it fully before changing anything.

---

## Hard rules (do not violate)

1. **No em-dashes. Ever.** The character `—` (U+2014) must never appear in any file.
   Wikipedia prose is full of them; when adapting text, replace each with a comma,
   period, colon, or parentheses. The en-dash `–` (U+2013) is allowed ONLY inside
   numeric year ranges (e.g. `1818–1883`). Verify with:
   `grep -rn $'—' data.js entries/` (must return nothing).
2. **Only edit `data.js` and add files under `entries/`.** Do NOT modify `app.js`,
   `styles.css`, `index.html`, or `tools/*.mjs`. All behavior and styling already exist;
   new content is pure data.
3. **Every entry in `data.js` must have a matching `entries/<id>.js` content file**, and
   every `id` must be unique, lowercase ASCII, no spaces or diacritics (e.g. `guerin`,
   not `guérin`). The `id` is also the content filename and the image filename.
4. **Validate before finishing.** Run `node --check data.js` and `node --check` on each
   new `entries/*.js`. Confirm no em-dashes. Confirm `parents` only reference ids that
   exist (in the file or added in the same batch).
5. **Do not invent quotes or facts.** Use real, sourced quotes, or write a clearly
   labeled `"Core idea: ..."` paraphrase when a famous line is apocryphal or disputed
   (this is the norm for Stalin, Mao, and similar). Adapt summaries from the cited
   sources; attribute them.

---

## Editorial policy: completeness without bias

The goal is an even-handed, complete map, including figures a partisan account would
omit. Concretely:

- Include the full spectrum: anarchists, council/libertarian Marxists, reformists,
  orthodox Marxists, Leninists, and the authoritarian state-communist figures alike.
- For figures responsible for atrocities (Stalin, Mao, etc.), state the crimes plainly in
  the preview and summary, with no euphemism and no hiding them.
- For contested figures, end the summary by naming both what supporters credit and what
  critics condemn, so the reader gets the disputed picture rather than a verdict.
- Add honest complicating notes where warranted (e.g. Trotsky's own record at Kronstadt),
  rather than laundering anyone.
- Do not advocate. Describe traditions and disputes; let the map inform.

---

## File map

- `index.html` — page structure: header (search, theme, and legend buttons), the
  `#timeline` container, the detail `#modal`, footer. Do not restructure.
- `styles.css` — all styling and theming (CSS variables, dark default + light mode).
- `app.js` — all behavior: renders `window.ENTRIES` into cards, runs the force-directed
  layout, draws curved lineage connectors, handles the modal, search, legend, theme, and
  lazy-loads each entry's modal content. The Bookshop affiliate id (`104178`) lives here
  in `renderLinks`; do not hardcode affiliate links anywhere else.
- `data.js` — `window.ORGS` (organization taxonomy) and `window.ENTRIES` (the index: the
  lightweight per-card data plus quote / archive / books / orgs).
- `entries/<id>.js` — one file per entry holding the heavy modal content (summary HTML,
  sources, optional reading). Loaded on demand when a card is opened.
- `img/<id>.png|jpg` — localized portrait, produced by the image script.
- `tools/fetch-images.mjs` — resolves each entry's `thumb: "wiki:Page_Title"` to that
  Wikipedia page's lead image, downloads it to `img/<id>.<ext>`, and rewrites the path in
  `data.js`. Run: `node tools/fetch-images.mjs` (Node 18+).
- `tools/fetch-books.mjs` — resolves each book `title` to an ISBN via the Open Library
  API and writes it into `data.js` so the modal can build Bookshop links. Run:
  `node tools/fetch-books.mjs`. Note: not every ISBN is stocked on Bookshop, so links
  want a spot-check.

---

## Data model

### `data.js` — one object per entry in `window.ENTRIES`

Field order does not matter. Copy the live `kautsky` entry as a template. Fields:

- `id` — unique lowercase ASCII slug; matches `entries/<id>.js` and `img/<id>.*`.
- `name` — display name.
- `school` — school-of-thought text shown on the card (e.g. `"Collectivist Anarchism"`).
  This is the IDEOLOGY label; keep it distinct from `orgs` (which is organizational).
- `years` — lifespan, en-dash range, e.g. `"1854–1938"`.
- `yearSort` — a number used for the vertical time flow. Use birth year for foundational
  figures or the year their key current emerged; it only needs to order them sensibly.
- `era` — short loose grouping label (free text), e.g. `"The orthodox centre"`.
- `parents` — array of ids this thinker descends from intellectually. Multiple allowed;
  this is what draws the connector lines and clusters the layout. Bridges between
  traditions should list a parent from each side.
- `orgs` — array of organization ids from `window.ORGS` (see below). May be empty `[]`
  for figures with no formal International/organization. This drives the small icons.
- `quote` — one signature quote (real, sourced) OR a `"Core idea: ..."` paraphrase.
- `archive` — `{ label, url }` pointing to the COLLECTED WORKS page (prefer
  `https://www.marxists.org/archive/<name>/works/index.htm`; use `/reference/archive/...`
  or `https://theanarchistlibrary.org/category/author/<slug>` where that is where they
  live). Shown as the top "[Name] Archive" button.
- `books` — array of `{ title: "..." }`. IMPORTANT: write each book exactly as
  `{ title: "Some Title" }` on its own line (the book script matches that literal string
  to inject `isbn`). Pick 1 to 3 well-known works. Leave the ISBN out; the script fills it.
- `thumb` — `"wiki:Wikipedia_Page_Title"` (underscores, exactly as in the Wikipedia URL).
  The image script localizes it. Do not paste raw image URLs.
- `thumbPos` — optional CSS `object-position`, e.g. `"center 22%"`, to keep the face in
  frame.
- `initials` — 2-letter fallback shown until the image is fetched.
- `row`, `lane` — OPTIONAL layout hints. You can OMIT both; the physics engine arranges
  everything from `parents` + `yearSort`. Optionally set `lane` to a small signed number
  (negative = lean left/anti-state, positive = lean right/reformist) as a gentle nudge.
  Do not try to hand-place coordinates.

### `entries/<id>.js` — modal content

```
/* Full modal content for: Karl Kautsky */
window.LM_CONTENT = window.LM_CONTENT || {};
window.LM_CONTENT["kautsky"] = {
  reading: [
    { label: "Stanford Encyclopedia of Philosophy: ...", url: "https://plato.stanford.edu/entries/..." }
  ],
  summary: `
    <p>First paragraph: who they were and their core contribution.</p>
    <p>Second paragraph: life and key works.</p>
    <p>Third paragraph: legacy, disputes, and (for contested figures) both what
       supporters credit and what critics condemn.</p>
  `,
  sources: [
    { label: "Wikipedia: Karl Kautsky (CC BY-SA)", url: "https://en.wikipedia.org/wiki/Karl_Kautsky" },
    { label: "Kautsky Archive (Marxists.org)", url: "https://www.marxists.org/archive/kautsky/index.htm" }
  ]
};
```

- `summary` — 2 to 3 short paragraphs of plain HTML (`<p>`, `<em>` for work titles).
  Adapt from the cited sources. Use `&amp;` for ampersands, `&ndash;` or `–` for ranges,
  and `&uuml;` etc. for accented letters inside the template. No em-dashes.
- `sources` — MUST include the Wikipedia page (this is what shows in the footer). The
  footer keeps Wikipedia and drops the archive automatically, so a second archive source
  is harmless but optional.
- `reading` — OPTIONAL academic further-reading `{ label, url }` items shown in the
  footer. Use stable canonical links only (Stanford Encyclopedia of Philosophy, Internet
  Encyclopedia of Philosophy). Do not guess at journal-article URLs.

---

## `window.ORGS` (organization icons)

Use only these ids in an entry's `orgs`. These are ORGANIZATIONAL affiliations, NOT
ideological labels (ideology is already the `school` text). Leave `orgs: []` if a figure
belonged to no formal International/organization.

- `first-intl` — First International (IWA, 1864–1876)
- `anti-auth` — Anti-Authoritarian (anarchist) International
- `second-intl` — Second International (1889–1916)
- `third-intl` — Third International / Comintern (1919–1943)
- `fourth-intl` — Fourth International (1938– )

Only add a new org id if genuinely needed, by extending `window.ORGS` with
`{ label, mono, color }` (mono = 1 to 2 chars or a symbol; pick a distinct muted color).
Prefer reusing the existing five.

---

## How the layout works

`app.js` runs a deterministic force-directed simulation: connected cards attract, all
cards repel, and `lane`/`yearSort` act as gentle hints. There is no grid and no manual
coordinates. Adding an entry with good `parents` and a `yearSort` is enough; it
self-arranges. Tuning knobs (only if asked): `L`, `K_REP`, `K_SPRING` near the top of the
`layout()` function.

---

## Validation checklist (run every batch)

1. `node --check data.js` and `node --check entries/<new>.js` for each new file.
2. `grep -rn $'—' data.js entries/` returns nothing (no em-dashes).
3. Every `id` is unique; every entry has an `entries/<id>.js`; every `parents` id exists.
4. `node tools/fetch-images.mjs` (localizes new portraits).
5. `node tools/fetch-books.mjs` (fills book ISBNs).
6. Open `index.html` in a browser; confirm new cards render, connect, and open.

---

## Status and next steps

- 51 entries exist with full data, modal content, org icons, quotes, archive + book
  links, and lineage connectors (including multi-parent bridges). Figures span the full
  spectrum from proto-anarchists through classical Marxism, anarchism, Leninism, Western
  Marxism, anti-colonial liberation, and contemporary currents.
- Out of 51, 5 images could not be resolved from Wikipedia (mariategui, cabral, ruhle,
  althusser, poulantzas); these display initials as fallback. Their wiki: entries remain
  in data.js for later manual resolution.
- Key lineage bridges added: Bakunin now linked to Proudhon; Marcuse to Marx+Gramsci;
  Lafargue to Marx+Proudhon; Serge to Trotsky+Bakunin; Guevara to Marx+Lenin+Mao;
  Federici to Marx+Angela Davis; Poulantzas to Marx+Althusser; Graeber to
  Kropotkin+Bookchin.
- In progress: bulk expansion of entries from Wikipedia / Marxists Internet Archive /
  The Anarchist Library, following this document.
- Known consideration for later: the force layout is O(n^2) per run and the connector set
  grows quickly; at a few hundred cards we will likely need performance tuning and/or
  filtered or search-driven views (e.g. show a tradition at a time). Do not try to solve
  this while adding data; just flag the count.

### Deferred feature: "Battle" mode (design, not yet built)

Pick two or more thinkers; they rise from the bottom of the screen and face off. The
earlier thinker opens with a claim; the other responds; outcomes can be agreement,
disagreement, or partial/qualified agreement (not just win/lose), narrated in
tongue-in-cheek theory language. This will be built later as its own task; no data work
is needed for it now beyond what already exists.
