/* ============ Wanderlist — destination explorer ============
   Data: bundled copy in destinations-data.js. When a PHP backend is
   available the list is loaded from destinations.php instead (same data);
   on static hosting (GitHub Pages / file://) the fetch fails and the
   bundled copy is used, so the explorer always works. */
(function () {
  "use strict";

  var FALLBACK = window.WANDERLIST_DESTINATIONS || [];
  var REGIONS = window.WANDERLIST_REGIONS || ["All", "Europe", "Asia", "Americas", "Africa", "Oceania"];
  var DESTINATIONS = FALLBACK.slice();

  var state = { q: "", region: "All", sort: "rating-desc", favOnly: false, favorites: loadFavorites() };

  var grid = document.getElementById("grid");
  var searchInput = document.getElementById("searchInput");
  var regionPills = document.getElementById("regionPills");
  var sortSelect = document.getElementById("sortSelect");
  var favOnly = document.getElementById("favOnly");
  var resultCount = document.getElementById("resultCount");
  var emptyState = document.getElementById("emptyState");
  var clearFilters = document.getElementById("clearFilters");
  var backdrop = document.getElementById("modalBackdrop");
  var modalClose = document.getElementById("modalClose");
  var currentModalId = null;

  /* Try the PHP backend first; fall back silently to the bundled data. */
  function loadFromBackend() {
    if (!/^https?:/.test(window.location.protocol)) return Promise.resolve(false);
    return fetch("destinations.php", { headers: { "Accept": "application/json" } })
      .then(function (res) { if (!res.ok) throw new Error("backend " + res.status); return res.json(); })
      .then(function (data) {
        if (data && data.ok && Array.isArray(data.destinations) && data.destinations.length) {
          DESTINATIONS = data.destinations;
          return true;
        }
        return false;
      })
      .catch(function () { return false; });
  }

  function loadFavorites() {
    try {
      var raw = localStorage.getItem("wanderlist-favorites");
      var arr = raw ? JSON.parse(raw) : [];
      return new Set(Array.isArray(arr) ? arr : []);
    } catch (e) { return new Set(); }
  }
  function saveFavorites() {
    try { localStorage.setItem("wanderlist-favorites", JSON.stringify(Array.from(state.favorites))); }
    catch (e) { /* storage unavailable */ }
  }
  function imgUrl(seed, w, h) {
    return "https://picsum.photos/seed/" + seed + "/" + w + "/" + h;
  }
  function stars(rating) {
    return "\u2605 " + rating.toFixed(1);
  }

  function getFiltered() {
    var q = state.q.trim().toLowerCase();
    var list = DESTINATIONS.filter(function (d) {
      var matchQ = !q || d.name.toLowerCase().indexOf(q) !== -1 ||
        d.country.toLowerCase().indexOf(q) !== -1 || d.desc.toLowerCase().indexOf(q) !== -1;
      var matchR = state.region === "All" || d.region === state.region;
      var matchF = !state.favOnly || state.favorites.has(d.id);
      return matchQ && matchR && matchF;
    });
    switch (state.sort) {
      case "price-asc": list.sort(function (a, b) { return a.price - b.price; }); break;
      case "price-desc": list.sort(function (a, b) { return b.price - a.price; }); break;
      case "name-asc": list.sort(function (a, b) { return a.name.localeCompare(b.name); }); break;
      default: list.sort(function (a, b) { return b.rating - a.rating; });
    }
    return list;
  }

  function renderPills() {
    if (!regionPills) return;
    regionPills.innerHTML = "";
    REGIONS.forEach(function (r) {
      var btn = document.createElement("button");
      btn.className = "pill" + (state.region === r ? " active" : "");
      btn.textContent = r;
      btn.setAttribute("aria-pressed", state.region === r ? "true" : "false");
      btn.addEventListener("click", function () {
        state.region = r;
        renderPills();
        render();
      });
      regionPills.appendChild(btn);
    });
  }

  function cardEl(d) {
    var card = document.createElement("article");
    card.className = "card";
    card.setAttribute("data-id", d.id);
    card.setAttribute("tabindex", "0");
    card.setAttribute("role", "button");
    card.setAttribute("aria-label", "View details for " + d.name);

    var wrap = document.createElement("div");
    wrap.className = "card-img-wrap";
    var img = document.createElement("img");
    img.src = imgUrl(d.seed, 600, 400);
    img.alt = d.name + ", " + d.country;
    img.loading = "lazy";
    var tag = document.createElement("span");
    tag.className = "region-tag";
    tag.textContent = d.region;
    var fav = document.createElement("button");
    fav.className = "fav-btn" + (state.favorites.has(d.id) ? " active" : "");
    fav.innerHTML = "&#10084;";
    fav.setAttribute("aria-label", "Save " + d.name + " to favorites");
    fav.addEventListener("click", function (e) {
      e.stopPropagation();
      toggleFavorite(d.id);
    });
    wrap.appendChild(img);
    wrap.appendChild(tag);
    wrap.appendChild(fav);

    var body = document.createElement("div");
    body.className = "card-body";
    var h3 = document.createElement("h3");
    h3.textContent = d.name;
    var country = document.createElement("p");
    country.className = "card-country";
    country.textContent = d.country;
    var foot = document.createElement("div");
    foot.className = "card-foot";
    var rating = document.createElement("span");
    rating.className = "rating";
    rating.textContent = stars(d.rating);
    var price = document.createElement("span");
    price.className = "price";
    price.appendChild(document.createTextNode("$" + d.price.toLocaleString()));
    var small = document.createElement("small");
    small.textContent = " est.";
    price.appendChild(small);
    foot.appendChild(rating);
    foot.appendChild(price);
    var link = document.createElement("a");
    link.className = "card-link";
    link.href = "destination.html?id=" + encodeURIComponent(d.id);
    link.textContent = "View details \u2192";
    link.addEventListener("click", function (e) { e.stopPropagation(); });
    body.appendChild(h3);
    body.appendChild(country);
    body.appendChild(foot);
    body.appendChild(link);

    card.appendChild(wrap);
    card.appendChild(body);

    function open() { openModal(d.id); }
    card.addEventListener("click", open);
    card.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); open(); }
    });
    return card;
  }

  function render() {
    if (!grid) return;
    var list = getFiltered();
    grid.innerHTML = "";
    list.forEach(function (d, i) {
      var c = cardEl(d);
      c.style.animationDelay = Math.min(i * 40, 400) + "ms";
      grid.appendChild(c);
    });
    if (resultCount) {
      resultCount.textContent = list.length === 1 ? "1 destination" : list.length + " destinations";
    }
    if (emptyState) emptyState.hidden = list.length !== 0;
  }

  function toggleFavorite(id) {
    if (state.favorites.has(id)) state.favorites.delete(id);
    else state.favorites.add(id);
    saveFavorites();
    render();
    if (currentModalId === id) syncModalFav(id);
  }

  function findDest(id) {
    for (var i = 0; i < DESTINATIONS.length; i++) {
      if (DESTINATIONS[i].id === id) return DESTINATIONS[i];
    }
    return null;
  }

  function openModal(id) {
    var d = findDest(id);
    if (!d || !backdrop) return;
    currentModalId = id;
    document.getElementById("modalImg").src = imgUrl(d.seed, 900, 506);
    document.getElementById("modalImg").alt = d.name + ", " + d.country;
    document.getElementById("modalName").textContent = d.name;
    document.getElementById("modalCountry").textContent = d.country;
    document.getElementById("modalRegion").textContent = d.region;
    document.getElementById("modalRating").textContent = stars(d.rating) + " rating";
    document.getElementById("modalDays").textContent = "Suggested: " + d.days;
    document.getElementById("modalDesc").textContent = d.desc;
    document.getElementById("modalPrice").textContent = "$" + d.price.toLocaleString();
    var detailLink = document.getElementById("modalDetailLink");
    if (detailLink) detailLink.href = "destination.html?id=" + encodeURIComponent(d.id);
    syncModalFav(id);
    backdrop.hidden = false;
    document.body.style.overflow = "hidden";
    if (modalClose) modalClose.focus();
  }
  function syncModalFav(id) {
    var btn = document.getElementById("modalFav");
    if (!btn) return;
    btn.classList.toggle("active", state.favorites.has(id));
    var d = findDest(id);
    btn.setAttribute("aria-label", (state.favorites.has(id) ? "Remove " : "Save ") + (d ? d.name : "") + " favorites");
  }
  function closeModal() {
    if (!backdrop) return;
    backdrop.hidden = true;
    document.body.style.overflow = "";
    currentModalId = null;
  }

  var modalFavBtn = document.getElementById("modalFav");
  if (modalFavBtn) modalFavBtn.addEventListener("click", function () {
    if (currentModalId) toggleFavorite(currentModalId);
  });
  if (modalClose) modalClose.addEventListener("click", closeModal);
  if (backdrop) backdrop.addEventListener("click", function (e) {
    if (e.target === backdrop) closeModal();
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && backdrop && !backdrop.hidden) closeModal();
  });

  if (searchInput) searchInput.addEventListener("input", function () {
    state.q = searchInput.value;
    render();
  });
  if (sortSelect) sortSelect.addEventListener("change", function () {
    state.sort = sortSelect.value;
    render();
  });
  if (favOnly) favOnly.addEventListener("change", function () {
    state.favOnly = favOnly.checked;
    render();
  });
  if (clearFilters) clearFilters.addEventListener("click", function () {
    state.q = "";
    state.region = "All";
    state.sort = "rating-desc";
    state.favOnly = false;
    if (searchInput) searchInput.value = "";
    if (sortSelect) sortSelect.value = "rating-desc";
    if (favOnly) favOnly.checked = false;
    renderPills();
    render();
  });

  /* ---------- Newsletter signup: POST to subscribe.php ----------
     On static hosting there is no PHP backend, so a failed fetch shows a
     clearly-labelled DEMO success state instead of pretending to subscribe. */
  var newsForm = document.getElementById("newsForm");
  var newsEmail = document.getElementById("newsEmail");
  var newsMsg = document.getElementById("newsMsg");
  var newsDemo = document.getElementById("newsDemoNote");
  var newsBtn = document.getElementById("newsSubmit");
  if (newsForm && newsEmail) {
    newsForm.addEventListener("submit", function (e) {
      e.preventDefault();
      var email = newsEmail.value.trim();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
        if (newsMsg) { newsMsg.textContent = "Please enter a valid email address."; newsMsg.className = "news-msg error"; }
        if (newsDemo) newsDemo.hidden = true;
        newsEmail.focus();
        return;
      }
      if (newsBtn) { newsBtn.disabled = true; newsBtn.textContent = "Subscribing…"; }
      fetch("subscribe.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email })
      })
        .then(function (res) {
          if (!res.ok) throw new Error("backend unavailable (" + res.status + ")");
          return res.json();
        })
        .then(function (data) {
          if (data && data.ok) {
            if (newsMsg) { newsMsg.textContent = data.duplicate ? "You're already on the list — welcome back!" : "You're in! Watch your inbox for travel ideas."; newsMsg.className = "news-msg"; }
            if (newsDemo) newsDemo.hidden = true;
            newsForm.reset();
          } else {
            throw new Error("backend rejected signup");
          }
        })
        .catch(function () {
          if (newsMsg) { newsMsg.textContent = "Thanks — demo mode: no backend connected, so this signup wasn't saved anywhere."; newsMsg.className = "news-msg"; }
          if (newsDemo) newsDemo.hidden = false;
        })
        .finally(function () {
          if (newsBtn) { newsBtn.disabled = false; newsBtn.textContent = "Subscribe"; }
        });
    });
  }

  /* ---------- Scroll reveal ---------- */
  function initReveal() {
    var els = document.querySelectorAll(".reveal");
    if (!els.length) return;
    if ("IntersectionObserver" in window) {
      var obs = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) { entry.target.classList.add("visible"); obs.unobserve(entry.target); }
        });
      }, { threshold: 0.12 });
      els.forEach(function (el) { obs.observe(el); });
    } else {
      els.forEach(function (el) { el.classList.add("visible"); });
    }
  }

  renderPills();
  render();
  initReveal();
  loadFromBackend().then(function (changed) { if (changed) { renderPills(); render(); } });
})();
