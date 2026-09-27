# Email-safe fonts

Fonts the letter can name in its `font-family` and expect readers to see,
without loading a font file. Apple Mail loads web fonts, so this list is really
for everyone else: Gmail (app and browser), Outlook, and Android mail apps.
Those can only draw fonts already installed on the reader's device.

A reader's device decides what they get:

- **iPhone** — Gmail on iPhone uses iOS's built-in fonts.
- **Mac** — Gmail in a browser on a Mac uses macOS fonts.
- **Windows** — Gmail in a browser, or Outlook, uses Windows fonts.
- **Android** — has almost no named fonts. It maps a few common names onto
  Roboto (sans), Noto Serif (serif) and Cutive Mono (mono), and everything
  else falls through to the next font in the stack.

Sources: Apple's system font list (developer.apple.com/fonts/system-fonts,
checked 2026-09-26, "system font" only, not "downloadable") and Android's
`data/fonts/fonts.xml` in AOSP. Windows is the standard set that ships with
Windows 10 and 11. Samsung phones can swap Roboto for their own sans.

## Safe nearly everywhere

On iPhone, Mac and Windows. Android shows its stand-in, which is close enough
that the letter still looks right.

| Font | Kind | Android shows |
|---|---|---|
| Arial | Sans | Roboto |
| Helvetica | Sans (Windows swaps in Arial) | Roboto |
| Verdana | Wide sans, very readable small | Roboto |
| Trebuchet MS | Humanist sans | Roboto |
| Georgia | Serif, the letter's body font today | Noto Serif |
| Times New Roman | Serif | Noto Serif |
| Palatino (Windows: Palatino Linotype) | Serif | Noto Serif |
| Courier New | Typewriter mono | Cutive Mono |

## Safe on three of four

| Font | Missing on | Notes |
|---|---|---|
| Impact | Android | Heavy condensed headline face. The best everywhere-ish headline font |
| Arial Black | iPhone | Heavy wide sans |
| Tahoma | iPhone | Narrow Verdana |
| Arial Narrow | iPhone, most Windows (it comes with Office, not Windows) | |

## Apple only (iPhone and Mac)

Worth putting first in a stack: Gmail on iPhone and Gmail on a Mac get them,
and everyone else falls through to the next font.

| Font | Kind | Good for |
|---|---|---|
| DIN Condensed | Bold condensed sans, bold only | Headlines |
| DIN Alternate | Bold sans, bold only | Headlines, labels |
| Avenir Next Condensed | Condensed sans, many weights | Headlines |
| Futura | Geometric sans, includes Condensed ExtraBold | Headlines |
| Avenir, Avenir Next | Geometric sans | Headlines or text |
| Helvetica Neue | Sans | Text |
| Gill Sans | Humanist sans | Headlines or text |
| Optima | Flared sans | Headlines |
| Rockwell | Slab serif | Headlines |
| Charter | Serif built for screens | Text |
| Baskerville, Hoefler Text, Cochin | Book serifs | Text |
| Didot, Bodoni 72 | High-contrast fashion serifs | Headlines |
| American Typewriter | Typewriter serif | Accents |
| Copperplate | Wide small caps | Accents |
| Menlo | Mono | Accents |
| Marker Felt, Noteworthy, Chalkboard SE | Handwriting | Avoid |

## Windows-only stand-ins

For the Windows part of a stack, after the Apple font and before the generic.

| Font | Stands in for |
|---|---|
| Bahnschrift | DIN (it has condensed widths) |
| Franklin Gothic Medium | Heavier grotesque headlines |
| Segoe UI, Calibri | Helvetica Neue, Avenir |
| Cambria, Constantia | Charter, Georgia |

## Stacks that hold together

Put the favourite first and the generic last. Each reader gets the first one
their device has.

- **Heavy condensed headlines:** `"DIN Condensed", Impact, Bahnschrift,
  "sans-serif-condensed", sans-serif`. `sans-serif-condensed` is Android's
  Roboto Condensed.
- **Geometric headlines:** `Futura, "Avenir Next", "Trebuchet MS", Arial,
  sans-serif`.
- **Serif text:** `Charter, Georgia, "Times New Roman", serif`.
- **Sans text:** `"Helvetica Neue", Helvetica, Arial, sans-serif`.

Today's headline stack (`src/design/tokens.ts`) is `Anton, "Arial Narrow",
"Helvetica Neue Condensed", Impact, sans-serif`. The iPhone has neither of the
two middle fonts, so Gmail on iPhone shows Impact. Android shows plain Roboto,
because the stack doesn't end in `sans-serif-condensed`.
