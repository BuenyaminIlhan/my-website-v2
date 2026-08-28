<?php
/**
 * Returns the caller's own IP address — nothing else, and nothing is kept.
 *
 * Exists so the site can show a visitor their IP without handing that
 * address to a third-party lookup service, which would contradict the
 * "no cookies, no tracking" promise the site makes on the same page.
 *
 * Deliberately absent: any logging, storage, database, file write, cookie,
 * or geo lookup. The address is read from the request and written straight
 * back to the requester.
 */

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store, no-cache, must-revalidate');
header('X-Robots-Tag: noindex');

/* No Access-Control-Allow-Origin on purpose: without it the browser lets
   only same-origin script read the response, which is all this needs. */

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'GET') {
    http_response_code(405);
    echo json_encode(['error' => 'method not allowed']);
    exit;
}

/* REMOTE_ADDR is the only value the client cannot forge. Proxy headers
   (X-Forwarded-For and friends) are attacker-controlled and are ignored;
   if this ever runs behind a trusted proxy, add that proxy's address to an
   allowlist here rather than trusting the header blindly.
 *
 * DEPLOYMENT PRECONDITION: this file assumes the web server talks to the
 * visitor directly (IONOS shared hosting does). Put a CDN or reverse proxy
 * in front of it without adapting this code and REMOTE_ADDR becomes the
 * proxy's address — the page would then show a stranger's IP as "yours". */
$ip = $_SERVER['REMOTE_ADDR'] ?? '';

if (!filter_var($ip, FILTER_VALIDATE_IP)) {
    http_response_code(500);
    echo json_encode(['error' => 'no address']);
    exit;
}

echo json_encode(['ip' => $ip], JSON_UNESCAPED_SLASHES);
