"use client";

import { useEffect } from "react";
import "./globals.css";
import { mono, sans } from "./fonts";

/**
 * Last-resort boundary. This replaces the root layout, so it has to render its
 * own <html>/<body>, import the global stylesheet, and re-apply the font
 * variables — they are declared on the layout's <html>, which does not exist
 * here, and an undefined `--font-sans` would otherwise invalidate the whole
 * `font-family` declaration and drop the page back to the browser serif.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="en" className={`${sans.variable} ${mono.variable}`}>
      <body className="bg-background font-sans text-text antialiased">
        <title>Something went wrong | GGI Tech</title>
        <main className="flex min-h-screen flex-col items-center justify-center px-4 text-center sm:px-6">
          <p className="text-sm font-semibold uppercase tracking-widest text-primary">
            Application error
          </p>
          <h1 className="mt-4 text-4xl font-bold text-white md:text-5xl">Something went wrong</h1>
          <p className="mt-6 max-w-xl text-gray-300">
            The application failed to load. Please try again — if it keeps happening, get in touch
            and we will take a look.
          </p>

          {error.digest ? (
            <p className="mt-4 font-mono text-xs text-gray-500">Reference: {error.digest}</p>
          ) : null}

          <button
            type="button"
            onClick={reset}
            className="mt-10 inline-flex items-center justify-center rounded-full bg-primary px-8 py-3.5 text-base font-medium text-white transition-all duration-300 hover:bg-blue-600"
          >
            Try again
          </button>
        </main>
      </body>
    </html>
  );
}
