import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Home, Send } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { createMetadata, primaryNav } from "@/lib/site";

export const metadata: Metadata = createMetadata({
  title: "Page Not Found",
  description:
    "The page you requested could not be found. Browse GGI Tech's services, capabilities, and Technology Lab, or start a project brief.",
  path: "/404",
  noIndex: true,
});

export default function NotFound() {
  return (
    <main id="main" className="min-h-screen bg-background text-white">
      <Navbar />

      <div className="mx-auto max-w-3xl px-4 pt-32 pb-20 text-center sm:px-6 lg:px-8">
        <p className="text-sm font-semibold uppercase tracking-widest text-primary">Error 404</p>
        <h1 className="mt-4 text-4xl font-bold text-balance md:text-5xl">
          We could not find that page
        </h1>
        <p className="mx-auto mt-6 max-w-xl text-gray-400">
          The link may be broken, or the page may have been moved or renamed. Everything else is
          still where you left it.
        </p>

        <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/"
            className="inline-flex w-full items-center justify-center rounded-lg bg-primary px-8 py-3 text-base font-medium text-white transition-all duration-300 hover:bg-blue-600 sm:w-auto"
          >
            <Home className="mr-2 h-4 w-4" aria-hidden="true" />
            Back to home
          </Link>
          <Link
            href="/project-brief"
            className="inline-flex w-full items-center justify-center rounded-lg border border-white/15 px-8 py-3 text-base font-medium text-gray-200 transition-colors duration-300 hover:border-white/30 hover:text-white sm:w-auto"
          >
            <Send className="mr-2 h-4 w-4" aria-hidden="true" />
            Start a project
          </Link>
        </div>

        <nav aria-label="Site sections" className="mt-14 border-t border-white/10 pt-8">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500">
            Popular sections
          </h2>
          <ul className="mt-4 flex flex-wrap items-center justify-center gap-x-6 gap-y-3">
            {primaryNav.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="text-sm text-gray-300 transition-colors hover:text-primary"
                >
                  {item.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <p className="mt-10 inline-flex items-center text-sm text-gray-500">
          <ArrowLeft className="mr-2 h-4 w-4" aria-hidden="true" />
          Use your browser&rsquo;s back button to return to the previous page.
        </p>
      </div>

      <Footer />
    </main>
  );
}
