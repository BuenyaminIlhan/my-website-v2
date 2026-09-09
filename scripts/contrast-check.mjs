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
 */
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

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

const COMMENT = new RegExp('[/][*][^]*?[*][/]', 'g');
const stripComments = (css) => css.replace(COMMENT, '');

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
  const block = styles.match(new RegExp('body[.]light[ ]*[{]([^}]*)[}]'));
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

if (fail.length) {
  console.error('\n' + fail.length + ' contrast problem(s):');
  for (const f of fail) console.error('  - ' + f);
  process.exit(1);
}
console.log('\nAll checked terminal colours reach 4.5:1 in light mode.');
