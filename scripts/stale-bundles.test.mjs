// Run with: npm run test:sweep   (node's built-in runner, no dependency)
//
// The bundle sweep deletes files on the live server, so the list it computes is the
// only thing standing between "removes old build artefacts" and "removes the site".
// These cases are the ones an earlier cold review asked for by name.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { staleBundles, missingFromServer, bundlesIn, BUNDLE_PATTERN } from './stale-bundles.mjs';

const SHIPPED = ['main-BJMHECED.js', 'styles-HK4ON3DZ.css', 'chunk-2SVJFMHO.js', 'index.html', 'robots.txt'];

test('keeps only hashed bundle names, drops everything else', () => {
  const listing = [
    'main-BJMHECED.js',
    'styles-HK4ON3DZ.css',
    'index.html',
    'index.csr.html',
    '.htaccess',
    'robots.txt',
    'sitemap.xml',
    'manifest.json',
    'favicon.svg',
    'assets/',
    'fonts/',
    'send_mail/',
    'api/',
    'en/',
    '404/',
  ];
  assert.deepEqual(bundlesIn(listing), ['main-BJMHECED.js', 'styles-HK4ON3DZ.css']);
});

test('refuses every shape that could escape the document root or carry a command', () => {
  const hostile = [
    '../../etc/passwd',
    'main-EVIL.js; rm -f /website/index.html',
    'main with space-ABCD1234.js',
    'subdir/main-NESTED1.js',
    '/website/main-ABCD1234.js',
    'main-.js',
    'main-lowercase.js',
    'main-ABCD1234.js.bak',
    '.main-ABCD1234.js',
    'main-ABCD1234.jsx',
    '',
    '   ',
  ];
  for (const name of hostile) {
    assert.equal(BUNDLE_PATTERN.test(name), false, `must not match: ${JSON.stringify(name)}`);
  }
  assert.deepEqual(staleBundles(hostile, SHIPPED), []);
});

test('stale = on the server, not in this build', () => {
  const listing = [...SHIPPED, 'main-OLD11111.js', 'chunk-OLD22222.js', 'styles-OLD33333.css'];
  assert.deepEqual(staleBundles(listing, SHIPPED), [
    'chunk-OLD22222.js',
    'main-OLD11111.js',
    'styles-OLD33333.css',
  ]);
});

test('nothing this build ships is ever stale, whatever order the listing arrives in', () => {
  const listing = [...SHIPPED].reverse();
  assert.deepEqual(staleBundles(listing, SHIPPED), []);
});

test('duplicate listing lines do not produce duplicate removals', () => {
  const listing = ['main-OLD11111.js', 'main-OLD11111.js', ...SHIPPED];
  assert.deepEqual(staleBundles(listing, SHIPPED), ['main-OLD11111.js']);
});

test('an empty or error-only listing yields nothing to remove', () => {
  assert.deepEqual(staleBundles([], SHIPPED), []);
  assert.deepEqual(
    staleBundles(['mirror: Login failed: Login incorrect', 'Fatal error: max-retries exceeded'], SHIPPED),
    [],
  );
});

test('missingFromServer answers the opposite question, and is not the same list', () => {
  const listing = ['main-BJMHECED.js', 'chunk-2SVJFMHO.js', 'main-OLD11111.js'];
  assert.deepEqual(missingFromServer(listing, SHIPPED), ['styles-HK4ON3DZ.css']);
  assert.deepEqual(staleBundles(listing, SHIPPED), ['main-OLD11111.js']);
});

test('a build that produced no bundles marks every server bundle stale — the caller must prevent this', () => {
  // Documents the sharp edge rather than hiding it: this function cannot tell a broken
  // build from a new release. The workflow compares the served index.html first.
  const listing = ['main-LIVE1111.js', 'styles-LIVE2222.css'];
  assert.deepEqual(staleBundles(listing, ['index.html']), ['main-LIVE1111.js', 'styles-LIVE2222.css']);
});
