/* ============ Wanderlist — destination explorer ============ */
(function () {
  "use strict";

  var DESTINATIONS = [
    { id: "kyoto", name: "Kyoto", country: "Japan", region: "Asia", rating: 4.9, price: 1450, days: "7 days", seed: "kyoto-japan",
      desc: "Ancient temples, bamboo groves, and tea houses — Kyoto is Japan's cultural heart, best explored slowly on foot and by quiet morning visits to its famous shrines." },
    { id: "santorini", name: "Santorini", country: "Greece", region: "Europe", rating: 4.8, price: 1680, days: "5 days", seed: "santorini-greece",
      desc: "Whitewashed villages clinging to volcanic cliffs above a sapphire caldera. Come for the sunsets in Oia, stay for the volcanic beaches and Assyrtiko wine." },
    { id: "banff", name: "Banff", country: "Canada", region: "Americas", rating: 4.7, price: 1320, days: "6 days", seed: "banff-canada",
      desc: "Turquoise lakes, towering peaks, and more wildlife than people. Hike Johnston Canyon, soak in the hot springs, and drive the unforgettable Icefields Parkway." },
    { id: "marrakech", name: "Marrakech", country: "Morocco", region: "Africa", rating: 4.6, price: 980, days: "5 days", seed: "marrakech-morocco",
      desc: "A sensory overload in the best way — spice markets, mosaic courtyards, and rooftop sunsets over the Atlas Mountains. Don't skip the Jardin Majorelle." },
    { id: "queenstown", name: "Queenstown", country: "New Zealand", region: "Oceania", rating: 4.9, price: 1740, days: "8 days", seed: "queenstown-nz",
      desc: "The adventure capital of the Southern Hemisphere. Bungy jump at dawn, cruise Milford Sound by afternoon, and end the day with Fergburger by the lake." },
    { id: "amalfi", name: "Amalfi Coast", country: "Italy", region: "Europe", rating: 4.8, price: 1890, days: "6 days", seed: "amalfi-italy",
      desc: "Lemon groves, cliffside villages, and the bluest water in Europe. Base yourself in Positano or Praiano and boat-hop between coastal towns." },
    { id: "bali", name: "Bali", country: "Indonesia", region: "Asia", rating: 4.7, price: 1120, days: "9 days", seed: "bali-indonesia",
      desc: "Emerald rice terraces, temple ceremonies, and surf breaks for every level. Ubud for culture, Uluwatu for cliffs, and Canggu for the digital-nomad buzz." },
    { id: "reykjavik", name: "Reykjavik", country: "Iceland", region: "Europe", rating: 4.8, price: 1560, days: "5 days", seed: "reykjavik-iceland",
      desc: "Chase waterfalls along the Golden Circle, bathe in geothermal lagoons, and — between September and March — hunt the northern lights." },
    { id: "patagonia", name: "Patagonia", country: "Chile", region: "Americas", rating: 4.9, price: 1980, days: "10 days", seed: "patagonia-chile",
      desc: "Granite towers, calving glaciers, and the famous W trek through Torres del Paine. Raw, remote, and unlike anywhere else on Earth." },
    { id: "capetown", name: "Cape Town", country: "South Africa", region: "Africa", rating: 4.6, price: 1240, days: "7 days", seed: "capetown-sa",
      desc: "Table Mountain, penguin beaches, and world-class wine country an hour away. One of the most scenically complete cities on the planet." },
    { id: "sydney", name: "Sydney", country: "Australia", region: "Oceania", rating: 4.5, price: 1610, days: "6 days", seed: "sydney-australia",
      desc: "Harbour icons, coastal walks from Bondi to Coogee, and a food scene that punches far above its weight. Easy, sunny, and endlessly walkable." },
    { id: "cusco", name: "Cusco", country: "Peru", region: "Americas", rating: 4.7, price: 1050, days: "7 days", seed: "cusco-peru",
      desc: "The gateway to Machu Picchu — but give Cusco itself time. Inca stonework, vibrant markets, and high-altitude adventure in the Sacred Valley." }
  ];

  var REGIONS = ["All", "Europe", "Asia", "Americas", "Africa", "Oceania"];

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
    price.innerHTML = "";
    price.appendChild(document.createTextNode("$" + d.price.toLocaleString()));
    var small = document.createElement("small");
    small.textContent = " est.";
    price.appendChild(small);
    foot.appendChild(rating);
    foot.appendChild(price);
    body.appendChild(h3);
    body.appendChild(country);
    body.appendChild(foot);

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
    var list = getFiltered();
    grid.innerHTML = "";
    list.forEach(function (d, i) {
      var c = cardEl(d);
      c.style.animationDelay = Math.min(i * 40, 400) + "ms";
      grid.appendChild(c);
    });
    resultCount.textContent = list.length === 1
      ? "1 destination"
      : list.length + " destinations";
    emptyState.hidden = list.length !== 0;
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
    if (!d) return;
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
    syncModalFav(id);
    backdrop.hidden = false;
    document.body.style.overflow = "hidden";
    modalClose.focus();
  }
  function syncModalFav(id) {
    var btn = document.getElementById("modalFav");
    btn.classList.toggle("active", state.favorites.has(id));
    var d = findDest(id);
    btn.setAttribute("aria-label", (state.favorites.has(id) ? "Remove " : "Save ") + (d ? d.name : "") + " favorites");
  }
  function closeModal() {
    backdrop.hidden = true;
    document.body.style.overflow = "";
    currentModalId = null;
  }

  document.getElementById("modalFav").addEventListener("click", function () {
    if (currentModalId) toggleFavorite(currentModalId);
  });
  modalClose.addEventListener("click", closeModal);
  backdrop.addEventListener("click", function (e) {
    if (e.target === backdrop) closeModal();
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && !backdrop.hidden) closeModal();
  });

  searchInput.addEventListener("input", function () {
    state.q = searchInput.value;
    render();
  });
  sortSelect.addEventListener("change", function () {
    state.sort = sortSelect.value;
    render();
  });
  favOnly.addEventListener("change", function () {
    state.favOnly = favOnly.checked;
    render();
  });
  clearFilters.addEventListener("click", function () {
    state.q = "";
    state.region = "All";
    state.sort = "rating-desc";
    state.favOnly = false;
    searchInput.value = "";
    sortSelect.value = "rating-desc";
    favOnly.checked = false;
    renderPills();
    render();
  });

  renderPills();
  render();
})();
