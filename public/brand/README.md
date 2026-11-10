# GGITECH brand assets

## Adopted identity — Iso Cube

Concept 07, *Iso Cube*, is the official GGI Tech identity. The production
files live at the root of this directory:

- `logo-primary.svg` — full lockup, white "GGI", for dark backgrounds
- `logo-inverse.svg` — full lockup, ink "GGI", for light backgrounds
- `logo-mono.svg` — wordmark only, single colour (`currentColor`), for print
- `mark.svg` — the Iso Cube mark on its own, square
- `icon.svg` — the mark on an opaque brand plate, square, for icons and avatars
- `icon-192.png`, `icon-512.png` — PWA icons, referenced by `app/manifest.ts`
- `icon-1024.png` — social avatar export

The navbar and footer render the lockup from `components/Logo.tsx`, which
inlines the same geometry so it stays crisp at any size and costs no extra
request. The browser tab icon, PWA icons, apple touch icon and the
`Organization` JSON-LD logo all resolve to files in this directory.

Naming is two words — **GGI Tech** — and the mark is inked in the site's
existing primary blue (`#3B82F6`) with the `#22C55E` accent, so nothing else
in the interface had to shift.

## Concept archive

The remaining directories hold the ten concepts that were presented for
selection, five variants each. They are retained as a record of the process
and are not referenced by the application.

Per concept directory:

- `primary.svg` — full lockup, white wordmark, for dark backgrounds
- `inverse.svg` — full lockup, ink wordmark, for light backgrounds
- `mono.svg` — wordmark only, single colour (`currentColor`), for print
- `mark.svg` — brand mark only, square, colour
- `social.svg` — brand mark on an opaque brand plate, square, for avatars
- `social-512.png`, `social-1024.png` — raster exports of `social.svg`

`concepts.json` holds the concept names, palettes and design rationale.

All wordmarks are drawn as vector paths from a custom monoline alphabet, so the
files carry no font dependency and are safe for print, embossing and extrusion.

See `ggitech-logo-concepts.html` in the workspace root for previews and notes.
