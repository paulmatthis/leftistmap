# Prompt for the bulk card-building agent

You are extending an existing static web project called "The Leftist Map," located in
this workspace folder. Your job is to add many new entries (thinkers and schools of left
political thought) by following the project's established conventions EXACTLY, without
breaking anything.

## Step 0: orient yourself before writing anything
1. Read `HANDOFF.md` in full. It is the source of truth for the data model, conventions,
   policy, and validation steps. Follow it precisely.
2. Read `data.js` and study the existing `kautsky` and `bakunin` entries as templates.
3. Read `entries/kautsky.js` and `entries/bakunin.js` as content-file templates.
4. Do not start generating until you have mirrored these formats.

## What you may and may not touch
- You MAY append new objects to `window.ENTRIES` in `data.js`, and create new
  `entries/<id>.js` files.
- You MUST NOT modify `app.js`, `styles.css`, `index.html`, or `tools/*.mjs`. The
  behavior and styling already exist; you are only adding data.
- You MAY extend `window.ORGS` only if a genuinely new organization is required; prefer
  the existing five org ids.

## The non-negotiable rules (repeating the critical ones from HANDOFF.md)
- NO em-dash characters (`—`) anywhere, in any file. Replace them with commas, periods,
  colons, or parentheses when adapting source text. En-dash (`–`) is allowed only in
  numeric year ranges. After each batch, run `grep -rn $'—' data.js entries/` and fix any
  hit.
- Every entry needs a unique lowercase ASCII `id`, a matching `entries/<id>.js` file, and
  `parents` that reference existing ids.
- Books must be written exactly as `{ title: "Some Title" }` (one per line, no ISBN) so
  the book script can fill ISBNs.
- Images: set `thumb: "wiki:Wikipedia_Page_Title"`; never paste raw image URLs.
- Quotes: real and sourced, or a clearly labeled `"Core idea: ..."` paraphrase. Never
  fabricate.
- Summaries: 2 to 3 short paragraphs, adapted and attributed from the sources, plain HTML.

## Editorial policy: completeness without bias
Build an even-handed, complete map, including figures a partisan would leave out. State
atrocities plainly for the figures responsible for them. For contested figures, close the
summary with both what supporters credit and what critics condemn. Add honest
complicating notes rather than laundering anyone. Do not advocate.

## Where to source
Use Wikipedia (lead section) for the biographical summary and the `Wikipedia` source
link; use the Marxists Internet Archive (`marxists.org`) collected-works pages and The
Anarchist Library (`theanarchistlibrary.org`) author pages for the `archive` link. You
may use the Marxists.org and Anarchist Library author indexes as the master lists of who
to add. Prefer breadth: the Internationals, anarchists, council and libertarian Marxists,
reformists, Leninists, and later/global figures alike.

## Per-card workflow
For each new figure:
1. Choose a unique `id`.
2. Add the `data.js` entry: name, school, years (en-dash), yearSort, era, parents (link
   to existing ids where there is a real lineage), orgs (from the five ids, or `[]`),
   quote, archive `{label,url}`, books (1 to 3 `{ title }` objects), thumb
   (`wiki:Title`), thumbPos (optional), initials. You may omit `row`/`lane`; the layout
   engine arranges everything.
3. Create `entries/<id>.js` with summary (2 to 3 `<p>` paragraphs), sources (must include
   the Wikipedia page), and optional reading (stable academic links only, e.g. Stanford
   Encyclopedia of Philosophy).
4. Keep formatting and indentation identical to the existing entries.

## Work in small, validated batches
Add roughly 5 to 10 entries at a time, then run the validation checklist from HANDOFF.md:
`node --check data.js`, `node --check` on each new content file, the em-dash grep, an
id-uniqueness and parents-exist check, then `node tools/fetch-images.mjs` and
`node tools/fetch-books.mjs`. Only continue once a batch is clean. Never leave the project
in a state where `data.js` fails `node --check`.

## Lineage guidance
Connectors come from `parents`. Give each figure the intellectual predecessor(s) already
on the map where a real influence exists; multiple parents are encouraged, especially for
figures who bridge traditions. Do not connect everyone to Marx by default; use the most
direct, accurate influence.

## When you are done (or pause)
Leave `data.js` valid, all images and books resolved, and add a short note at the bottom
of `HANDOFF.md` under "Status and next steps" listing which figures you added, so the next
session can pick up cleanly.
