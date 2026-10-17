<?php
declare(strict_types=1);

// CORS: allow local development against the deployed endpoint.
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if (in_array($origin, ['http://localhost:4200', 'http://localhost:4201'], true)) {
    header('Access-Control-Allow-Origin: ' . $origin);
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    exit;
}

// Every field is read as a string. Anything else (a bot posting name[]=x) counts as
// empty instead of a TypeError from trim() that would end the script with a 500.
function field(string $key): string
{
    $value = $_POST[$key] ?? '';
    return is_string($value) ? trim($value) : '';
}

$form     = field('form') ?: 'contact'; // contact | wizard | website-check
$name     = field('name');
$email    = field('email');
$topic    = field('topic');
$message  = field('message');
$budget   = field('budget');
$timeline = field('timeline');
$scope    = field('scope');
$url      = field('url');
$lang     = field('lang');
// Only a known form name reaches the server log, so a crafted value cannot forge a line.
$logForm  = in_array($form, ['contact', 'wizard', 'website-check'], true) ? $form : 'other';

// Honeypot: real users never fill it. Bots get a fake success and no mail — and no
// log line, since a flood of them would bury the real errors below.
if (field('hp_contact_ref') !== '') {
    http_response_code(200);
    echo 'ok';
    exit;
}
// Until 2026-10-16 the honeypot was called "website", and browsers autofilled that
// name: real inquiries got a thank-you and were dropped. A tab opened before then still
// sends it, so for a transition period a filled "website" alone is delivered, flagged
// in the subject, instead of dropped. Bots that replay a recorded field set without
// reading the page send it too — hence the end date, after which it is a trap again.
const LEGACY_HONEYPOT_UNTIL = '2026-11-16';
$legacyTrap = field('website');
if ($legacyTrap !== '' && date('Y-m-d') > LEGACY_HONEYPOT_UNTIL) {
    http_response_code(200);
    echo 'ok';
    exit;
}

if ($name === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    exit('invalid');
}
if ($form === 'website-check') {
    if (!filter_var($url, FILTER_VALIDATE_URL)) {
        http_response_code(400);
        exit('invalid');
    }
} elseif ($message === '') {
    http_response_code(400);
    exit('invalid');
}
foreach ([$name, $topic, $budget, $timeline, $url, $lang] as $short) {
    if (mb_strlen($short) > 200) {
        http_response_code(400);
        exit('too long');
    }
}
if (mb_strlen($message) > 10000 || mb_strlen($scope) > 10000) {
    http_response_code(400);
    exit('too long');
}

$to = 'mail@ilhan-buenyamin.com';

switch ($form) {
    case 'wizard':
        $subject = 'Neue Projektanfrage (Wizard) über softlyx.de';
        break;
    case 'website-check':
        $subject = 'Website-Check-Anfrage über softlyx.de';
        break;
    default:
        $subject = 'Neue Projektanfrage über softlyx.de';
}
if ($legacyTrap !== '') {
    $subject = '[Honeypot-Verdacht] ' . $subject;
}

$body = "Name: {$name}\n"
      . "E-Mail: {$email}\n"
      . ($topic !== ''    ? "Projektart: {$topic}\n"   : '')
      . ($budget !== ''   ? "Budget: {$budget}\n"      : '')
      . ($timeline !== '' ? "Zeitrahmen: {$timeline}\n" : '')
      . ($url !== ''      ? "Website: {$url}\n"        : '')
      . ($lang !== ''     ? "Sprache: {$lang}\n"       : '')
      . ($scope !== ''    ? "\nProjektbeschreibung:\n{$scope}\n" : '')
      . ($message !== ''  ? "\n{$message}\n"           : '')
      . ($legacyTrap !== '' ? "\nAltes Honeypot-Feld \"website\": " . mb_substr($legacyTrap, 0, 200) . "\n" : '');

$headers = "From: no-reply@ilhan-buenyamin.com\r\n"
         . "Reply-To: {$email}\r\n"
         . "Content-Type: text/plain; charset=UTF-8";

if (mail($to, $subject, $body, $headers)) {
    http_response_code(200);
    echo 'ok';
} else {
    // mail() only says whether the local MTA took the message; false means it did not.
    error_log("send_mail: mail() failed, form={$logForm}");
    http_response_code(500);
    echo 'fail';
}
