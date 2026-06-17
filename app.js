/* ============================================================
   The Leftist Map: behaviour
   Renders window.ENTRIES, lazy-loads per-entry modal content,
   handles theme, preview, modal, keyboard nav, curved lineage
   connectors, and the mobile "centered entry auto-summary".
   ============================================================ */
(function () {
  "use strict";

  var timeline = document.getElementById("timeline");
  var previewEl = document.getElementById("preview");
  var modal = document.getElementById("modal");
  var root = document.documentElement;

  var byId = {};
  var sorted = (window.ENTRIES || []).slice().sort(function (a, b) {
    return a.yearSort - b.yearSort;
  });
  var lastFocused = null;
  var mqMobile = window.matchMedia("(max-width: 760px)");

  // Center the whole cloud horizontally regardless of how lanes are spread.
  var laneVals = sorted.map(function (e) { return e.lane || 0; });
  var midLane = laneVals.length
    ? (Math.min.apply(null, laneVals) + Math.max.apply(null, laneVals)) / 2
    : 0;

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  // Adjacency: a card's connections are its parents plus the cards that name it
  // as a parent (its children). Used by the hover preview and the modal.
  var childrenMap = {};
  sorted.forEach(function (e) { childrenMap[e.id] = []; });
  sorted.forEach(function (e) {
    (e.parents || []).forEach(function (p) { if (childrenMap[p]) childrenMap[p].push(e.id); });
  });
  function connectionsOf(e) {
    var out = [], seen = {};
    (e.parents || []).forEach(function (p) { if (byId[p] && !seen[p]) { seen[p] = 1; out.push(p); } });
    (childrenMap[e.id] || []).forEach(function (c) { if (!seen[c]) { seen[c] = 1; out.push(c); } });
    return out;
  }
  function shortName(e) {
    var parts = String(e.name || e.id).trim().split(/\s+/);
    var last = parts[parts.length - 1];
    if (parts.length > 1 && /^(de|du|van|von|der|della|el|la|le)$/i.test(parts[parts.length - 2])) {
      last = parts[parts.length - 2] + " " + last;
    }
    return last;
  }
  // Fill a container with a "Connects to" label and one clickable tag per
  // connected card. Returns true if any tags were added.
  function renderConnTags(container, e) {
    container.innerHTML = "";
    var ids = connectionsOf(e);
    if (!ids.length) return false;
    var label = document.createElement("span");
    label.className = "conn-label";
    label.textContent = "Connects to";
    container.appendChild(label);
    var wrap = document.createElement("span");
    wrap.className = "conn-tags";
    ids.forEach(function (cid) {
      var t = byId[cid];
      if (!t) return;
      var b = document.createElement("button");
      b.type = "button";
      b.className = "conn-tag";
      b.dataset.id = cid;
      b.textContent = t.tag || shortName(t);   // tag overrides the surname (disambiguates e.g. the two Jameses)
      b.title = t.name;
      wrap.appendChild(b);
    });
    container.appendChild(wrap);
    return true;
  }

  /* ---------- Render ---------- */
  function fillThumb(el, e) {
    el.textContent = "";
    if (e.thumb) {
      var img = document.createElement("img");
      img.src = e.thumb;
      img.alt = e.name;
      if (e.thumbPos) img.style.objectPosition = e.thumbPos;
      img.addEventListener("error", function () { el.textContent = e.initials || ""; });
      el.appendChild(img);
    } else {
      el.textContent = e.initials || "";
    }
  }

  sorted.forEach(function (e, i) {
    byId[e.id] = e;

    var entry = document.createElement("div");
    entry.className = "entry";
    entry.dataset.id = e.id;
    entry.style.setProperty("--row", e.row || 0);
    entry.style.setProperty("--lane", (e.lane || 0) - midLane);

    var card = document.createElement("button");
    card.type = "button";
    card.className = "card";

    var portrait = document.createElement("span");
    portrait.className = "portrait";
    var thumb = document.createElement("span");
    thumb.className = "thumb";
    fillThumb(thumb, e);
    portrait.appendChild(thumb);

    var text = document.createElement("span");
    text.className = "card__text";
    text.innerHTML =
      "<h3>" + esc(e.name) + "</h3>" +
      '<p class="school">' + esc(e.school) + "</p>" +
      '<p class="years">' + esc(e.years) + "</p>";

    card.appendChild(portrait);
    card.appendChild(text);
    if (e.orgs && e.orgs.length) {
      var ob = document.createElement("span");
      ob.className = "card__orgs";
      renderBadges(ob, e.orgs);
      card.appendChild(ob);
    }

    card.addEventListener("click", function () { openModal(e.id); });
    card.addEventListener("mouseenter", function (ev) { onCardEnter(e, ev.currentTarget); });
    card.addEventListener("mouseleave", function () { cancelPreviewShow(); scheduleHidePreview(); });
    card.addEventListener("focus", function () { openPreview(e, card); });
    card.addEventListener("blur", scheduleHidePreview);

    entry.appendChild(card);

    var inline = document.createElement("p");
    inline.className = "inline-preview";
    inline.textContent = e.preview || "";
    entry.appendChild(inline);

    timeline.appendChild(entry);
  });

  /* ---------- Lazy content loader ---------- */
  var loadState = {}; // id -> "loading" | "done" | "error"
  var waiters = {};   // id -> [callbacks]

  function getContent(id, cb) {
    if (window.LM_CONTENT && window.LM_CONTENT[id]) return cb(window.LM_CONTENT[id]);
    if (loadState[id] === "error") return cb(null);
    (waiters[id] = waiters[id] || []).push(cb);
    if (loadState[id] === "loading") return;
    loadState[id] = "loading";
    var s = document.createElement("script");
    s.src = "entries/" + id + ".js";
    s.onload = function () {
      loadState[id] = "done";
      var data = (window.LM_CONTENT || {})[id] || null;
      (waiters[id] || []).forEach(function (fn) { fn(data); });
      waiters[id] = [];
    };
    s.onerror = function () {
      loadState[id] = "error";
      (waiters[id] || []).forEach(function (fn) { fn(null); });
      waiters[id] = [];
    };
    document.head.appendChild(s);
  }

  /* ---------- Preview (desktop hover / keyboard focus) ---------- */
  // The preview is interactive (it holds clickable connection tags), so it uses
  // a small grace delay: it stays open while the pointer or focus is over the
  // card OR the preview itself, and only hides shortly after leaving both.
  var previewId = null;        // card whose BOX is currently shown (null when hidden)
  var litId = null;            // card whose connectors are currently lit (hover-immediate)
  var previewHideTimer = null;
  var previewShowTimer = null;
  var PREVIEW_SHOW_DELAY = 280; // hover-intent: linger this long before the box appears

  // Connector highlighting follows the pointer with NO delay: lighting one card
  // extinguishes the previous, so a swept neighbour is never left stranded lit.
  function lightCard(id) {
    if (litId === id) return;
    if (litId) litConnectors(litId, false);
    litConnectors(id, true);
    litId = id;
  }

  // Mouse enters a card. Connectors light immediately; only the BOX waits out a
  // linger (so sweeping the pointer across cards never makes the box pop). If a
  // box for some OTHER card is still open, dismiss it now (its card is no longer
  // hovered); the new card's box appears only after the linger.
  function onCardEnter(e, anchor) {
    if (mqMobile.matches || !e.preview) return;
    clearTimeout(previewHideTimer); // a pending leave-hide is moot, we are on a card again
    lightCard(e.id);
    if (!previewEl.hidden && previewId !== e.id) { previewEl.hidden = true; previewId = null; }
    requestPreview(e, anchor);
  }
  // Box-only: schedule (or re-show) the preview after the linger. Gates ONLY the
  // appear step; the connectors are already lit and the hide logic is untouched.
  function requestPreview(e, anchor) {
    clearTimeout(previewShowTimer);
    if (previewId === e.id && !previewEl.hidden) { openPreview(e, anchor); return; }
    previewShowTimer = setTimeout(function () { openPreview(e, anchor); }, PREVIEW_SHOW_DELAY);
  }
  function cancelPreviewShow() { clearTimeout(previewShowTimer); }

  function openPreview(e, anchor) {
    if (mqMobile.matches || !e.preview) return;
    clearTimeout(previewHideTimer);
    clearTimeout(previewShowTimer);
    lightCard(e.id); // ensure lit (covers the keyboard-focus path, which skips onCardEnter)
    previewId = e.id;
    previewEl.innerHTML = "";
    var close = document.createElement("button");
    close.type = "button";
    close.className = "pv-close";
    close.setAttribute("aria-label", "Close preview");
    close.innerHTML = "&times;";
    previewEl.appendChild(close);
    var p = document.createElement("p");
    p.className = "pv-text";
    p.textContent = e.preview;
    previewEl.appendChild(p);
    var cc = document.createElement("div");
    cc.className = "conn-block";
    if (renderConnTags(cc, e)) previewEl.appendChild(cc);
    previewEl.hidden = false;
    var r = anchor.getBoundingClientRect();
    var pos = computePreviewPos(r, previewEl.offsetWidth, previewEl.offsetHeight,
      window.innerWidth, window.innerHeight, 14);
    previewEl.style.left = pos.left + "px";
    previewEl.style.top = pos.top + "px";
  }
  // Where to put the preview box relative to its card. The box is now large and
  // sticky, so prefer placing it BELOW the card, then ABOVE, since the gap
  // between zigzag rows is the emptiest space. Only when neither fits (a tall
  // card in a short viewport) fall back to the side: right, then left. Always
  // clamp inside the viewport with a small margin.
  function computePreviewPos(r, pw, ph, vw, vh, gap) {
    var M = 12; // viewport margin
    // For above/below, center horizontally on the card, clamped to the viewport.
    var hCenter = Math.max(M, Math.min(r.left + r.width / 2 - pw / 2, vw - pw - M));
    var belowTop = r.bottom + gap;
    if (belowTop + ph <= vh - M) return { left: hCenter, top: belowTop };
    var aboveTop = r.top - ph - gap;
    if (aboveTop >= M) return { left: hCenter, top: aboveTop };
    // Neither below nor above fits: place to the side.
    var left = r.right + gap;
    if (left + pw > vw - M) left = r.left - pw - gap;
    left = Math.max(M, Math.min(left, vw - pw - M));
    var top = Math.max(M, Math.min(r.top, vh - ph - M));
    return { left: left, top: top };
  }
  function hidePreview() {
    clearTimeout(previewHideTimer);
    previewEl.hidden = true;
    previewId = null;
    if (litId) { litConnectors(litId, false); litId = null; }
  }
  function scheduleHidePreview() {
    clearTimeout(previewHideTimer);
    previewHideTimer = setTimeout(hidePreview, 260);
  }
  previewEl.addEventListener("mouseenter", function () { clearTimeout(previewHideTimer); });
  previewEl.addEventListener("mouseleave", scheduleHidePreview);
  previewEl.addEventListener("focusin", function () { clearTimeout(previewHideTimer); });
  previewEl.addEventListener("focusout", scheduleHidePreview);
  previewEl.addEventListener("click", function (ev) {
    if (ev.target.closest(".pv-close")) { hidePreview(); return; }
    var t = ev.target.closest(".conn-tag");
    if (!t) return;
    hidePreview();
    jumpToCard(t.dataset.id);
  });

  // Light up every connector touching a card, so its relations stand out.
  function litConnectors(id, on) {
    var svg = document.getElementById("connectors");
    if (!svg) return;
    var paths = svg.querySelectorAll("path");
    Array.prototype.forEach.call(paths, function (p) {
      if (p.getAttribute("data-from") === id || p.getAttribute("data-to") === id) {
        p.classList.toggle("lit", on);
      }
    });
  }

  // ---- Org badges, modal links, jump-to-card ----
  function orgBadge(id) {
    var o = (window.ORGS || {})[id];
    if (!o) return null;
    var b = document.createElement("span");
    b.className = "org-badge";
    b.textContent = o.mono;
    b.style.background = o.color;
    b.title = o.label;
    b.setAttribute("aria-label", o.label);
    return b;
  }
  function renderBadges(container, orgIds) {
    container.textContent = "";
    (orgIds || []).forEach(function (id) {
      var b = orgBadge(id);
      if (b) container.appendChild(b);
    });
  }
  function renderLinks(e) {
    var box = document.getElementById("modal-links");
    box.innerHTML = "";
    if (e.archive && e.archive.url) {
      var last = e.name.trim().split(/\s+/).pop();
      var a = document.createElement("a");
      a.className = "lm-link lm-link--archive";
      a.href = e.archive.url; a.target = "_blank"; a.rel = "noopener";
      a.textContent = last + " Archive";
      box.appendChild(a);
    }
    (e.books || []).forEach(function (bk) {
      var a = document.createElement("a");
      a.className = "lm-link lm-link--book";
      if (bk.isbn) {
        // Direct affiliate product page. fetch-books.mjs only writes an isbn it
        // has confirmed is stocked on Bookshop, so this resolves rather than 404s.
        a.href = "https://bookshop.org/a/104178/" + encodeURIComponent(bk.isbn);
      } else {
        // No stocked edition is known for this book, so a pinned ISBN would 404.
        // A title+author search always resolves, and still carries the affiliate id.
        a.href = "https://bookshop.org/search?keywords=" +
          encodeURIComponent(bk.title + " " + e.name) + "&affiliate=104178";
      }
      a.target = "_blank"; a.rel = "noopener";
      a.innerHTML = '<span class="lm-link__tag">Book</span> ' + esc(bk.title);
      box.appendChild(a);
    });
  }
  function jumpToCard(id) {
    var el = timeline.querySelector('.entry[data-id="' + id + '"]');
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "center", inline: "center" });
    el.classList.remove("flash");
    void el.offsetWidth; // restart the highlight animation
    el.classList.add("flash");
    litConnectors(id, true); // light its lineage like a hover
    setTimeout(function () { el.classList.remove("flash"); litConnectors(id, false); }, 1500);
  }

  /* ---------- Modal ---------- */
  function openModal(id) {
    var e = byId[id];
    if (!e) return;
    lastFocused = document.activeElement;

    document.getElementById("modal-name").textContent = e.name;
    document.getElementById("modal-school").textContent = e.school;
    document.getElementById("modal-years").textContent = e.years;

    var mt = document.getElementById("modal-thumb");
    fillThumb(mt, e);

    renderBadges(document.getElementById("modal-orgs"), e.orgs);
    var q = document.getElementById("modal-quote");
    if (e.quote) { q.textContent = e.quote; q.hidden = false; } else { q.hidden = true; }
    renderLinks(e);
    renderConnTags(document.getElementById("modal-connections"), e);

    var body = document.getElementById("modal-summary");
    var src = document.getElementById("modal-sources");
    body.innerHTML = '<p class="loading">Loading…</p>';
    src.innerHTML = "";

    getContent(id, function (data) {
      if (!data) { body.innerHTML = "<p>Content for this entry is not available yet.</p>"; return; }
      body.innerHTML = data.summary || "";
      // Footer: keep Wikipedia, drop the archive source (it's the top button now),
      // then append any academic further-reading citations.
      var cites = (data.sources || []).filter(function (s) { return /wikipedia\.org/i.test(s.url); });
      cites = cites.concat(data.reading || []);
      src.innerHTML = '<span class="src-label">Sources &amp; further reading</span>' +
        cites.map(function (s) {
          return '<a href="' + esc(s.url) + '" target="_blank" rel="noopener">' + esc(s.label) + "</a>";
        }).join("");
    });

    modal.hidden = false;
    document.body.style.overflow = "hidden";
    hidePreview();
    modal.querySelector(".modal__close").focus();
  }
  function closeModal() {
    modal.hidden = true;
    document.body.style.overflow = "";
    if (lastFocused && lastFocused.focus) lastFocused.focus();
  }
  modal.addEventListener("click", function (ev) {
    if (ev.target.hasAttribute("data-close")) closeModal();
  });
  // A connection tag in the modal closes it and jumps to that card.
  document.getElementById("modal-connections").addEventListener("click", function (ev) {
    var t = ev.target.closest(".conn-tag");
    if (!t) return;
    closeModal();
    jumpToCard(t.dataset.id);
  });
  document.addEventListener("keydown", function (ev) {
    if (ev.key !== "Escape") return;
    if (!modal.hidden) closeModal();
    else if (!document.getElementById("legend-panel").hidden) {
      document.getElementById("legend-panel").hidden = true;
      document.getElementById("legend-toggle").setAttribute("aria-expanded", "false");
    }
    else if (!document.getElementById("search-panel").hidden) {
      document.getElementById("search-panel").hidden = true;
      document.getElementById("search-toggle").setAttribute("aria-expanded", "false");
    }
    else if (!document.getElementById("filter-panel").hidden) {
      document.getElementById("filter-panel").hidden = true;
      document.getElementById("filter-toggle").setAttribute("aria-expanded", "false");
    }
  });

  /* ---------- Search ---------- */
  var searchToggle = document.getElementById("search-toggle");
  var searchPanel = document.getElementById("search-panel");
  var searchInput = document.getElementById("search-input");
  var searchResults = document.getElementById("search-results");

  function renderResults(query) {
    var q = (query || "").trim().toLowerCase();
    var matches = sorted.filter(function (e) {
      if (!q) return true;
      return e.name.toLowerCase().indexOf(q) >= 0 ||
        (e.school || "").toLowerCase().indexOf(q) >= 0;
    });
    searchResults.innerHTML = "";
    if (!matches.length) {
      var li = document.createElement("li");
      li.className = "search-empty";
      li.textContent = "No matches.";
      searchResults.appendChild(li);
      return;
    }
    matches.forEach(function (e) {
      var li = document.createElement("li");
      var row = document.createElement("div");
      row.className = "search-result";

      var open = document.createElement("button");
      open.type = "button";
      open.className = "open";
      open.innerHTML = '<span class="r-name">' + esc(e.name) + "</span>" +
        '<span class="r-school">' + esc(e.school) + "</span>";
      open.addEventListener("click", function () { closeSearch(); openModal(e.id); });

      var jump = document.createElement("button");
      jump.type = "button";
      jump.className = "jump";
      jump.title = "Jump to card";
      jump.setAttribute("aria-label", "Jump to " + e.name + " on the map");
      jump.innerHTML = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="10" r="3"></circle><path d="M12 21s-7-5.5-7-11a7 7 0 0 1 14 0c0 5.5-7 11-7 11z"></path></svg>';
      jump.addEventListener("click", function () { closeSearch(); jumpToCard(e.id); });

      row.appendChild(open);
      row.appendChild(jump);
      li.appendChild(row);
      searchResults.appendChild(li);
    });
  }

  function openSearch() {
    searchPanel.hidden = false;
    searchToggle.setAttribute("aria-expanded", "true");
    renderResults(searchInput.value);
    searchInput.focus();
    searchInput.select();
  }
  function closeSearch() {
    searchPanel.hidden = true;
    searchToggle.setAttribute("aria-expanded", "false");
  }
  function toggleSearch() {
    if (searchPanel.hidden) openSearch(); else closeSearch();
  }

  searchToggle.addEventListener("click", toggleSearch);
  searchInput.addEventListener("input", function () { renderResults(searchInput.value); });
  searchInput.addEventListener("keydown", function (ev) {
    if (ev.key === "Enter") {
      var first = searchResults.querySelector("button");
      if (first) first.click();
    }
  });
  document.addEventListener("click", function (ev) {
    if (!searchPanel.hidden &&
        !searchPanel.contains(ev.target) &&
        !searchToggle.contains(ev.target)) {
      closeSearch();
    }
  });

  /* ---------- Legend (key to org icons) ---------- */
  var legendToggle = document.getElementById("legend-toggle");
  var legendPanel = document.getElementById("legend-panel");
  (function buildLegend() {
    var list = document.getElementById("legend-list");
    if (!list || !window.ORGS) return;
    Object.keys(window.ORGS).forEach(function (id) {
      var li = document.createElement("li");
      var b = orgBadge(id);
      if (b) li.appendChild(b);
      var span = document.createElement("span");
      span.textContent = window.ORGS[id].label;
      li.appendChild(span);
      var fb = document.createElement("button");
      fb.type = "button";
      fb.className = "legend-filter";
      fb.dataset.filter = id;
      fb.title = "Filter by " + window.ORGS[id].label;
      fb.setAttribute("aria-pressed", "false");
      fb.innerHTML = '<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polygon points="3 5 21 5 14 13 14 19 10 21 10 13"></polygon></svg>';
      fb.addEventListener("click", function (ev) { ev.stopPropagation(); toggleFilter(id); });
      li.appendChild(fb);
      list.appendChild(li);
    });
  })();
  function closeLegend() {
    legendPanel.hidden = true;
    legendToggle.setAttribute("aria-expanded", "false");
  }
  legendToggle.addEventListener("click", function () {
    var willOpen = legendPanel.hidden;
    legendPanel.hidden = !willOpen;
    legendToggle.setAttribute("aria-expanded", willOpen ? "true" : "false");
  });
  document.addEventListener("click", function (ev) {
    if (!legendPanel.hidden && !legendPanel.contains(ev.target) && !legendToggle.contains(ev.target)) {
      closeLegend();
    }
  });

  /* ---------- Filter by affiliation ---------- */
  var activeFilters = {};                 // org id -> true
  var animOffTimer = null;
  var filterToggle = document.getElementById("filter-toggle");
  var filterPanel = document.getElementById("filter-panel");

  function passesFilter(e) {
    var keys = Object.keys(activeFilters);
    if (!keys.length) return true;        // nothing selected = show all
    return (e.orgs || []).some(function (o) { return activeFilters[o]; });
  }
  function syncFilterUI() {
    var any = Object.keys(activeFilters).length > 0;
    if (filterToggle) filterToggle.classList.toggle("is-active", any);
    Array.prototype.forEach.call(document.querySelectorAll("[data-filter]"), function (el) {
      var on = !!activeFilters[el.dataset.filter];
      el.classList.toggle("on", on);
      el.setAttribute("aria-pressed", on ? "true" : "false");
    });
  }
  function applyFilter() {
    sorted.forEach(function (e) {
      var el = timeline.querySelector('.entry[data-id="' + e.id + '"]');
      if (el) el.classList.toggle("filtered-out", !passesFilter(e));
    });
    syncFilterUI();
    timeline.classList.add("lm-animate");   // animate the reflow only for filtering
    layout();
    reflowConnectors();
    updateActive();
    clearTimeout(animOffTimer);
    animOffTimer = setTimeout(function () { timeline.classList.remove("lm-animate"); }, 580);
  }
  function toggleFilter(id) {
    if (activeFilters[id]) delete activeFilters[id]; else activeFilters[id] = true;
    applyFilter();
  }
  function clearFilters() { activeFilters = {}; applyFilter(); }

  (function buildFilterPanel() {
    var list = document.getElementById("filter-list");
    if (!list || !window.ORGS) return;
    Object.keys(window.ORGS).forEach(function (id) {
      var li = document.createElement("li");
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "filter-opt";
      btn.dataset.filter = id;
      btn.setAttribute("aria-pressed", "false");
      var b = orgBadge(id);
      if (b) btn.appendChild(b);
      var span = document.createElement("span");
      span.textContent = window.ORGS[id].label;
      btn.appendChild(span);
      btn.addEventListener("click", function () { toggleFilter(id); });
      li.appendChild(btn);
      list.appendChild(li);
    });
  })();

  var filterClear = document.getElementById("filter-clear");
  if (filterClear) filterClear.addEventListener("click", clearFilters);
  function closeFilter() {
    if (!filterPanel) return;
    filterPanel.hidden = true;
    filterToggle.setAttribute("aria-expanded", "false");
  }
  if (filterToggle) filterToggle.addEventListener("click", function () {
    var willOpen = filterPanel.hidden;
    filterPanel.hidden = !willOpen;
    filterToggle.setAttribute("aria-expanded", willOpen ? "true" : "false");
  });
  document.addEventListener("click", function (ev) {
    if (filterPanel && !filterPanel.hidden &&
        !filterPanel.contains(ev.target) && !filterToggle.contains(ev.target)) {
      closeFilter();
    }
  });

  /* ---------- Theme ---------- */
  var toggle = document.getElementById("theme-toggle");
  var iconEl = toggle.querySelector(".theme-toggle__icon");
  function setTheme(t) {
    root.setAttribute("data-theme", t);
    try { localStorage.setItem("leftistmap-theme", t); } catch (_) {}
    iconEl.textContent = t === "dark" ? "☾" : "☀";
    toggle.setAttribute("aria-label", t === "dark" ? "Switch to light mode" : "Switch to dark mode");
  }
  (function initTheme() {
    var t = null;
    try { t = localStorage.getItem("leftistmap-theme"); } catch (_) {}
    if (!t) t = window.matchMedia && window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
    setTheme(t);
  })();
  toggle.addEventListener("click", function () {
    setTheme(root.getAttribute("data-theme") === "dark" ? "light" : "dark");
  });

  /* ---------- Mobile: auto-summary for centered entry ---------- */
  var ticking = false;
  function updateActive() {
    ticking = false;
    var entries = timeline.querySelectorAll(".entry");
    if (!mqMobile.matches) {
      entries.forEach(function (el) { el.classList.remove("is-active"); });
      return;
    }
    var center = window.innerHeight / 2;
    var best = null, bestDist = Infinity;
    entries.forEach(function (el) {
      var r = el.getBoundingClientRect();
      var c = r.top + r.height / 2;
      var d = Math.abs(c - center);
      if (d < bestDist) { bestDist = d; best = el; }
    });
    entries.forEach(function (el) { el.classList.toggle("is-active", el === best); });
  }
  function onScroll() {
    hidePreview();
    if (!ticking) { ticking = true; requestAnimationFrame(updateActive); }
  }
  window.addEventListener("scroll", onScroll, { passive: true });

  /* ---------- Curved lineage connectors (anchored to bubbles) ---------- */
  function drawConnectors() {
    var svg = document.getElementById("connectors");
    if (!svg) return;
    var tl = timeline.getBoundingClientRect();
    var w = timeline.scrollWidth, h = timeline.scrollHeight;
    svg.setAttribute("width", w);
    svg.setAttribute("height", h);
    svg.style.width = w + "px";
    svg.style.height = h + "px";

    var paths = "";
    sorted.forEach(function (e) {
      (e.parents || []).forEach(function (pid) {
        var childEntry = timeline.querySelector('.entry[data-id="' + e.id + '"]');
        var parentEntry = timeline.querySelector('.entry[data-id="' + pid + '"]');
        if (!childEntry || !parentEntry) return;
        // Skip connectors touching a filtered-out (hidden) card.
        if (childEntry.classList.contains("filtered-out") || parentEntry.classList.contains("filtered-out")) return;
        var childEl = childEntry.querySelector(".card");
        var parentEl = parentEntry.querySelector(".card");
        if (!childEl || !parentEl) return;
        var cr = childEl.getBoundingClientRect(), pr = parentEl.getBoundingClientRect();
        // Center-to-center: the line hides behind the opaque cards and only
        // shows in the gaps, so lineage reads without crossing any text.
        var x1 = pr.left + pr.width / 2 - tl.left, y1 = pr.top + pr.height / 2 - tl.top;
        var x2 = cr.left + cr.width / 2 - tl.left, y2 = cr.top + cr.height / 2 - tl.top;
        // Bow the line perpendicular to its own direction so every connector
        // curves the same gentle amount, vertical and horizontal alike.
        var dx = x2 - x1, dy = y2 - y1;
        var len = Math.sqrt(dx * dx + dy * dy) || 1;
        var bow = Math.max(12, Math.min(42, len * 0.16));
        var cx = (x1 + x2) / 2 + (-dy / len) * bow;
        var cy = (y1 + y2) / 2 + (dx / len) * bow;
        paths += '<path data-from="' + pid + '" data-to="' + e.id +
          '" d="M' + x1 + "," + y1 + " Q" + cx + "," + cy + " " + x2 + "," + y2 + '" />';
      });
    });
    svg.innerHTML = paths;
  }

  // Redraw connectors every frame for a short window so the curves track the
  // cards while they slide to new positions during a filter reflow.
  var reflowToken = 0;
  function reflowConnectors(dur) {
    var id = ++reflowToken, start = performance.now();
    (function step(now) {
      if (id !== reflowToken) return;
      drawConnectors();
      if (now - start < (dur || 580)) requestAnimationFrame(step);
    })(performance.now());
  }

  // Zigzag row layout. Cards are placed in strict birth-year order, left to
  // right and top to bottom, in evenly spaced rows sized to the viewport width.
  // Alternating rows are nudged left/right by a small amount so the connectors
  // between rows run at an angle rather than stacking into right angles. Bounded
  // width (never cut off), responsive, deterministic. Same data in, same out.
  function layout() {
    var els = Array.prototype.slice.call(timeline.querySelectorAll(".entry:not(.filtered-out)"));

    // Mobile stacks in normal document flow; clear any desktop inline position.
    if (mqMobile.matches) {
      els.forEach(function (el) { el.style.left = ""; el.style.top = ""; el.style.transform = ""; });
      timeline.style.height = ""; timeline.style.width = ""; timeline.style.maxWidth = "";
      return;
    }

    // Open the column past the CSS max-width so the tree has room; keep a margin
    // so there is never a horizontal scrollbar.
    timeline.style.maxWidth = "none";
    var contentW = Math.min(Math.max(window.innerWidth - 48, 360), 1680);
    timeline.style.width = contentW + "px";

    var nodes = els.map(function (el) {
      var e = byId[el.dataset.id] || {};
      return { el: el, id: el.dataset.id, e: e, w: el.offsetWidth || 180, h: el.offsetHeight || 230, x: 0 };
    });
    if (!nodes.length) return;
    var idx = {};
    nodes.forEach(function (n) { idx[n.id] = n; });

    var PADX = 24;
    var maxW = 0; nodes.forEach(function (n) { if (n.w > maxW) maxW = n.w; });
    var usable = Math.max(maxW, contentW - PADX * 2);
    var railX = usable / 2 - maxW / 2;            // furthest a card centre may sit
    var SP = maxW + 30;                            // even centre-to-centre spacing
    var ZIG = Math.round(SP * 0.18);               // subtle per-row left/right nudge

    // Birth-year order, read left to right and top to bottom.
    var seq = nodes.slice().sort(function (a, b) {
      var d = (a.e.yearSort || 0) - (b.e.yearSort || 0);
      return d !== 0 ? d : (a.id < b.id ? -1 : 1);
    });

    // As many cards per row as the width allows, leaving room for the zigzag
    // nudge so a shifted row never clips: (perRow-1)*SP/2 + ZIG <= railX.
    var perRow = Math.max(3, Math.floor(1 + 2 * (railX - ZIG) / SP));
    var rows = [];
    for (var i = 0; i < seq.length; i += perRow) rows.push(seq.slice(i, i + perRow));

    // Lay out: every row evenly spaced and centred, then nudged. Even rows shift
    // left, odd rows shift right, a gentle zigzag so the connectors between rows
    // run at an angle instead of stacking into right angles. Marx is not forced
    // to centre; in birth-year order he lands near the middle of the top rows on
    // common desktop widths, with Engels beside him (unless a row break splits
    // them, which is fine).
    var PADTOP = 24, VGAP = 64, cx = PADX + usable / 2, y = PADTOP;
    rows.forEach(function (row, ri) {
      var shift = (ri % 2 === 0 ? -1 : 1) * ZIG;
      var rowH = 0; row.forEach(function (n) { if (n.h > rowH) rowH = n.h; });
      row.forEach(function (n, k) {
        var x = (k - (row.length - 1) / 2) * SP + shift;
        n.el.style.left = (cx + x - n.w / 2) + "px";
        n.el.style.top = (y + (rowH - n.h) / 2) + "px";
        n.el.style.transform = "none";
      });
      y += rowH + VGAP;
    });
    timeline.style.height = (y - VGAP + PADTOP) + "px";
  }

  window.addEventListener("resize", function () { layout(); drawConnectors(); updateActive(); });
  window.addEventListener("load", function () { layout(); drawConnectors(); });
  layout();
  drawConnectors();
  updateActive();

  // Test seam: expose pure helpers to the headless harness only. No effect in
  // the browser, where window.__LM_TEST__ is undefined.
  if (window.__LM_TEST__) window.__LM_TEST__.computePreviewPos = computePreviewPos;
})();
