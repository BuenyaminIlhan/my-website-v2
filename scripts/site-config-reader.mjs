/**
 * Reads SITE_CONFIG.baseUrl out of site.config.ts as text. The Node scripts cannot
 * import the TypeScript module, and a second copy of the address would let a check
 * compare a file against itself — so they all read the one constant through this.
 *
 * @param {string} configSource content of src/app/config/site.config.ts
 * @returns {string | undefined} the base URL, or undefined when the entry is missing
 */
export function readBaseUrl(configSource) {
  return configSource.match(/^\s*baseUrl:\s*'([^']*)'/m)?.[1];
}
