/**
 * Contrast guard: reads the shipped stylesheets and does the WCAG arithmetic on
 * the terminal's light-mode colours.
 *
 * The palette was tuned on the dark surface and corrected by hand for the light
 * one; nothing but a comment guarded those values, which is how the [ok] marker
 * ended up at 1.86:1 where 4.5:1 is needed. jsdom models no cascade, so a unit
 * test cannot see this, and the Angular test builder refuses to import a .scss
 * file as text. Hence a script, in the same spirit as layout-check.mjs.
 *
 *   npm run test:contrast
 *
 * Exits non-zero when a checked colour falls under its threshold, when a comment
 * claims a ratio the colour does not reach, or when the file moved far enough
 * that the guard can no longer find what it is meant to measure. Silence is not
 * a pass here: a rule it cannot locate is reported, never skipped.
 *
 * What it cannot see: colours set outside the stylesheets. An inline
 * `style="color: …"` in a template, or a `<style>` block in index.html, ships a
 * colour this guard never reads. No template uses either today; if one ever
 * does, the value belongs in a token here rather than in the markup.
 */
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as sass from 'sass';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (rel) => readFileSync(join(root, rel), 'utf8');
const styles = read('src/styles.scss');
const terminal = read('src/app/terminal-panel/terminal-panel.scss');

const fail = [];

const channels = (hex) => {
  const h = hex.replace('#', '');
  const full = h.length === 3 ? [...h].map((c) => c + c).join('') : h;
  return [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16));
};

const luminance = (hex) =>
  channels(hex)
    .map((v) => {
      const c = v / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    })
    .reduce((sum, c, i) => sum + [0.2126, 0.7152, 0.0722][i] * c, 0);

const contrast = (a, b) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

/* Both comment forms. Sass' `//` survived an earlier version, which meant a
   commented-out `// --danger: #ff4444;` was counted as a real declaration and
   failed a clean tree — and, worse, could have been the value read as shipped.
   The URL guard keeps `https://…` from being eaten as a line comment. */
const BLOCK_COMMENT = new RegExp('[/][*][^]*?[*][/]', 'g');
const LINE_COMMENT = new RegExp('(^|[^:])[/][/].*', 'gm');
const stripComments = (css) => css.replace(BLOCK_COMMENT, '').replace(LINE_COMMENT, '$1');

/* Every innermost rule as { selectors, declarations }. Grouped selectors are
   split, so `.visitor-line, .load-line { ... }` is found under either name — a
   plain "selector followed by a brace" search only ever sees the last one. */
const RULE = new RegExp('([^{}]+)[{]([^{}]*)[}]', 'g');
const SPACES = new RegExp('[ ]+', 'g');
const rulesOf = (css) =>
  [...stripComments(css).matchAll(RULE)].map((m) => ({
    selectors: m[1]
      .split(',')
      .map((s) => s.trim().replace(SPACES, ' '))
      .filter(Boolean),
    declarations: m[2],
  }));

const declaration = (rules, selector, property) => {
  const hit = rules
    .filter((r) => r.selectors.includes(selector))
    .map((r) => r.declarations.match(new RegExp(property + ':[ ]*([^;]+)')))
    .filter(Boolean)
    .pop();
  return hit ? hit[1].trim() : null;
};

/** A custom property declared inside the body.light block of styles.scss. */
const lightVar = (name) => {
  /* Comments stripped first: a commented-out old value above the real one
     would otherwise be the number this guard measures. */
  const block = stripComments(styles).match(new RegExp('body[.]light[ ]*[{]([^}]*)[}]'));
  if (!block) {
    fail.push('src/styles.scss has no body.light block any more');
    return null;
  }
  const found = block[1].match(new RegExp('--' + name + ':[ ]*(#[0-9a-fA-F]{3,6})'));
  if (!found) {
    fail.push('body.light has no --' + name);
    return null;
  }
  return found[1];
};

/* Only the light-mode block counts for the text colours: the same selectors
   carry the dark values above it, and a whole-file search reads those instead. */
