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
} as const;

/**
 * Email cannot load webfonts reliably, so every stack degrades to something
 * deliberate. The display face is condensed and heavy; its fallbacks are
 * chosen to stay condensed rather than collapse to Helvetica.
 */
export const font = {
  display: `Anton, "Arial Narrow", "Helvetica Neue Condensed", Impact, sans-serif`,
  serif: `"Source Serif 4", Georgia, "Times New Roman", serif`,
} as const;

export type ColorToken = keyof typeof color;
