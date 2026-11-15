/**
 * Design tokens for GGITECH transactional email.
 *
 * These mirror the website palette but are declared independently: email
 * clients strip external stylesheets, so every value has to be inlined, and a
 * token that no longer exists on the site would silently break an email rather
 * than a page. Keep them in step with `tailwind.config.ts`.
 *
 * Contrast notes (WCAG AA, normal text):
 * - `link` on `paper` is 7.0:1, so body links are safe to read.
 * - `button` with a white label is 5.2:1.
 * - `textMuted` on `paper` is 6.3:1.
 * `primary` is kept for headings and rules only; at 3.6:1 on white it is too
 * light to carry body-sized text.
 */

export const emailBrand = {
  page: "#F1F4F9",
  ink: "#0B0F1A",
  inkLine: "#25304A",
  primary: "#3B82F6",
  accent: "#22C55E",
  paper: "#FFFFFF",
  surface: "#F6F8FC",
  border: "#E2E8F2",
  rule: "#E6EBF3",
  text: "#111827",
  textMuted: "#57616F",
  textOnInk: "#FFFFFF",
  textOnInkMuted: "#A9B4C7",
  link: "#1D4ED8",
  button: "#2563EB",
} as const;

/**
 * System stack. Email clients cannot be relied on to fetch a webfont, and the
 * site's Space Grotesk is served through `next/font/local` with no public URL,
 * so the emails use the closest thing every client already has.
 */
export const emailFont =
  "-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif";

/** Reserved for the enquiry reference so it reads as a system value, not prose. */
export const emailFontMono = "'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace";

export const emailRadius = "10px";

/** Class names shared by the components below and the responsive stylesheet. */
export const emailClass = {
  shell: "ggitech-shell",
  header: "ggitech-header",
  card: "ggitech-card",
  footer: "ggitech-footer",
  title: "ggitech-title",
  heading: "ggitech-heading",
  label: "ggitech-label",
} as const;

/**
 * Progressive enhancement only. Every element already carries inline styles, so
 * a client that drops this block still renders a complete, readable email. The
 * rules exist to stop dark-mode clients inverting the white content area and to
 * tighten the padding on narrow screens.
 *
 * Order matters in the dark-mode block: the blanket colour rule is declared
 * first so the more specific heading, label and link rules win.
 */
export const emailBaseCss = `
  body { margin: 0; padding: 0; width: 100% !important; }
  table { border-collapse: collapse; }
  img { border: 0; outline: none; text-decoration: none; }
  a { text-decoration: none; }

  @media (prefers-color-scheme: dark) {
    .${emailClass.shell} { background-color: ${emailBrand.page} !important; }
    .${emailClass.card} { background-color: ${emailBrand.paper} !important; }
    .${emailClass.card}, .${emailClass.card} * { color: ${emailBrand.text} !important; }
    .${emailClass.card} .${emailClass.heading} { color: ${emailBrand.primary} !important; }
    .${emailClass.card} .${emailClass.label} { color: ${emailBrand.textMuted} !important; }
    .${emailClass.card} a { color: ${emailBrand.link} !important; }
  }

  @media only screen and (max-width: 480px) {
    .${emailClass.header},
    .${emailClass.card},
    .${emailClass.footer} {
      padding-left: 18px !important;
      padding-right: 18px !important;
    }
    .${emailClass.title} { font-size: 19px !important; }
  }
`.trim();
