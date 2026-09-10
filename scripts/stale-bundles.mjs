// Works out which hashed bundle files on the server belong to older deploys.
//
// This lives in its own file, and has its own tests, because it is the whole safety
// argument of the bundle sweep in .github/workflows/server-cleanup.yml. Inside a YAML
// `run:` block none of it could be re-run, and a later edit could have weakened it
// without anything noticing.
//
// It is deliberately a pure function over two lists. Everything that talks to the
// server, and the check that the server actually serves this build, stays in the
// workflow — this file only answers "given these two lists, which names are stale".

/**
 * Anchored on both ends, and the character class contains neither a slash nor a space,
 * so no name that survives it can leave the document root or carry a second command.
 * Matches esbuild's output for this project: main-<HASH>.js, chunk-<HASH>.js,
 * styles-<HASH>.css. polyfills and scripts are included because Angular emits them for
 * other build configurations; webpack-era shapes (main.<hex>.js, runtime-*, vendor-*)
 * are NOT matched, which is why callers must not claim more than "no bundle matching
 * this pattern remains".
 */
export const BUNDLE_PATTERN = /^(main|chunk|polyfills|styles|scripts)-[A-Z0-9]+\.(js|css)$/;

/**
 * Every line of the listing that is a bundle name, deduplicated and sorted.
 *
 * Lines are trimmed first, so surrounding whitespace and a CR from a CRLF listing do
 * not hide an otherwise valid name. The pattern is still anchored on both ends — it is
 * applied to the trimmed line, so a name with an inner space or slash stays rejected.
 */
export function bundlesIn(lines) {
  const names = lines
    .map(line => line.trim())
    .filter(line => BUNDLE_PATTERN.test(line));
  return [...new Set(names)].sort();
}

/**
 * Names present on the server that this build does not ship.
 *
 * serverListing: raw lines of the document-root listing (may contain anything).
 * shipped:       file names the current build produced (may contain anything).
 *
 * Anything not matching the pattern is dropped from BOTH sides before comparing, so a
 * directory, a dotfile or a stray error line can never end up in the result.
 */
export function staleBundles(serverListing, shipped) {
  const onServer = bundlesIn(serverListing);
  const inBuild = new Set(bundlesIn(shipped));
  return onServer.filter(name => !inBuild.has(name));
}

/**
 * The bundles this build ships that the server does not have.
 *
 * Not the same question as staleBundles, and not interchangeable with it: this one is
 * used after a sweep to prove nothing needed was removed.
 */
export function missingFromServer(serverListing, shipped) {
  const onServer = new Set(bundlesIn(serverListing));
  return bundlesIn(shipped).filter(name => !onServer.has(name));
}

/* Thin CLI so the workflow can call this without inlining logic again:
     node scripts/stale-bundles.mjs           <listing-file> <dist-dir>   -> stale names
     node scripts/stale-bundles.mjs --missing <listing-file> <dist-dir>   -> names gone from the server
   One name per line, nothing else, so the caller can read it with `while read`. */
const { pathToFileURL } = await import('node:url');
if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) {
  const { readFileSync, readdirSync } = await import('node:fs');
  const args = process.argv.slice(2);
  const wantMissing = args[0] === '--missing';
  const [listingFile, distDir] = wantMissing ? args.slice(1) : args;
  if (!listingFile || !distDir) {
    console.error('usage: stale-bundles.mjs [--missing] <listing-file> <dist-dir>');
    process.exit(2);
  }
  const listing = readFileSync(listingFile, 'utf8').split('\n');
  const shipped = readdirSync(distDir);
  const result = wantMissing ? missingFromServer(listing, shipped) : staleBundles(listing, shipped);
  for (const name of result) console.log(name);
}
