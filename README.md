# MyWebsiteV2

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 21.2.5.

## Development server

To start a local development server, run:

```bash
ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

### Build budgets

`angular.json` sets `anyComponentStyle` to **6 kB warning / 10 kB error**, not the CLI
default of 4/8. Why, so nobody has to guess later:

- Six of the 24 component styles were above 4 kB (measured 2026-09-10: hero 7.37, header
  5.80, offerings 5.79, contact-wizard 4.87, portfolio 4.52, contact 4.24). Six identical
  warnings on every build are noise, and a seventh would have gone unnoticed.
- `hero.scss` at 7.37 kB was 630 bytes short of the 8 kB **error**, which fails
  `ng build` and therefore the deploy (`.github/workflows/deploy.yml` runs `npm run build`).
- At 6 kB exactly one warning remains — hero, the real outlier — and the error headroom
  grows to 2.6 kB.

Two things to know before touching this:

- **This was a threshold decision, not smaller CSS.** Nothing was optimised. `hero.scss` is
  still the largest component style and is still the one to watch.
- It is a deliberate deviation from the Guardian quality template
  (`~/.claude/guardian/templates/quality/angular-budgets.json`, whose SETUP-PROMPT says not
  to simply raise a budget that is already exceeded). The trade-off was put to the repo
  owner with the numbers and decided knowingly.

The budget is measured **per compiled stylesheet output file**, not per component. So
splitting a component's SCSS into `@use` partials changes nothing (they inline into the
same output), and adding a second `styleUrls` entry would split the number without removing
a single byte of CSS. Neither is a way to get under the limit — only less CSS is.

### Why the SSR packages are devDependencies

`@angular/platform-server` and `@angular/ssr` sit in **devDependencies**, not
`dependencies`, which is not where `ng new` puts them. The reason is this project's output
mode:

- `angular.json` sets `"outputMode": "static"`. The build produces `dist/my-website-v2/browser/`
  plus `prerendered-routes.json` and **no server bundle** — there is no `server/` directory
  to deploy.
- `.github/workflows/deploy.yml` mirrors only `dist/my-website-v2/browser/` to the host,
  which serves plain files. No Node process runs in production.
- The only import of either package is `provideServerRendering` in
  `src/app/app.config.server.ts`, which runs during **prerendering on the CI runner**.
  Nothing imports `@angular/ssr` at all.

So both are build tools here, and `dependencies` was simply the wrong shelf. The move was
prompted by `npm audit --omit=dev` flagging two high-severity **SSR runtime** advisories in
`@angular/platform-server` (GHSA-v3p8-whq6-r5jg, GHSA-f6mr-pjwc-34m4) on 2026-09-11, for
which no patched 21.x exists — only `22.2.0-next.*`. Neither advisory is reachable from a
static build.

**This is a classification fix, not a way to silence the audit.** If SSR is ever switched
on here, these packages belong back in `dependencies` and the advisories become real and
must be dealt with. `@angular/ssr` had to move too: it keeps `platform-server` as a peer
dependency, so leaving it behind kept the finding alive.

## Running unit tests

To execute unit tests with the [Vitest](https://vitest.dev/) test runner, use the following command:

```bash
ng test
```

### Button style guard (`npm run test:buttons`)

`scripts/button-style-check.mjs` is not an invariant check like the layout and contrast
guards — there is no "correct" padding it could assert. It compares **two builds**:

```bash
node scripts/button-style-check.mjs sweep <baseline-dist>/browser before.json
node scripts/button-style-check.mjs sweep dist/my-website-v2/browser after.json
node scripts/button-style-check.mjs diff before.json after.json
```

Run it whenever the shared button CSS in `styles.scss` is touched. It walks every
prerendered route in both themes, resting **and** with `:hover` forced through CDP, and
reports any computed property that moved.

Two things it covers that reading the diff does not:

- **`:hover`.** A component rule only wins the properties it *declares*. The wizard's small
  button declared no hover `transform`, so while it was also called `.btn-ghost` the global
  base silently handed it a 2px jump its own `transition` does not even list. A sweep of
  resting state alone calls that "identical". The button is `.btn-quiet` now — renaming it
  is what removed the trap, and `contact-wizard.spec.ts` pins the name so it cannot drift
  back.
- **The wizard's success screen.** It appears only after a successful submit, so it is on no
  prerendered route — and it is exactly where dead CSS was removed. The guard injects a
  stand-in into the real component subtree carrying its real `_ngcontent` attribute (which
  is what decides whether component rules apply at all), and **fails** if that injection
  never succeeds rather than skipping it quietly.

The stand-ins cover the wizard's `.btn-submit`, `.btn-next`, `.btn-back`, `.error-msg`
(with its mailto link) and the whole success screen — all of which sit behind a wizard step
or a successful send and appear on no prerendered route. They hang in a rebuilt
`.wizard` > `.wizard-nav` chain, because parentage decides `display` through blockification.

**Three limits worth knowing.**

1. The stand-ins carry the *wizard's* encapsulation attribute, so `website-check`'s side of
   the shared rules is not covered, and neither is the wizard's own `.privacy-note` (it sits
   behind step 3 — the `.privacy-note` the sweep measures is the site check's). Both were
   checked by hand; `.privacy-note` has no component-local remainder at all, so the two
   resolve identically.
2. Only the properties in the script's `PROPS` list are compared. A value that moves between
   rules but is not in that list would make the guard report "no differences" about exactly
   what was lost — extend the list when you move something new.
3. Computed styles, not pixels: a difference this guard cannot see could still show in a
   screenshot.

### Contrast guard and `--danger`

`npm run test:contrast` does the WCAG arithmetic on the shipped stylesheets. Since
2026-09-11 it also covers the **error text**, which both form components used to hard-code
as `#ff4444`. That passes on the dark ground (5.70:1) and fails on the light one — 3.07:1
on `--bg`, 2.83:1 on `--surface`, under the one message that tells a visitor their enquiry
did *not* go out. It is now the `--danger` token: `#ff4444` in `:root`, `#b3261e` in
`body.light` (5.43:1 on `--surface`, 5.89:1 on `--bg`).