const lightBlockText = (() => {
  const start = terminal.indexOf(':host-context(body.light) {');
  if (start < 0) {
    fail.push('terminal-panel.scss has no :host-context(body.light) block');
    return '';
  }
  let depth = 0;
  for (let i = terminal.indexOf('{', start); i < terminal.length; i++) {
    if (terminal[i] === '{') depth++;
    else if (terminal[i] === '}' && --depth === 0) return terminal.slice(start, i + 1);
  }
  fail.push('the :host-context(body.light) block is never closed');
  return '';
})();

const allRules = rulesOf(terminal);
const lightRules = rulesOf(lightBlockText);

/* The two surfaces are outer rules with nested children, so the innermost-rule
   parser above never sees them: their own declarations are read from the text
   between the opening brace and the first nested block. */
const outerDeclaration = (css, selector, property) => {
  const at = stripComments(css).indexOf('\n' + selector + ' {');
  if (at < 0) return null;
  const body = stripComments(css).slice(at);
  const own = body.slice(body.indexOf('{') + 1).split(new RegExp('[{}]'))[0];
  const found = own.match(new RegExp(property + ':[ ]*([^;]+)'));
  return found ? found[1].trim() : null;
};

/* Which variable a surface paints with is read from its rule, not assumed:
   repointing .terminal at another variable must not leave this guard green. */
const groundOf = (selector, expectedVar) => {
  const value = declaration(allRules, selector, 'background') ?? outerDeclaration(terminal, selector, 'background');
  if (!value) {
    fail.push('cannot find the background of ' + selector);
    return null;
  }
  const used = value.match(new RegExp('var[(]--([a-z0-9-]+)[)]'));
  if (!used) {
    fail.push(selector + ' no longer paints its background from a variable: ' + value);
    return null;
  }
  if (used[1] !== expectedVar) {
    fail.push(selector + ' now paints with --' + used[1] + ', the thresholds below assume --' + expectedVar);
  }
  return lightVar(used[1]);
};

const surface = groundOf('.terminal', 'surface');
const bar = groundOf('.terminal-bar', 'border');

/* Body text needs 4.5:1. The prompt glyphs and the pulsing live dot are
   decoration inside the terminal chrome and stay out of this list on purpose. */
const CHECKS = [
  ['.ok', 'surface', 'the [ok] marker'],
  ['.note', 'surface', 'the dimmed note after a command'],
  ['.visitor-line', 'surface', 'the visitor line'],
  ['.load-line', 'surface', 'the load-time line'],
  ['.req-line', 'surface', 'the request-count line'],
  ['.theme-line', 'surface', 'the theme line'],
  ['.lang-line', 'surface', 'the language line'],
  ['.ip-line', 'surface', 'the my-ip line'],
  ['.terminal-bar .bar-title', 'bar', 'the window title'],
  ['.terminal-bar .bar-live', 'bar', 'the live badge'],
];

for (const [selector, ground, label] of CHECKS) {
  const colour = declaration(lightRules, selector, 'color');
  if (!colour) {
    fail.push('no light-mode colour for ' + label + ' (' + selector + ')');
    continue;
  }
  const behind = ground === 'surface' ? surface : bar;
  if (!behind) continue;
  const ratio = contrast(colour, behind);
  const ok = ratio >= 4.5;
  console.log('  ' + (ok ? 'ok  ' : 'FAIL') + ' ' + label + ' — ' + colour + ' on ' + behind + ': ' + ratio.toFixed(2) + ':1');
  if (!ok) fail.push(label + ': ' + ratio.toFixed(2) + ':1, needs 4.5:1');
}

/* A wrong number beside a right colour misleads whoever reads the file next.
   Note the optional brace: declaration and comment sit on one line with the
   closing brace between them — forgetting that made an earlier version of this
   regex match nothing and pass everything. */
