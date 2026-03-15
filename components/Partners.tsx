"use client";

const partners = [
  "Stripe",
  "Vercel",
  "Cloudflare",
  "AWS",
  "Google Cloud",
  "Solana",
  "Ethereum",
  "Polygon",
  "Chainlink",
  "Binance",
];

export default function Partners() {
  return (
    <section className="py-10 bg-background border-y border-white/5 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8 text-center">
        <p className="text-sm font-medium text-gray-500 uppercase tracking-widest">
          Trusted by Innovative Teams & Institutions
        </p>
      </div>

      <div className="relative flex w-full overflow-hidden mask-gradient">
        {/* Gradient masks for fading edges */}
        <div className="absolute left-0 top-0 bottom-0 w-20 z-10 bg-gradient-to-r from-background to-transparent" />
        <div className="absolute right-0 top-0 bottom-0 w-20 z-10 bg-gradient-to-l from-background to-transparent" />

        <div className="flex w-max animate-scroll hover:[animation-play-state:paused]">
          {[...partners, ...partners].map((partner, index) => (
            <div
              key={index}
              className="inline-flex items-center justify-center mx-12 grayscale opacity-50 hover:grayscale-0 hover:opacity-100 transition-all duration-300 cursor-default"
            >
              <span className="text-2xl font-bold text-white/80">{partner}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
