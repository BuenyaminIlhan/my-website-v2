/**
 * Whether robots.txt announces the sitemap under the site's own address.
 *
 * public/robots.txt is the one place that names the sitemap to crawlers, and it is a
 * plain file that cannot read SITE_CONFIG. Left on an old domain it points crawlers at
 * a redirect on another host, and nothing else in the build would notice. The sitemap
 * generator calls this on every build; robots-check.test.mjs pins the rule.
 *
 * @param {string} robots content of robots.txt, any line ending
 * @param {string} base SITE_CONFIG.baseUrl, without a closing slash
 */
export function announcesSitemap(robots, base) {
  const expected = `Sitemap: ${base}/sitemap.xml`;
  return robots.split(/\r?\n/).some((line) => line.trim() === expected);
}
