"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, Home, RotateCcw } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { contactEmail } from "@/lib/site";

/**
 * Route-level error boundary. Shows a safe, human-readable message instead of a
 * raw stack trace, and gives the visitor a way to recover.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Report the failure to the console for debugging. The rendered UI never
    // exposes the underlying error detail to the visitor.
    console.error(error);
  }, [error]);

  return (
    <main id="main" className="min-h-screen bg-background text-white">
      <Navbar />

      <div className="mx-auto max-w-3xl px-4 pb-20 pt-32 text-center sm:px-6 lg:px-8">
        <span className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-red-500/15 text-red-400">
          <AlertTriangle className="h-8 w-8" aria-hidden="true" />
        </span>

        <p className="mt-6 text-sm font-semibold uppercase tracking-widest text-primary">
          Something went wrong
        </p>
        <h1 className="mt-4 text-4xl font-bold md:text-5xl">We hit an unexpected error</h1>
        <p className="mx-auto mt-6 max-w-xl text-gray-400">
          This page could not be loaded. It is usually temporary — try again, and if the problem
          persists email us so we can look into it.
        </p>

        {error.digest ? (
          <p className="mt-4 font-mono text-xs text-gray-500">Reference: {error.digest}</p>
        ) : null}

        <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <button
            type="button"
            onClick={reset}
            className="inline-flex w-full items-center justify-center rounded-full bg-primary px-8 py-3.5 text-base font-medium text-white transition-all duration-300 hover:bg-blue-600 sm:w-auto"
          >
            <RotateCcw className="mr-2 h-4 w-4" aria-hidden="true" />
            Try again
          </button>
          <Link
            href="/"
            className="inline-flex w-full items-center justify-center rounded-full border border-white/20 px-8 py-3.5 text-base font-medium text-gray-200 transition-colors duration-300 hover:border-white/40 hover:text-white sm:w-auto"
          >
            <Home className="mr-2 h-4 w-4" aria-hidden="true" />
            Back to home
          </Link>
        </div>

        <p className="mt-10 text-sm text-gray-500">
          {contactEmail ? (
            <>
              Still stuck? Email{" "}
              <a
                href={`mailto:${contactEmail}`}
                className="text-primary transition-colors hover:text-white"
              >
                {contactEmail}
              </a>
            </>
          ) : (
            <>
              Still stuck?{" "}
              <Link href="/contact" className="text-primary transition-colors hover:text-white">
                Send us a message
              </Link>{" "}
              and we will look into it.
            </>
          )}
        </p>
      </div>

      <Footer />
    </main>
  );
}
