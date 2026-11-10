"use client";

import Link from "next/link";
import Logo from "@/components/Logo";
import { services } from "@/lib/content/services";
import { footerCompanyNav, footerLegalNav, site, socialLinks } from "@/lib/site";

export default function Footer() {
  return (
    <footer className="border-t border-white/10 bg-background pb-8 pt-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-12 grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-12">
          <div className="sm:col-span-2">
            <Link href="/" aria-label={`${site.name} — home`} className="mb-4 block text-white">
              <Logo className="h-7 w-auto" />
            </Link>
            <p className="mb-6 max-w-sm text-gray-400">
              The technology division of {site.legalName}. We engineer secure platforms,
              institutional systems, and infrastructure for organisations that need to rely on them.
            </p>
            <a
              href={`mailto:${site.email}`}
              className="inline-flex items-center font-medium text-primary transition-colors hover:text-white"
            >
              {site.email}
            </a>
            <p className="mt-3 text-sm text-gray-500">{site.location}</p>

            {socialLinks.length > 0 ? (
              <ul className="mt-6 flex flex-wrap gap-4">
                {socialLinks.map((profile) => (
                  <li key={profile.href}>
                    <a
                      href={profile.href}
                      rel="noopener noreferrer"
                      target="_blank"
                      className="text-gray-400 transition-colors hover:text-white"
                    >
                      {profile.label}
                    </a>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>

          <nav aria-labelledby="footer-services-heading">
            <h2
              id="footer-services-heading"
              className="mb-5 text-sm font-semibold uppercase tracking-wider text-white"
            >
              Services
            </h2>
            <ul className="space-y-3">
              {services.map((service) => (
                <li key={service.slug}>
                  <Link
                    href={`/services#${service.slug}`}
                    className="text-sm text-gray-400 transition-colors hover:text-primary"
                  >
                    {service.title}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-labelledby="footer-company-heading">
            <h2
              id="footer-company-heading"
              className="mb-5 text-sm font-semibold uppercase tracking-wider text-white"
            >
              Company
            </h2>
            <ul className="space-y-3">
              {footerCompanyNav.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="text-sm text-gray-400 transition-colors hover:text-primary"
                  >
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div className="flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-8 text-sm text-gray-500 md:flex-row">
          <p suppressHydrationWarning>
            © {new Date().getFullYear()} {site.legalName}. All rights reserved.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-6">
            {footerLegalNav.map((item) => (
              <Link key={item.href} href={item.href} className="transition-colors hover:text-white">
                {item.name}
              </Link>
            ))}
            <button
              type="button"
              onClick={() => window.dispatchEvent(new Event("openCookieSettings"))}
              className="transition-colors hover:text-white"
            >
              Cookie Settings
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
