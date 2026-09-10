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

## Running unit tests

To execute unit tests with the [Vitest](https://vitest.dev/) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.
