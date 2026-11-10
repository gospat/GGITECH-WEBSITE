import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";
import CookieConsent from "@/components/CookieConsent";
import PageTransition from "@/components/PageTransition";
import { absoluteUrl, defaultOgImage, site, siteUrl } from "@/lib/site";

/**
 * Fonts are self-hosted (latin subset, variable weights) so builds are
 * deterministic and no third-party request is made to Google Fonts.
 */
const sans = localFont({
  src: "./fonts/space-grotesk-latin.woff2",
  weight: "300 700",
  variable: "--font-sans",
  display: "swap",
  fallback: ["system-ui", "sans-serif"],
});

const mono = localFont({
  src: "./fonts/jetbrains-mono-latin.woff2",
  weight: "100 800",
  variable: "--font-mono",
  display: "swap",
  fallback: ["ui-monospace", "monospace"],
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: `${site.name} | ${site.tagline}`,
    template: `%s | ${site.name}`,
  },
  description: site.description,
  applicationName: site.name,
  keywords: [
    "GGI Tech",
    "GOSPAT Global Innovations",
    "software engineering",
    "institutional systems",
    "university portal development",
    "payment infrastructure",
    "cloud infrastructure",
    "blockchain development",
    "Lagos software company",
  ],
  authors: [{ name: site.legalName, url: siteUrl }],
  creator: site.legalName,
  publisher: site.legalName,
  category: "technology",
  alternates: {
    canonical: "/",
    types: {
      "application/rss+xml": "/blog/rss.xml",
    },
  },
  openGraph: {
    type: "website",
    siteName: site.name,
    title: `${site.name} | ${site.tagline}`,
    description: site.description,
    url: siteUrl,
    locale: site.locale,
    images: [
      {
        url: absoluteUrl(defaultOgImage),
        width: 1200,
        height: 900,
        alt: `${site.name} — ${site.tagline}`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${site.name} | ${site.tagline}`,
    description: site.description,
    images: [absoluteUrl(defaultOgImage)],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  formatDetection: {
    telephone: false,
    address: false,
    email: false,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0B0F1A",
  colorScheme: "dark",
};

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: site.name,
  legalName: site.legalName,
  url: siteUrl,
  logo: absoluteUrl("/brand/icon-512.png"),
  email: site.email,
  description: site.description,
  address: {
    "@type": "PostalAddress",
    addressLocality: "Lagos",
    addressCountry: "NG",
  },
  contactPoint: [
    {
      "@type": "ContactPoint",
      contactType: "sales",
      email: site.email,
      availableLanguage: ["en"],
    },
  ],
  knowsAbout: [
    "Software Engineering",
    "System Architecture",
    "Cloud Infrastructure",
    "Blockchain Infrastructure",
    "Institutional Systems",
    "Cybersecurity",
  ],
};

const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: site.name,
  url: siteUrl,
  inLanguage: "en",
  publisher: { "@type": "Organization", name: site.name },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${sans.variable} ${mono.variable}`}>
      <body className="bg-background font-sans text-text antialiased selection:bg-primary/30 selection:text-white">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-white"
        >
          Skip to content
        </a>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify([organizationJsonLd, websiteJsonLd]),
          }}
        />
        <PageTransition>{children}</PageTransition>
        <CookieConsent />
      </body>
    </html>
  );
}
