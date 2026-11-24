<?php
/**
 * Wanderlist — destination list API.
 *
 * Plain dependency-free PHP: runs on any cheap shared host or locally with
 *   php -S localhost:8000
 * It does NOT run on GitHub Pages (static hosting) — there the frontend
 * falls back to the bundled copy in destinations-data.js.
 *
 * GET destinations.php            -> {"ok":true,"destinations":[...]}
 * GET destinations.php?id=kyoto   -> {"ok":true,"destination":{...}}
 * Unknown id: 404 + {"ok":false,"error":"Destination not found."}
 * The list is stored in data/destinations.json (same data as destinations-data.js).
 */

header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['ok' => false, 'error' => 'Method not allowed. Use GET.']);
    exit;
}

$file = __DIR__ . '/data/destinations.json';
if (!is_readable($file)) {
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => 'Destination data is unavailable.']);
    exit;
}

$raw = file_get_contents($file);
$destinations = json_decode($raw, true);
if (!is_array($destinations)) {
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => 'Destination data is invalid.']);
    exit;
}

$id = isset($_GET['id']) ? trim((string) $_GET['id']) : '';
if ($id !== '') {
    foreach ($destinations as $d) {
        if (isset($d['id']) && $d['id'] === $id) {
            echo json_encode(['ok' => true, 'destination' => $d]);
            exit;
        }
    }
    http_response_code(404);
    echo json_encode(['ok' => false, 'error' => 'Destination not found.']);
    exit;
}

echo json_encode(['ok' => true, 'destinations' => $destinations]);