The guard fails if the token disappears, if the shared `.error-msg` rule stops painting
from it, or if either form component writes a literal colour for `.error-msg` again. All
three were verified by deliberately breaking them.

Since 2026-10-14 it also measures the **footer tagline** next to the logo (`.brand-person`,
`--dim` on `--bg`, both themes) and fails if an `opacity` lands on `.footer-logo` or the line again — `opacity: 0.7`
on the whole logo link once pulled it to 2.66:1 in light mode.

### Head guard (`npm run test:head`)

The business is presented as **Softlyx**; the owner's personal name stays out of what
Google and link previews show (decision of 2026-10-14). `scripts/head-check.mjs` reads every
prerendered `index.html` after the build — `npm run build` runs it, so the deploy does — and
fails when:

- the `<head>` (title, meta, Open Graph, Twitter) or the JSON-LD names the owner — in the
  spellings it could plausibly come back in: percent-encoded (also next to a broken byte),
  numeric HTML entities and named ones for accented letters and format characters, with
  or without the semicolon, format characters (soft hyphen, zero-width, direction marks), any diacritic or combining mark (ü, İ, u + U+0308),
  the dotless ı, transliterated (Buenyamin, Bunyamin), capitals;
- a JSON-LD block is not valid JSON (it is parsed, so a hand-written `\u00fc` cannot hide);
- the `og:image` a page points at is not an absolute URL, is on another host than the
  page's canonical (localhost, a staging domain), or is not in the build output;
- fewer than 10 pages were found (the guard would have measured nothing).

Half of the head lives in `src/index.html` and is never rewritten by `SeoService`
(`meta author`, `og:image:alt`), which is why this is a script over the build output and
not a unit test. There is ONE name rule, `src/testing/owner-name.ts`: the specs import it,
and so does the script — Node 22.18+ strips the type annotations on import (`engines`
says so, and the workflows use `check-latest`), so keep that file free of enums and namespaces. The page check
itself is pinned by fixtures in `scripts/head-check.test.mjs`, which `npm run test:head`
runs first.

**Deliberately out of scope:** the domain `ilhan-buenyamin.com` (cut out before matching;
the site moved to softlyx.de, but the mail address still uses it), the text of the legal notice and the privacy policy
(the law requires the name there), and the visible page. Google may still build a snippet
from visible text, so this guard keeps the name out of the metadata, not out of every
search result.

The old card `og-image.jpg` (name in large type) is removed from `public/`. The deploy
never deletes on the server, so it is on the known-leftovers list of
`.github/workflows/server-cleanup.yml` — run that with `confirm=loeschen` after the
deploy, or the old URL keeps serving it to image search and preview caches.

The share card `public/assets/img/og-softlyx.png` and its alt text are **German only**,
also on `/en/` pages — the static alt in `src/index.html` describes exactly that card. A
page that passes its own `ogImage` to `SeoService` would need its own alt.

