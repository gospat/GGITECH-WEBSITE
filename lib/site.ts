import type { Metadata } from "next";

const configuredUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();

/**
 * Canonical production origin. Override with NEXT_PUBLIC_SITE_URL when the
 * site is served from a preview or staging domain.
 */
export const siteUrl = (
  configuredUrl && configuredUrl.length > 0 ? configuredUrl : "https://ggitech.dev"
).replace(/\/+$/, "");

export const site = {
  name: "GGI Tech",
  legalName: "GOSPAT Global Innovations Ltd",
  tagline: "Engineering Digital Infrastructure",
  url: siteUrl,
  email: "contact@ggitech.dev",
  careersEmail: "careers@ggitech.dev",
  location: "Lagos, Nigeria",
  locale: "en_NG",
  description:
    "GGI Tech is the technology division of GOSPAT Global Innovations Ltd. We design and build secure, scalable platforms for institutions, businesses, and emerging technologies.",
} as const;

export const defaultOgImage = "/images/illustrations/services-hero.jpg";

/**
 * Verified social profiles only. Add entries once the official profile URLs
 * are confirmed — the footer renders nothing while this list is empty rather
 * than linking to placeholder destinations.
 */
export const socialLinks: ReadonlyArray<{ label: string; href: string }> = [];

export type NavItem = { name: string; href: string };

export const primaryNav: ReadonlyArray<NavItem> = [
  { name: "About", href: "/about" },
  { name: "Services", href: "/services" },
  { name: "Capabilities", href: "/projects" },
  { name: "Technology Lab", href: "/technology-lab" },
  { name: "Blog", href: "/blog" },
  { name: "Contact", href: "/contact" },
];

export const footerCompanyNav: ReadonlyArray<NavItem> = [
  { name: "About Us", href: "/about" },
  { name: "Capabilities", href: "/projects" },
  { name: "Technology Lab", href: "/technology-lab" },
  { name: "Careers", href: "/careers" },
  { name: "Blog", href: "/blog" },
  { name: "Contact", href: "/contact" },
];

export const footerLegalNav: ReadonlyArray<NavItem> = [
  { name: "Privacy Policy", href: "/privacy" },
  { name: "Terms of Service", href: "/terms" },
];

export function absoluteUrl(path = "/"): string {
  return `${siteUrl}${path.startsWith("/") ? path : `/${path}`}`;
}

type MetadataInput = {
  /** Short page title. The root layout template appends the brand name. */
  title: string;
  description: string;
  /** Route path beginning with "/". */
  path: string;
  image?: string;
  type?: "website" | "article";
  keywords?: string[];
  publishedTime?: string;
  noIndex?: boolean;
};

/**
 * Produces a complete, consistent metadata block (canonical URL, Open Graph and
 * Twitter cards) so individual pages never hand-roll SEO tags.
 */
export function createMetadata({
  title,
  description,
  path,
  image,
  type = "website",
  keywords,
  publishedTime,
  noIndex = false,
}: MetadataInput): Metadata {
  const url = absoluteUrl(path);
  const ogImage = image ?? defaultOgImage;
  const fullTitle = `${title} | ${site.name}`;

  return {
    title,
    description,
    keywords,
    alternates: { canonical: url },
    robots: noIndex ? { index: false, follow: false } : undefined,
    openGraph: {
      title: fullTitle,
      description,
      url,
      siteName: site.name,
      locale: site.locale,
      type,
      ...(publishedTime ? { publishedTime } : {}),
      images: [{ url: absoluteUrl(ogImage), width: 1200, height: 900, alt: title }],
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description,
      images: [absoluteUrl(ogImage)],
    },
  };
}
