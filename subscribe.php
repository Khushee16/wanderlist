<?php
/**
 * Wanderlist — newsletter signup endpoint.
 *
 * Plain dependency-free PHP: runs on any cheap shared host or locally with
 *   php -S localhost:8000
 * It does NOT run on GitHub Pages (static hosting) — there the frontend
 * falls back to a clearly-labelled demo success state and never fakes a signup.
 *
 * POST JSON: { "email": "..." }  (form-encoded POST bodies also accepted)
 * On success: HTTP 200 + {"ok":true}
 * On validation error: HTTP 422 + {"ok":false,"errors":{"email":"..."}}
 * Duplicate email: HTTP 200 + {"ok":true,"duplicate":true} (not stored twice)
 * Signups are appended to data/subscribers.json (file-locked).
 */

header('Content-Type: application/json; charset=utf-8');

// Only POST is allowed.
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['ok' => false, 'error' => 'Method not allowed. Use POST.']);
    exit;
}

// Accept a JSON body, falling back to a normal form POST.
$input = [];
$raw = file_get_contents('php://input');
if ($raw !== '' && $raw !== false) {
    $decoded = json_decode($raw, true);
    if (is_array($decoded)) {
        $input = $decoded;
    }
}
if (empty($input)) {
    $input = $_POST;
}

$email = isset($input['email']) ? trim((string) $input['email']) : '';

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(422);
    echo json_encode(['ok' => false, 'errors' => ['email' => 'Please enter a valid email address.']]);
    exit;
}

// --- Append to data/subscribers.json (file-locked, de-duplicated) ---
$dataDir  = __DIR__ . '/data';
$dataFile = $dataDir . '/subscribers.json';

if (!is_dir($dataDir) && !mkdir($dataDir, 0755, true) && !is_dir($dataDir)) {
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => 'Could not create data directory.']);
    exit;
}

$fp = fopen($dataFile, 'c+');
if ($fp === false) {
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => 'Could not open subscribers file.']);
    exit;
}
if (!flock($fp, LOCK_EX)) {
    fclose($fp);
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => 'Could not lock subscribers file.']);
    exit;
}

$contents = stream_get_contents($fp);
$subs = ($contents !== '' && $contents !== false) ? json_decode($contents, true) : null;
if (!is_array($subs)) {
    $subs = [];
}

foreach ($subs as $s) {
    if (isset($s['email']) && strcasecmp($s['email'], $email) === 0) {
        flock($fp, LOCK_UN);
        fclose($fp);
        echo json_encode(['ok' => true, 'duplicate' => true]);
        exit;
    }
}

$subs[] = ['email' => $email, 'created' => gmdate('c')];

rewind($fp);
ftruncate($fp, 0);
fwrite($fp, json_encode($subs, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES) . "\n");
fflush($fp);
flock($fp, LOCK_UN);
fclose($fp);

echo json_encode(['ok' => true]);
