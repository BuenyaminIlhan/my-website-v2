<?php
declare(strict_types=1);

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    exit;
}

$name    = trim($_POST['name'] ?? '');
$email   = trim($_POST['email'] ?? '');
$topic   = trim($_POST['topic'] ?? '');
$message = trim($_POST['message'] ?? '');
$trap    = trim($_POST['website'] ?? ''); // honeypot: real users never fill this

// Bots that fill the honeypot get a fake success and no mail.
if ($trap !== '') {
    http_response_code(200);
    echo 'ok';
    exit;
}

if ($name === '' || $message === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    exit('invalid');
}
if (mb_strlen($name) > 200 || mb_strlen($topic) > 200 || mb_strlen($message) > 10000) {
    http_response_code(400);
    exit('too long');
}

$to      = 'mail@ilhan-buenyamin.com';
$subject = 'Neue Projektanfrage über ilhan-buenyamin.com';
$body    = "Name: {$name}\n"
         . "E-Mail: {$email}\n"
         . ($topic !== '' ? "Projektart: {$topic}\n" : '')
         . "\n{$message}\n";

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
