# The Leftist Map

An interactive, single-page map of left political thought. Thinkers and schools are drawn
as cards in a branching genealogy, connected by lines of intellectual lineage, with detail
modals, search, organization icons, and links to free archives and books. It is pure
static HTML, CSS, and JavaScript with no build step and no dependencies, so it can be
opened directly or hosted anywhere.

## Running it

Open `index.html` in a browser. That is all. There is nothing to install or compile.

Some helper scripts under `tools/` use Node 18+ (see below), but they are only for
maintaining the data, not for viewing the map.

## Project layout

- `index.html`: page structure: header (search, theme toggle, legend), the `#timeline`
  container the map draws into, the detail `#modal`, and the footer.
- `styles.css`: all styling and theming, with CSS variables and a dark default plus a
  light mode.
- `app.js`: all behavior: it renders the cards, computes the layout, draws the lineage
  connectors, and handles the modal, search, legend, and theme. The Bookshop affiliate id
  lives here in `renderLinks`; affiliate links are not hardcoded anywhere else.
- `data.js`: `window.ORGS` (the organization taxonomy) and `window.ENTRIES` (the
  lightweight per-card index: name, school, dates, lineage, quote, archive, books, orgs).
- `entries/<id>.js`: one file per entry holding the heavier modal content (the summary
  HTML, sources, and optional further reading). Loaded on demand when a card is opened.
- `img/<id>.png|jpg`: a localized portrait per entry.
- `tools/`: Node maintenance scripts (image fetch, book ISBN lookup, link checking).
- `HANDOFF.md`: the detailed contributor guide and editorial policy.

## Data model

Each entry is one object in `window.ENTRIES` (in `data.js`). The important fields:

- `id`: unique lowercase ASCII slug. It is also the content filename (`entries/<id>.js`)
  and the image filename (`img/<id>.*`).
- `name`, `school`, `years`: display name, ideological current, and lifespan.
- `yearSort`: a number used only for vertical ordering (top = earliest).
- `parents`: array of ids this thinker descends from intellectually. This is what draws
  the connector lines and shapes the tree. Bridges between traditions list a parent from
  each side. A parent should always have a `yearSort` at or before the child's, so every
  connector points downward in time.
- `orgs`: array of organization ids from `window.ORGS`; drives the small icons. May be
  empty.
- `quote`, `archive`, `books`: the signature quote, the collected-works archive link, and
  one to three notable works (Bookshop links are built from the ISBNs).
- `center`: set `true` on exactly one entry (Marx) to anchor it on the centre axis.
- `pinNear`: id of a partner this card should sit beside (Engels uses this to stay next
  to Marx).

The matching content file looks like:

```js
window.LM_CONTENT["marx"] = { summary: "<p>...</p>", sources: [...], reading: [...] };
```

## How the layout works

`app.js` arranges the cards with a deterministic layered-genealogy algorithm (no physics,
no manual coordinates):

1. Cards are sorted by `yearSort` and split into evenly sized horizontal **bands** by era,
   earliest at the top.
2. Within each band, every card is pulled toward the average horizontal position of its
   parents and children (a barycentre relaxation), so lineages branch into a readable tree
   rather than a flat list.
3. Marx and Engels straddle the centre axis; every other band is centred too.
4. A per-band spacing and rail keep the whole map inside the visible width, so nothing is
   ever cut off and it scrolls vertically.

Because positions are computed rather than simulated, the same data always produces the
same arrangement, with no overlaps and no width blow-ups. It re-runs on window resize.

## Editorial policy

The goal is an even-handed, complete map, including figures a partisan account would omit.
State atrocities plainly, give contested figures both what supporters credit and what
critics condemn, and describe traditions and disputes rather than advocating. See
`HANDOFF.md` for the full policy.

## House style

One hard rule worth repeating here: **No em-dashes. Ever.** The character `—` (U+2014) must never appear in any file besides instructions like this one on how to ensure it is not used. Wikipedia prose is full of them; when adapting text, replace each with a comma, period, colon, or parentheses. The en-dash `–` (U+2013) is allowed ONLY inside numeric year ranges (e.g. `1818–1883`). Verify with: `grep -rn $'—' data.js entries/` (must return nothing).

## Maintenance scripts (Node 18+)

- `node tools/fetch-images.mjs`: resolves each entry's `thumb: "wiki:Page_Title"` to that
  Wikipedia page's lead image, saves it under `img/`, and rewrites the path in `data.js`.
- `node tools/fetch-books.mjs`: looks up an ISBN for each book title via Open Library and
  writes it into `data.js` so the modal can build Bookshop links.
- `node tools/check-links.mjs`: verifies the archive, source, reading, and book links.

After editing data, run `node --check data.js` and `node --check entries/<id>.js`, confirm
no em-dashes, and confirm every `parents` id refers to an entry that exists.
