/**
 * Pins what has to stay in step across files that cannot import each other: the
 * server's mail script and the two forms, and every plain file that repeats
 * SITE_CONFIG.baseUrl. Neither PHP nor Apache runs here, so these read the files as
 * text.
 *
 *   node --test scripts/site-consistency.test.mjs
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { readBaseUrl } from './site-config-reader.mjs';

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const BASE = readBaseUrl(read('src/app/config/site.config.ts'));
const HOST = BASE ? new URL(BASE).host : '';

test('site.config.ts names a base URL', () => {
  assert.ok(BASE, 'site.config.ts has no baseUrl entry');
});

test('the mail script traps the honeypot field the two forms actually send', () => {
  const php = read('public/send_mail/send_mail.php');
  assert.match(php, /if \(field\('hp_contact_ref'\) !== ''\)/);
  for (const form of ['contact-wizard', 'website-check']) {
    assert.match(read(`src/app/${form}/${form}.html`), /name="hp_contact_ref"/, `${form}.html`);
    assert.match(read(`src/app/${form}/${form}.ts`), /hp_contact_ref: this\.honeypot\(\)/, `${form}.ts`);
  }
});

/* The legacy name is delivered, flagged, until a fixed date — after it, a trap again.
   Moving "website" back into the trap above would drop autofilled inquiries from old
   tabs again; delivering it without an end date would let replaying bots through. */
test('the legacy honeypot name is flagged until a fixed date, then trapped', () => {
  const php = read('public/send_mail/send_mail.php');
  assert.match(php, /const LEGACY_HONEYPOT_UNTIL = '\d{4}-\d{2}-\d{2}';/);
  assert.match(php, /\$legacyTrap = field\('website'\);/);
  assert.match(php, /if \(\$legacyTrap !== '' && date\('Y-m-d'\) > LEGACY_HONEYPOT_UNTIL\) \{\s*http_response_code\(200\);/);
  assert.match(php, /\$subject = '\[Honeypot-Verdacht\] ' \. \$subject;/);
  assert.doesNotMatch(php, /field\('hp_contact_ref'\)[^;\n]*website/, 'the legacy name must not join the immediate trap');
});

test('every domain redirect in .htaccess targets the configured address', () => {
  const htaccess = read('public/.htaccess');
  const targets = [...htaccess.matchAll(/^RewriteRule \S+ (https?:\/\/[^/%\s$]+)/gm)]
    .map((m) => m[1])
    .filter((origin) => !origin.endsWith('//softlyx.tr'));
  assert.ok(targets.length >= 4, `expected the index.html, robots/sitemap, domain and HTTPS rules, found ${targets.length}`);
  for (const target of targets) assert.equal(target, BASE);
});

/* Each RewriteRule with the host conditions written directly above it, and whether
   each condition carries [OR] — without it Apache ANDs the hosts and the rule never fires. */
const hostRules = () => {
  const rules = [];
  let hosts = [];
  for (const line of read('public/.htaccess').split(/\r?\n/)) {
    const cond = line.match(/^RewriteCond %\{HTTP_HOST\} (\S+)(?: \[([^\]]*)\])?/);
    if (cond) hosts.push({ pattern: new RegExp(cond[1], 'i'), or: /(^|,)OR(,|$)/.test(cond[2] ?? '') });
    else if (line.startsWith('RewriteRule ')) { if (hosts.length) rules.push({ line, hosts }); hosts = []; }
  }
  return rules;
};

test('every host-bound redirect moves all three old hosts and never the configured one', () => {
  const rules = hostRules();
  assert.ok(rules.length >= 3, `expected the index.html, robots/sitemap and domain rules, found ${rules.length}`);
  for (const { line, hosts } of rules) {
    // The host conditions form one OR chain: every one but the last carries [OR].
    hosts.forEach((h, i) => assert.equal(h.or, i < hosts.length - 1, `${line}: host condition ${i + 1} [OR]`));
    // A typo in a host pattern would silently switch the move off for that host.
    for (const old of ['ilhan-buenyamin.com', 'www.ilhan-buenyamin.com', 'www.softlyx.de']) {
      assert.ok(hosts.some((h) => h.pattern.test(old)), `${line} does not move ${old}`);
    }
    // Matching the target host itself would loop.
    assert.equal(hosts.some((h) => h.pattern.test(HOST)), false, `${line} matches ${HOST}`);
  }
});

test('the plain files that repeat the address use the configured one', () => {
  const index = read('src/index.html');
  const absolute = [...index.matchAll(/(?:href|content)="(https?:\/\/[^/"]+)\//g)].map((m) => m[1]);
  assert.equal(absolute.length, 4, 'canonical, og:url, og:image, twitter:image');
  for (const origin of absolute) assert.equal(origin, BASE, 'src/index.html');

  const subjects = [...read('public/send_mail/send_mail.php').matchAll(/\$subject = '[^']* über ([^']+)';/g)];
  assert.equal(subjects.length, 3, 'one subject per form');
  for (const [, host] of subjects) assert.equal(host, HOST, 'send_mail.php subject');
});
