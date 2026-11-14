/**
 * Route-level loading state. Next.js renders this while a server component
 * segment is being fetched, so a slow navigation shows structure instead of a
 * blank screen.
 */
export default function Loading() {
  return (
    <main id="main" className="min-h-screen bg-background text-white">
      <div
        role="status"
        aria-live="polite"
        className="mx-auto max-w-7xl px-4 pb-20 pt-32 sm:px-6 lg:px-8"
      >
        <span className="sr-only">Loading page content</span>

        <div aria-hidden="true" className="animate-pulse">
          <div className="h-6 w-32 rounded-full bg-white/10" />
          <div className="mt-6 h-12 w-3/4 max-w-2xl rounded-2xl bg-white/10" />
          <div className="mt-4 h-12 w-1/2 max-w-xl rounded-2xl bg-white/10" />

          <div className="mt-10 space-y-3">
            <div className="h-4 w-full max-w-3xl rounded-full bg-white/5" />
            <div className="h-4 w-full max-w-2xl rounded-full bg-white/5" />
            <div className="h-4 w-2/3 max-w-xl rounded-full bg-white/5" />
          </div>

          <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="h-40 rounded-2xl border border-white/10 bg-white/5" />
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