const CLAIMS = new RegExp('color:[ ]*(#[0-9a-fA-F]{6})[ ]*;[ ]*[}]?[ ]*[/][*][ ]*([0-9.]+):1 on --(surface|border)', 'g');
let claimsChecked = 0;
for (const m of lightBlockText.matchAll(CLAIMS)) {
  claimsChecked++;
  const [, colour, claimed, ground] = m;
  const behind = ground === 'surface' ? surface : bar;
  if (!behind) continue;
  const actual = contrast(colour, behind);
  if (Math.abs(actual - Number(claimed)) >= 0.15) {
    fail.push('comment says ' + colour + ' reaches ' + claimed + ':1 on --' + ground + ', measured ' + actual.toFixed(2) + ':1');
  }
}

if (claimsChecked === 0) {
  fail.push('not one published ratio was parsed — the comment check silently did nothing');
} else {
  console.log('  ok   ' + claimsChecked + ' published ratio(s) match the colour beside them');
}

/* ── The error text ────────────────────────────────────────────────
   Both form components hard-coded #ff4444. That passes on the dark ground
   (5.70:1) and fails on the light one (3.07:1 on --bg, 2.83:1 on --surface) —
   under the one message that tells a visitor their enquiry did NOT go out.
   It is a token now, and this check is what keeps it one: it fails if the
   token disappears, if the shared rule stops using it, or if either component
   writes a literal colour for .error-msg again. */
/* rulesOf() returns only INNERMOST blocks. The wizard's .error-msg has a nested
   `a { }`, so its own declarations never appeared there and a literal colour
   slipped straight past an earlier version of this check — reproduced, exit 0,
   before this was written. Hence a scanner that walks braces and reads what a
   rule declares ITSELF, nested children or not. */
/* Compiled, not read. Three hand-written scanners in a row got this wrong:
   the first missed a rule with a nested child, the second missed `p.error-msg`
   because it only accepted the class as the first part of a compound selector,
   and neither could ever see `.error { &-msg { … } }` — the selector does not
   exist in the source text at all. Sass resolves nesting, concatenation and
   grouping for us, and the output has flat selectors and no nested blocks, so
   the innermost-rule parser above is exact on it. */
const compile = (rel) => {
  const css = sass.compile(join(root, rel), { style: 'expanded', loadPaths: [join(root, 'src')] });
  return css.css;
};

/* Only the LAST compound counts: `.error-msg a` styles the mailto link inside
   the message, and that one is var(--accent) on purpose. A rule that merely
   mentions the class is not a rule that paints it. */
const targetsErrorMsg = (selector) => {
  const last = selector.split(new RegExp('[\\s>+~]+')).filter(Boolean).pop() ?? '';
  /* The dot is its own delimiter, so nothing guards the front: `p.error-msg`
     and `.card.error-msg` both count, while `.form-error-msg` never contains
     the substring at all. Two earlier versions demanded a non-word character
     before the dot and therefore missed every compound selector. */
  return new RegExp('[.]error-msg(?![-\\w])').test(last);
};

const errorRuleColours = (rel) => {
  return rulesOf(compile(rel))
    .filter((rule) => rule.selectors.some(targetsErrorMsg))
    .flatMap((rule) => [...rule.declarations.matchAll(new RegExp('(^|[\\s;{])color[ ]*:[ ]*([^;}]+)', 'g'))])
    .map((m) => m[2].trim());
};

/* The tripwire: this scanner must be able to find the shared rule. If it cannot,
   every component check below would pass by finding nothing — which is exactly
   how a guard reports success while measuring air. */
const sharedColours = errorRuleColours('src/styles.scss');
if (!sharedColours.length) {
  fail.push('the .error-msg scanner found no colour in styles.scss — the shared rule moved, so every check below is meaningless');
} else if (!sharedColours.every((c) => c === 'var(--danger)')) {
  fail.push('.error-msg in styles.scss paints with ' + sharedColours.join(', ') + ', expected var(--danger)');
}

/** A custom property declared in the :root block of styles.scss. */
const rootVar = (name) => {
  const block = stripComments(styles).match(new RegExp(':root[ ]*[{]([^}]*)[}]'));
  if (!block) {
    fail.push('src/styles.scss has no :root block any more');
    return null;
  }
  const found = block[1].match(new RegExp('--' + name + ':[ ]*(#[0-9a-fA-F]{3,6})'));
  if (!found) {
    fail.push(':root has no --' + name);
    return null;
  }
  return found[1];
};

