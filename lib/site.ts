import type { Metadata } from "next";
import { isEmail } from "@/lib/validation";

const configuredUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();

/**
 * Canonical production origin. Override with NEXT_PUBLIC_SITE_URL when the
 * site is served from a preview or staging domain.
 */
export const siteUrl = (
  configuredUrl && configuredUrl.length > 0 ? configuredUrl : "https://ggitech.dev"
).replace(/\/+$/, "");

/**
 * The address the website publishes and asks visitors to write to.
 *
 * Deliberately opt-in. An address with no mailbox behind it is worse than no
 * address at all: a `mailto:` link that opens a dead destination looks like a
 * working route, so the customer writes in and hears nothing back. Set
 * `NEXT_PUBLIC_CONTACT_EMAIL` only once a mailbox exists, is business-owned,
 * and has been confirmed to receive mail.
 *
 * A missing, blank or malformed value yields `null`, and every consumer
 * renders the contact form instead. Tightening a typo should not publish a
 * broken address, so an invalid value is treated as "not configured" rather
 * than passed through.
 *
 * This is a public address by definition. Private destinations — where
 * notifications are delivered and what the acknowledgement replies to — are
 * separate and stay server-side only (`CONTACT_NOTIFICATION_EMAIL`,
 * `CONTACT_REPLY_TO_EMAIL`).
 */
export const contactEmail: string | null = (() => {
  const configured = process.env.NEXT_PUBLIC_CONTACT_EMAIL?.trim();
  if (!configured) return null;
  return isEmail(configured) ? configured : null;
})();

export const site = {
  name: "GGI Tech",
  legalName: "GOSPAT Global Innovations Ltd",
  tagline: "Engineering Digital Infrastructure",
  url: siteUrl,
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
      images: [{ url: absoluteUrl(ogImage), width: 1920, height: 1080, alt: title }],
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description,
      images: [absoluteUrl(ogImage)],
    },
  };
}
