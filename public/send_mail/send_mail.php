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

$form     = trim($_POST['form'] ?? 'contact'); // contact | wizard | website-check
$name     = trim($_POST['name'] ?? '');
$email    = trim($_POST['email'] ?? '');
$topic    = trim($_POST['topic'] ?? '');
$message  = trim($_POST['message'] ?? '');
$budget   = trim($_POST['budget'] ?? '');
$timeline = trim($_POST['timeline'] ?? '');
$scope    = trim($_POST['scope'] ?? '');
$url      = trim($_POST['url'] ?? '');
$lang     = trim($_POST['lang'] ?? '');
$trap     = trim($_POST['website'] ?? ''); // honeypot: real users never fill this

// Bots that fill the honeypot get a fake success and no mail.
if ($trap !== '') {
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
        $subject = 'Neue Projektanfrage (Wizard) über ilhan-buenyamin.com';
        break;
    case 'website-check':
        $subject = 'Website-Check-Anfrage über ilhan-buenyamin.com';
        break;
    default:
        $subject = 'Neue Projektanfrage über ilhan-buenyamin.com';
}

$body = "Name: {$name}\n"
      . "E-Mail: {$email}\n"
      . ($topic !== ''    ? "Projektart: {$topic}\n"   : '')
      . ($budget !== ''   ? "Budget: {$budget}\n"      : '')
      . ($timeline !== '' ? "Zeitrahmen: {$timeline}\n" : '')
      . ($url !== ''      ? "Website: {$url}\n"        : '')
      . ($lang !== ''     ? "Sprache: {$lang}\n"       : '')
      . ($scope !== ''    ? "\nProjektbeschreibung:\n{$scope}\n" : '')
      . ($message !== ''  ? "\n{$message}\n"           : '');

$headers = "From: no-reply@ilhan-buenyamin.com\r\n"
         . "Reply-To: {$email}\r\n"
         . "Content-Type: text/plain; charset=UTF-8";

if (mail($to, $subject, $body, $headers)) {
    http_response_code(200);
    echo 'ok';
} else {
    http_response_code(500);
    echo 'fail';
}