## Domain

The site lives on `https://softlyx.de` since 2026-10-16. `SITE_CONFIG.baseUrl` is the one
source: canonical, hreflang, structured data, the default og:image, the sitemap
(`scripts/generate-sitemap.mjs` reads the line) and the form endpoint all derive from it.
Plain files cannot read it and repeat it — change them together with `baseUrl`:
`src/index.html` (the template before prerendering), `public/robots.txt` (the sitemap
generator fails the build when it does not match), the redirect targets in
`public/.htaccess` and the mail subjects in `public/send_mail/send_mail.php`.

`public/.htaccess` moves `ilhan-buenyamin.com`, `www.ilhan-buenyamin.com` and `www.softlyx.de`
to the same path on `https://softlyx.de` with a 301 — but only addresses that are not an
existing file. Page addresses are prerendered directories and all move (without the closing
slash in two hops, the second from DirectorySlash), and so do the `index.html` behind
each directory, `robots.txt` and `sitemap.xml`; every other file stays — chunks, `/api/`, `/send_mail/` and the Search
Console token `google*.html` stay reachable on the old host.
A tab still open there loads its chunks and posts its form in CORS mode, which a
cross-host 301 breaks silently; the old Search Console property must stay verified for
the change of address. Plain HTTP goes to `https://softlyx.de` without exception.

The forms post to an absolute URL on purpose: `ng serve` sends to the deployed script, which
allows `localhost:4200/4201` via CORS. A relative URL would break local development.

Setup outside the repository: softlyx.de is registered at netcup, its nameservers are IONOS
(`ns1045.ui-dns.*`, required for the IONOS certificate), and it is connected to the webspace
folder `/website` — not `/`, which holds an old copy of the site. The mail address stays
`mail@ilhan-buenyamin.com`, so the old domain must stay registered and pointed at IONOS,
and its redirects should stay for at least a year.

`scripts/site-consistency.test.mjs` (run by `npm run test:head`) checks that every domain
redirect targets `baseUrl` and that the mail script traps the honeypot field the forms send.

The honeypot is `hp_contact_ref`. Until 2026-10-16 it was `website`, which browsers
autofilled; until `LEGACY_HONEYPOT_UNTIL` (2026-11-16) a request that fills only the old
name — a tab opened before the switch — is delivered with `[Honeypot-Verdacht]` in the
subject instead of being dropped. After that date it is a trap again: bots that replay a
recorded field set send it too.

**Before merging a change to the redirects:** `https://softlyx.de/` must answer with a valid
certificate — every old address is sent there, and browsers cache the 301. Check that
`LEGACY_HONEYPOT_UNTIL` in `send_mail.php` still lies about 30 days after the deploy.

**In the same release window, outside this repository:** the Turkish site (softlyx.tr repo)
names this site in its `hreflang="de"` and country link. Pointed at `ilhan-buenyamin.com` it
names a 301, which Google ignores as an alternate — the de/tr pair stops being reciprocal
until that repo says `https://softlyx.de/` too.

**After a deploy that touches the redirects** (a wrong 301 is cached by browsers):

```sh
# one 301 to https://softlyx.de/en/ each, path kept
for h in ilhan-buenyamin.com www.ilhan-buenyamin.com www.softlyx.de; do
  curl -sI https://$h/en/ | grep -i '^location'; done
curl -sI http://softlyx.de/en/ | grep -i '^location'          # https://softlyx.de/en/
curl -s -o /dev/null -w '%{http_code}\n' https://softlyx.de/en/  # 200
# files stay on the old host: 405 (GET on the mail script), 200 (token)
curl -s -o /dev/null -w '%{http_code}\n' https://ilhan-buenyamin.com/send_mail/send_mail.php
curl -s -o /dev/null -w '%{http_code}\n' https://ilhan-buenyamin.com/google6c91563a23fa41df.html
curl -sI https://ilhan-buenyamin.com/tr/ | grep -i '^location'  # https://softlyx.tr/ in one hop
curl -sIL https://ilhan-buenyamin.com/en | grep -i '^location'   # two hops, both https
curl -sI https://ilhan-buenyamin.com/en/index.html | grep -i '^location'  # https://softlyx.de/en/
```

Open point: where PHP's `error_log()` writes on the IONOS webspace is not known yet — look it
up once in the IONOS hosting settings. If it goes nowhere, the mail script's log line for a
failed `mail()` is lost, and the failure is visible only to the visitor (error text plus the
prefilled mail link).

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.