/* Both themes, and both grounds within each: the two forms sit on different
   ones, and --surface is the tighter of the two. The dark values were only
   ever asserted by a comment; now they are measured like everything else. */
const THEMES = [
  ['light', lightVar('danger'), lightVar('surface'), lightVar('bg')],
  ['dark', rootVar('danger'), rootVar('surface'), rootVar('bg')],
];

for (const [theme, danger, onSurface, onBg] of THEMES) {
  if (!danger || !onSurface || !onBg) continue;
  for (const [ground, hex] of [['--surface', onSurface], ['--bg', onBg]]) {
    const ratio = contrast(danger, hex);
    const ok = ratio >= 4.5;
    console.log('  ' + (ok ? 'ok  ' : 'FAIL') + ' the error text (' + theme + ') — ' + danger
      + ' on ' + ground + ' (' + hex + '): ' + ratio.toFixed(2) + ':1');
    if (!ok) {
      fail.push('the error text (' + theme + ') on ' + ground + ': ' + ratio.toFixed(2) + ':1, needs 4.5:1');
    }
  }
}

/* Anything that writes the colour itself would sail past the checks above,
   because those read the shared rule. Every stylesheet in the tree is scanned,
   not a hand-kept list of two: a third form would otherwise arrive unmeasured,
   and so would a rule moved into a file nobody thought to add here.
   Anything that is not var(--danger) is rejected, not just hex — `red` and
   `rgb(255, 68, 68)` are the same regression spelled differently. */
const scssFiles = (dir) =>
  readdirSync(join(root, dir), { withFileTypes: true }).flatMap((entry) => {
    const rel = dir + '/' + entry.name;
    if (entry.isDirectory()) return scssFiles(rel);
    /* .css too: src/tailwind.css is a real stylesheet and is listed in
       angular.json before styles.scss, so a rule or a --danger override in it
       ships. Sass compiles plain CSS without complaint — but it does NOT
       resolve `@import "tailwindcss"`, so what is scanned is what literally
       stands in the file, not Tailwind's generated output. */
    return /[.](?:scss|css)$/.test(entry.name) ? [rel] : [];
  });

const sheets = scssFiles('src');
if (sheets.length < 2) {
  fail.push('the stylesheet scan found ' + sheets.length + ' file(s) under src/ — it is looking in the wrong place');
}
for (const rel of sheets) {
  if (rel === 'src/styles.scss') continue;
  for (const colour of errorRuleColours(rel)) {
    if (colour !== 'var(--danger)') {
      fail.push(rel + ' paints .error-msg with ' + colour + ' — use var(--danger) or leave it to styles.scss');
    }
  }
}

/* One declaration per theme, or the measurement above is meaningless: a second
   `body.light { --danger: … }` later in the file, or a `:host { --danger: … }`
   in a component, silently wins at runtime while this guard reads the first. */
const dangerDeclarations = [];
for (const rel of sheets) {
  const text = stripComments(read(rel));
  for (const m of text.matchAll(new RegExp('--danger[ ]*:[ ]*([^;}]+)', 'g'))) {
    dangerDeclarations.push({ rel, value: m[1].trim() });
  }
}
if (dangerDeclarations.length !== 2) {
  fail.push('--danger is declared ' + dangerDeclarations.length + ' time(s) ('
    + dangerDeclarations.map((d) => d.rel + ': ' + d.value).join('; ')
    + ') — expected exactly two, one per theme in styles.scss');
} else if (dangerDeclarations.some((d) => d.rel !== 'src/styles.scss')) {
  fail.push('--danger is declared outside styles.scss: '
    + dangerDeclarations.filter((d) => d.rel !== 'src/styles.scss').map((d) => d.rel).join(', '));
}

if (fail.length) {
  console.error('\n' + fail.length + ' contrast problem(s):');
  for (const f of fail) console.error('  - ' + f);
  process.exit(1);
}
console.log('\nAll checked colours reach 4.5:1 — the terminal in light mode, the error text in both.');
