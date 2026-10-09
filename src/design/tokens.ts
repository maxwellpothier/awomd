/**
 * Brand tokens — the single source of truth for the design system.
 *
 * Web renderers reach these through the CSS custom properties in
 * `globals.css`; email renderers need literal values, because email HTML
 * carries inline styles and cannot use custom properties (Outlook ignores
 * them entirely, Gmail strips them).
 *
 * `globals.css` restates these values by hand. `npm run tokens:check` fails
 * the build if the two ever drift.
 */

/** Sampled from the logo: navy ground, hot orange stroke. */
export const color = {
  /** The page. Tinted rather than near-white so forced dark mode in Gmail
   *  and Outlook.com inverts it to something we can live with. */
  cream: "#fdfbf0",
  creamDeep: "#f3efdc",
  navy: "#0f131e",
  navySoft: "#1b2233",
  orange: "#f84004",
  orangeDeep: "#ac2b0e",
  ink: "#0f131e",
  inkMuted: "#4a5163",
  /** Links in the letter's prose: the browser's own default link blue. */
  link: "#0000ee",
} as const;

/**
 * Pill backgrounds: soft tints that all carry navy text. A pill's colour comes
 * from its text, so "rage" is the same colour in every issue. Email-only (the
 * site shows the email render), so they have no counterpart in globals.css.
 */
export const pillColors = [
  "#fbd5c0", // peach
  "#f6e49a", // butter
  "#c9e8cf", // mint
  "#cadff3", // sky
  "#e0d3f2", // lilac
  "#f6cbd7", // rose
] as const;

/**
 * Which of `pillColors` a pill gets: picked from its text, so it is the same
 * everywhere (the letter and its share images), then moved along one if it
 * would match the pill before it.
 */
export function pillTint(pill: string, previous: number): number {
  let hash = 0;
  for (const char of pill.toLowerCase()) {
    hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  }
  const index = hash % pillColors.length;
  return index === previous ? (index + 1) % pillColors.length : index;
}

/**
 * Installed fonts only, on the site as well as in email: Gmail and Outlook
 * ignore webfonts, so a loaded face would be a different letter for half the
 * readers. docs/email-safe-fonts.md has who has what.
 *
 * Headlines are Avenir Next Condensed, on every iPhone and Mac. Windows gets
 * Arial Narrow where Office installed it, Android gets Roboto Condensed, and
 * anything left gets Arial. All of them have a real heavy cut, so
 * `displayWeight` never gets drawn as a faked bold.
 *
 * Text is Georgia, everywhere but Android, which draws Noto Serif.
 */
export const font = {
  display: `"Avenir Next Condensed", "Arial Narrow", "sans-serif-condensed", Arial, sans-serif`,
  serif: `Georgia, "Times New Roman", serif`,
} as const;

/** Avenir Next Condensed Heavy. */
export const displayWeight = 800;

export type ColorToken = keyof typeof color;
