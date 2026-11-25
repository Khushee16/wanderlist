/* ============ Wanderlist — single destination page ============
   Renders one destination from ?id=... using the same data as the grid:
   the bundled copy in destinations-data.js, or destinations.php when a
   PHP backend is reachable. Favorites are shared with the grid via the
   same localStorage key ("wanderlist-favorites"). */
(function () {
  "use strict";

  var FALLBACK = window.WANDERLIST_DESTINATIONS || [];

  function getId() {
    var params = new URLSearchParams(window.location.search);
    return (params.get("id") || "").trim();
  }
  function imgUrl(seed, w, h) {
    return "https://picsum.photos/seed/" + seed + "/" + w + "/" + h;
  }
  function loadFavorites() {
    try {
      var arr = JSON.parse(localStorage.getItem("wanderlist-favorites") || "[]");
      return new Set(Array.isArray(arr) ? arr : []);
    } catch (e) { return new Set(); }
  }
  function saveFavorites(set) {
    try { localStorage.setItem("wanderlist-favorites", JSON.stringify(Array.from(set))); }
    catch (e) { /* storage unavailable */ }
  }

  function loadDest(id) {
    if (!/^https?:/.test(window.location.protocol)) return Promise.resolve(null);
    return fetch("destinations.php?id=" + encodeURIComponent(id), { headers: { "Accept": "application/json" } })
      .then(function (res) { if (!res.ok) throw new Error("backend " + res.status); return res.json(); })
      .then(function (data) { return (data && data.ok && data.destination) ? data.destination : null; })
      .catch(function () { return null; });
  }

  function render(d, all) {
    var favorites = loadFavorites();
    document.title = d.name + ", " + d.country + " — Wanderlist";
    document.getElementById("destImg").src = imgUrl(d.seed, 1200, 525);
    document.getElementById("destImg").alt = d.name + ", " + d.country;
    document.getElementById("destName").textContent = d.name;
    document.getElementById("destCountry").textContent = d.country + " · " + d.region;
    document.getElementById("destDesc").textContent = d.desc;
    document.getElementById("destRating").textContent = "\u2605 " + d.rating.toFixed(1) + " / 5";
    document.getElementById("destDays").textContent = d.days;
    document.getElementById("destPrice").innerHTML = "";
    document.getElementById("destPrice").appendChild(document.createTextNode("$" + d.price.toLocaleString()));
    var small = document.createElement("small");
    small.textContent = " est. per person";
    document.getElementById("destPrice").appendChild(small);

    var hl = document.getElementById("destHighlights");
    hl.innerHTML = "";
    (d.highlights || []).forEach(function (h) {
      var li = document.createElement("li");
      li.textContent = h;
      hl.appendChild(li);
    });

    var favBtn = document.getElementById("destFav");
    function syncFav() {
      var isFav = favorites.has(d.id);
      favBtn.textContent = isFav ? "\u2764 Saved to favorites" : "\u2661 Save to favorites";
      favBtn.classList.toggle("active", isFav);
      favBtn.setAttribute("aria-pressed", isFav ? "true" : "false");
    }
    favBtn.addEventListener("click", function () {
      if (favorites.has(d.id)) favorites.delete(d.id);
      else favorites.add(d.id);
      saveFavorites(favorites);
      syncFav();
    });
    syncFav();

    /* Related destinations: same region first, then top-rated others. */
    var related = all.filter(function (x) { return x.id !== d.id; });
    related.sort(function (a, b) {
      var ar = (a.region === d.region ? 0 : 1), br = (b.region === d.region ? 0 : 1);
      return (ar - br) || (b.rating - a.rating);
    });
    var relGrid = document.getElementById("relatedGrid");
    relGrid.innerHTML = "";
    related.slice(0, 3).forEach(function (r) {
      var col = document.createElement("div");
      col.className = "col-md-4";
      var card = document.createElement("article");
      card.className = "card";
      var wrap = document.createElement("div");
      wrap.className = "card-img-wrap";
      var img = document.createElement("img");
      img.src = imgUrl(r.seed, 600, 400);
      img.alt = r.name + ", " + r.country;
      img.loading = "lazy";
      wrap.appendChild(img);
      var body = document.createElement("div");
      body.className = "card-body";
      var h3 = document.createElement("h3");
      h3.textContent = r.name;
      var country = document.createElement("p");
      country.className = "card-country";
      country.textContent = r.country;
      var link = document.createElement("a");
      link.className = "card-link";
      link.href = "destination.html?id=" + encodeURIComponent(r.id);
      link.textContent = "View details \u2192";
      body.appendChild(h3);
      body.appendChild(country);
      body.appendChild(link);
      card.appendChild(wrap);
      card.appendChild(body);
      card.setAttribute("tabindex", "0");
      card.setAttribute("role", "link");
      card.setAttribute("aria-label", "View details for " + r.name);
      card.addEventListener("click", function () { window.location.href = link.href; });
      card.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); window.location.href = link.href; }
      });
      col.appendChild(card);
      relGrid.appendChild(col);
    });

    document.getElementById("destContent").hidden = false;
    /* Reveal-on-scroll for the freshly rendered sections */
    var revealTargets = document.querySelectorAll(".dest-hero, .dest-main, .dest-card, .related");
    revealTargets.forEach(function (el) { el.classList.add("reveal"); });
    if ("IntersectionObserver" in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) { entry.target.classList.add("visible"); io.unobserve(entry.target); }
        });
      }, { threshold: 0.1 });
      revealTargets.forEach(function (el) { io.observe(el); });
    } else {
      revealTargets.forEach(function (el) { el.classList.add("visible"); });
    }
  }

  function showNotFound(id) {
    document.getElementById("destContent").hidden = true;
    var nf = document.getElementById("notFound");
    nf.hidden = false;
    var msg = document.getElementById("notFoundText");
    if (msg) msg.textContent = id
      ? "We couldn't find a destination with id \u201C" + id + "\u201D."
      : "No destination was selected — pick one from the list.";
  }

  function init() {
    var id = getId();
    if (!id) { showNotFound(""); return; }
    var local = null;
    for (var i = 0; i < FALLBACK.length; i++) {
      if (FALLBACK[i].id === id) { local = FALLBACK[i]; break; }
    }
    loadDest(id).then(function (fromBackend) {
      var d = fromBackend || local;
      if (!d) { showNotFound(id); return; }
      var all = (fromBackend && window.WANDERLIST_DESTINATIONS) ? window.WANDERLIST_DESTINATIONS : FALLBACK;
      render(d, all);
    });
  }

  init();
})();
