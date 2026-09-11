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
  ghost button declares no hover `transform`, so the global base silently handed it a 2px
  jump its own `transition` does not even list. A sweep of resting state alone calls that
  "identical".
- **The wizard's success screen.** It appears only after a successful submit, so it is on no
  prerendered route — and it is exactly where dead CSS was removed. The guard injects a
  stand-in into the real component subtree carrying its real `_ngcontent` attribute (which
  is what decides whether component rules apply at all), and **fails** if that injection
  never succeeds rather than skipping it quietly.

Computed styles, not pixels: a difference this guard cannot see could still show in a
screenshot.

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.
