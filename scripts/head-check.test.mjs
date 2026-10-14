/**
 * Fixtures for the page check in head-check.mjs. The guard runs on the real build
 * after every `npm run build`; these cases pin what it must catch and what it must
 * let through, so a change to the regexes cannot quietly turn it into a pass.
 *
 *   node --test scripts/head-check.test.mjs
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { checkPage } from './head-check.mjs';

const BASE = 'https://ilhan-buenyamin.com';
const page = ({ head = '', ld = '{"@type":"ProfessionalService","name":"Softlyx"}' } = {}) =>
  '<!doctype html><html><head><title>Softlyx — Websites</title>'
  + '<link rel="canonical" href="' + BASE + '/">'
  + '<meta property="og:image" content="' + BASE + '/assets/img/og-softlyx.png">'
  + head
  + '<script type="application/ld+json">' + ld + '</script>'
  + '</head><body><footer>© Bünyamin Ilhan</footer></body></html>';

test('a clean page passes, the visible body is out of scope, the domain is not the name', () => {
  assert.deepEqual(checkPage('/', page()), { fails: [], image: '/assets/img/og-softlyx.png' });
});

test('catches the name in the head in a meta tag, an entity and the Turkish capital', () => {
  for (const head of ['<meta name="author" content="Bünyamin Ilhan">', '<meta name="author" content="B&uuml;nyamin">',
    '<meta property="og:title" content="İlhan">']) {
    assert.equal(checkPage('/', page({ head })).fails.length, 1, head);
  }
});

test('catches the name in structured data, also as an escape and percent-encoded', () => {
  for (const ld of ['{"name":"Bünyamin"}', '{"name":"B\\u00fcnyamin"}', '{"sameAs":["https://www.linkedin.com/in/b%C3%BCnyamin-ilhan/"]}']) {
    assert.deepEqual(checkPage('/', page({ ld })).fails, ['/: the structured data names the owner'], ld);
  }
});

test('reports invalid structured data instead of skipping it', () => {
  assert.deepEqual(checkPage('/', page({ ld: '{"@context" broken' })).fails, ['/: the structured data is not valid JSON']);
});

test('reads og:image and canonical whatever the attribute order or quotes', () => {
  const html = "<html><head><link href='" + BASE + "/en/' rel='canonical'>"
    + "<meta content='" + BASE + "/assets/img/og-softlyx.png' property='og:image'></head></html>";
  assert.deepEqual(checkPage('/en/', html), { fails: [], image: '/assets/img/og-softlyx.png' });
});

test('flags an og:image on another host, a relative one and a missing one', () => {
  const swap = (from, to) => page().replace(from, to);
  assert.match(checkPage('/', swap(BASE + '/assets', 'http://localhost:4200/assets')).fails[0], /og:image is on http:\/\/localhost:4200/);
  assert.match(checkPage('/', swap(BASE + '/assets/img/og-softlyx.png', 'assets/x.png')).fails[0], /not an absolute URL/);
  assert.match(checkPage('/', swap(/<meta property="og:image"[^>]*>/, '')).fails[0], /no og:image/);
  assert.match(checkPage('/', swap(BASE + '/"', '/"')).fails[0], /no absolute canonical/);
});
