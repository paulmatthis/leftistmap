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
    card.addEventListener("mouseenter", function (ev) { showPreview(e, ev.currentTarget); litConnectors(e.id, true); });
    card.addEventListener("mouseleave", function () { hidePreview(); litConnectors(e.id, false); });
    card.addEventListener("focus", function () { showPreview(e, card); litConnectors(e.id, true); });
    card.addEventListener("blur", function () { hidePreview(); litConnectors(e.id, false); });

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
  function showPreview(e, anchor) {
    if (mqMobile.matches || !e.preview) return;
    previewEl.textContent = e.preview;
    previewEl.hidden = false;
    var r = anchor.getBoundingClientRect();
    var pw = previewEl.offsetWidth;
    var ph = previewEl.offsetHeight;
    var left = r.right + 14;
    var top = r.top;
    if (left + pw > window.innerWidth - 12) { left = Math.max(12, r.left); top = r.bottom + 10; }
    if (top + ph > window.innerHeight - 12) top = window.innerHeight - ph - 12;
    previewEl.style.left = left + "px";
    previewEl.style.top = Math.max(12, top) + "px";
  }
  function hidePreview() { previewEl.hidden = true; }

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
      if (!bk.isbn) return; // only books the script has resolved to an ISBN
      var a = document.createElement("a");
      a.className = "lm-link lm-link--book";
      a.href = "https://bookshop.org/a/104178/" + encodeURIComponent(bk.isbn);
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
        var childEl = timeline.querySelector('.entry[data-id="' + e.id + '"] .card');
        var parentEl = timeline.querySelector('.entry[data-id="' + pid + '"] .card');
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

  // Zigzag row layout. Cards are placed in strict birth-year order, left to
  // right and top to bottom, in evenly spaced rows sized to the viewport width.
  // Alternating rows are nudged left/right by a small amount so the connectors
  // between rows run at an angle rather than stacking into right angles. Bounded
  // width (never cut off), responsive, deterministic. Same data in, same out.
  function layout() {
    var els = Array.prototype.slice.call(timeline.querySelectorAll(".entry"));

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
})();
