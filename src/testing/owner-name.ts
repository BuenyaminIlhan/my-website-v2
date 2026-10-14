/**
 * Whether a text names the site owner. The ONE rule behind the decision of 2026-10-14
 * that his personal name stays out of what Google and link previews show: the specs
 * import it, and so does scripts/head-check.mjs, the guard on the deploy path (Node 22.18+
 * strips the type annotations on import — keep this file free of non-erasable syntax
 * such as enums or namespaces).
 *
 * The name comes back in more spellings than one, so the text is reduced first:
 * - HTML entities, numeric, accented letters (&uuml;, &Idot; ...), format characters
 *   (&shy;, &lrm;, &zwnj; ...) and the dotless i, with or without the closing
 *   semicolon (B&uuml;nyamin, B&#xFC;nyamin, B&#xFCnyamin — browsers render all);
 * - percent-escapes, decoded per byte run so one broken byte cannot hide the rest;
 * - every format character (soft hyphen, zero-width, direction marks) removed;
 * - decomposed and stripped of every combining mark, so ü, u + U+0308, İ and any
 *   other diacritic fold to plain letters; the dotless ı is mapped to i.
 * What is left is matched against "bunyamin", "buenyamin" and "ilhan", in any case.
 * The domain ilhan-buenyamin.com is in every URL and is cut out first.
 */
const NAME = /b(?:ue|u)nyamin|ilhan/i;
const DOMAIN = /ilhan-buenyamin\.com/gi;
const NUMERIC_ENTITY = /&#(x[0-9a-f]+|\d+);?/gi;
/** &uacute;, &Uuml;, &ccedil; ... — any accented letter folds to its base letter. */
const ACCENT_ENTITY = /&([a-zA-Z])(uml|acute|grave|circ|tilde|caron|cedil|dot|ring);?/g;
const NAMED_ENTITY = /&(shy|lrm|rlm|zwj|zwnj|ZeroWidthSpace|imath|inodot);?/g;
const NAMED: Record<string, string> = { shy: '', lrm: '', rlm: '', zwj: '', zwnj: '', ZeroWidthSpace: '', imath: 'i', inodot: 'i' };
const PERCENT_RUN = /(?:%[0-9A-Fa-f]{2})+/g;
const FORMAT_CHARS = /\p{Cf}/gu;
const COMBINING_MARKS = /\p{M}/gu;

const fromCodePoint = (match: string, digits: string): string => {
  const point = digits[0].toLowerCase() === 'x' ? parseInt(digits.slice(1), 16) : parseInt(digits, 10);
  return point <= 0x10ffff ? String.fromCodePoint(point) : match;
};

/** Invalid bytes become U+FFFD instead of leaving the whole run undecoded. */
const decodePercentRun = (run: string): string => {
  const bytes = new Uint8Array(run.length / 3);
  for (let i = 0; i < bytes.length; i++) bytes[i] = parseInt(run.slice(i * 3 + 1, i * 3 + 3), 16);
  return new TextDecoder().decode(bytes);
};

export function namesOwner(text: string): boolean {
  const plain = text
    .replace(NUMERIC_ENTITY, fromCodePoint)
    .replace(ACCENT_ENTITY, (_, letter: string) => letter)
    .replace(NAMED_ENTITY, (_, name: string) => NAMED[name])
    .replace(PERCENT_RUN, decodePercentRun)
    .replace(FORMAT_CHARS, '')
    .normalize('NFD')
    .replace(COMBINING_MARKS, '')
    .replace(/\u0131/g, 'i')
    .replace(DOMAIN, '');
  return NAME.test(plain);
}
