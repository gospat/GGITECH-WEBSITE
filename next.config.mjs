/** @type {import('next').NextConfig} */

const isProduction = process.env.NODE_ENV === "production";

/**
 * Baseline security headers applied to every response.
 * The Content-Security-Policy is intentionally compatible with Next.js's
 * inline bootstrap scripts; `unsafe-inline` is required for script-src until
 * a nonce-based policy is issued from middleware.
 */
const securityHeaders = [
  { key: "X-DNS-Prefetch-Control", value: "on" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
  },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  ...(isProduction
    ? [
        {
          key: "Strict-Transport-Security",
          value: "max-age=63072000; includeSubDomains; preload",
        },
      ]
    : []),
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      // 'unsafe-inline' covers Next.js's inline bootstrap script; dropping it
      // needs a per-request nonce issued from middleware, which would force
      // every route to render dynamically and lose static prerendering.
      // 'unsafe-eval' is only needed by webpack's dev source maps, so it never
      // ships in a production bundle.
      `script-src 'self' 'unsafe-inline'${isProduction ? "" : " 'unsafe-eval'"}`,
      // framer-motion writes inline style attributes, so this has to stay.
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob:",
      "font-src 'self' data:",
      "connect-src 'self'",
      "worker-src 'self' blob:",
      "manifest-src 'self'",
      "form-action 'self'",
      "frame-ancestors 'self'",
      "base-uri 'self'",
      "object-src 'none'",
      // Only meaningful over TLS, and it would break local http development.
      ...(isProduction ? ["upgrade-insecure-requests"] : []),
    ].join("; "),
  },
];

const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,
  images: {
    formats: ["image/avif", "image/webp"],
    deviceSizes: [360, 480, 640, 750, 828, 1080, 1200, 1920, 2048],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
