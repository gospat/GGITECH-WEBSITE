import localFont from "next/font/local";

/**
 * Fonts are self-hosted (latin subset, variable weights) so builds are
 * deterministic and no third-party request is made to Google Fonts.
 *
 * They live in their own module because two components need them: the root
 * layout, and the global error boundary — which replaces the root layout and
 * would otherwise render without the brand typeface, because the CSS variables
 * below are declared on the layout's <html> element.
 */
export const sans = localFont({
  src: "./fonts/space-grotesk-latin.woff2",
  weight: "300 700",
  variable: "--font-sans",
  display: "swap",
  fallback: ["system-ui", "sans-serif"],
});

export const mono = localFont({
  src: "./fonts/jetbrains-mono-latin.woff2",
  weight: "100 800",
  variable: "--font-mono",
  display: "swap",
  fallback: ["ui-monospace", "monospace"],
});
