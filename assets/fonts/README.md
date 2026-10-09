# Fonts for generated images

The share images (`src/images/`) are drawn on the server, which has neither
of the letter's installed fonts: Avenir Next Condensed is Apple's, and
Georgia is Microsoft's. So they use the closest open faces:

- **Roboto Condensed ExtraBold** for headlines. It is what Android already
  draws for the letter's headline stack (`docs/email-safe-fonts.md`).
- **Gelasio** for text. It was drawn to match Georgia's metrics.

Both are under the SIL Open Font License (the `-OFL.txt` files here), from the
Fontsource packages, Latin subset only, as `.woff` because the image renderer
can't read `.woff2`.
