# Wanderlist — Find Your Next Trip

An interactive travel-destination explorer with a dozen hand-picked spots around the world. Search, filter, sort, and save favorites — plus a dedicated detail page per destination and a newsletter signup backed by a small PHP backend.

Built as a self-directed portfolio piece, not client work. Prices are illustrative estimates, not real offers, and photos are random images from picsum.photos seeds.

## Pages

- `index.html` — home: live search, region filters, sorting, favorites, destination grid, newsletter signup
- `destination.html?id=kyoto` — detail page for one destination: large photo, description, highlights, rating, trip length, price estimate, save-to-favorite, and related destinations (same region first)

Both pages use the same destination data (see below).

## Features

- Live search across names, countries, and descriptions
- Filter by region (Europe, Asia, Americas, Africa, Oceania)
- Sort by rating, price, or name; "favorites only" view
- Destination detail modal with photo, rating, trip length, and price estimate — plus a full detail page per destination
- Favorites persisted in localStorage across visits (shared between the grid and detail pages)
- Newsletter signup with validation and a clearly-labelled demo fallback
- Responsive card grid with hover lift/zoom, staggered entrance animations, scroll reveals
- Empty state with one-click filter reset; keyboard accessible (Enter/Space/Escape)

## Tech stack

HTML, CSS (custom properties, grid), **Bootstrap 5** (CDN — layout and components, with custom CSS on top), vanilla JavaScript, **PHP** (dependency-free backend, no framework, no database). No build step. Photos via picsum.photos seeds.

## Data

The destination list lives in two matching copies:

- `destinations-data.js` — bundled JavaScript copy used by both pages
- `data/destinations.json` — JSON copy served by `destinations.php`

The frontend prefers `destinations.php` when a PHP backend is reachable and falls back to the bundled copy on static hosting, so the explorer works everywhere. (The JSON file was generated from the JS data so the two can't drift.)

## Backend

### `destinations.php` — destination list API

- `GET destinations.php` → `{"ok": true, "destinations": [...]}`
- `GET destinations.php?id=kyoto` → `{"ok": true, "destination": {...}}` (404 for an unknown id)

### `subscribe.php` — newsletter signup

POST JSON `{ "email": "..." }` (form-encoded bodies also accepted). Validates the email, de-duplicates, and appends to `data/subscribers.json` (file-locked). Responses are JSON:

- `200 {"ok": true}` — subscribed (or `{"ok": true, "duplicate": true}` if already on the list)
- `422 {"ok": false, "errors": {...}}` — invalid email
- `405` — non-POST request

**The PHP backend does not run on GitHub Pages** (static hosting) or `file://`. When `subscribe.php` is unreachable, the newsletter form shows a clearly-labelled demo success state — *"Demo mode — no backend connected"* — and never pretends the signup was saved. The destination list falls back to the bundled data in the same situation.

## Run locally

```bash
cd wanderlist
php -S localhost:8000
# then open http://localhost:8000
```

Without PHP, any static server works for the pages (e.g. `python3 -m http.server 8000`): the grid, filters, modal, and detail pages all work; the newsletter shows the demo state instead of saving.

## Live demo

https://khushee16.github.io/wanderlist/

On the live Pages demo the grid, search, filters, favorites, modal, and detail pages all work; the newsletter shows the demo state because Pages has no PHP backend.

## Author

Khushi Khatri — self-directed portfolio project, not client work.
