/**
 * Fixtures for the robots.txt rule the sitemap generator enforces on every build.
 *
 *   node --test scripts/robots-check.test.mjs
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { announcesSitemap } from './robots-check.mjs';
import { readBaseUrl } from './site-config-reader.mjs';

const BASE = 'https://softlyx.de';

test('accepts the sitemap line with either line ending and stray spaces', () => {
  assert.equal(announcesSitemap('User-agent: *\nAllow: /\n\nSitemap: https://softlyx.de/sitemap.xml\n', BASE), true);
  assert.equal(announcesSitemap('User-agent: *\r\nSitemap: https://softlyx.de/sitemap.xml\r\n', BASE), true);
  assert.equal(announcesSitemap('Sitemap: https://softlyx.de/sitemap.xml  ', BASE), true);
});

test('rejects a sitemap on another host, a missing line and a near miss', () => {
  assert.equal(announcesSitemap('Sitemap: https://ilhan-buenyamin.com/sitemap.xml\n', BASE), false);
  assert.equal(announcesSitemap('User-agent: *\nAllow: /\n', BASE), false);
  assert.equal(announcesSitemap('Sitemap: https://www.softlyx.de/sitemap.xml\n', BASE), false);
  assert.equal(announcesSitemap('# Sitemap: https://softlyx.de/sitemap.xml\n', BASE), false);
});

test('the shipped robots.txt announces the sitemap under the configured address', () => {
  const config = readFileSync(new URL('../src/app/config/site.config.ts', import.meta.url), 'utf8');
  const base = readBaseUrl(config);
  assert.ok(base, 'site.config.ts has no baseUrl entry');
  const robots = readFileSync(new URL('../public/robots.txt', import.meta.url), 'utf8');
  assert.equal(announcesSitemap(robots, base), true);
});
