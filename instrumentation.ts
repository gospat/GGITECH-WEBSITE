import type { Instrumentation } from "next";

/**
 * Server-side error reporting. Next.js invokes this for every uncaught error in
 * a Server Component render, Route Handler or Server Action, so a failure is
 * always recorded here rather than reaching the visitor only as an opaque
 * digest.
 *
 * Each error is written to stderr as a single JSON object, which is the format
 * log drains (Vercel, Datadog, CloudWatch, Loki) index without extra parsing.
 * Request headers are deliberately not included — they carry cookies and
 * Authorization values that must not end up in a log aggregator.
 *
 * To forward these to Sentry instead, add `@sentry/nextjs`, call
 * `Sentry.init(...)` from a `register()` export, and replace the body below
 * with `Sentry.captureRequestError(error, request, context)`.
 */
export const onRequestError: Instrumentation.onRequestError = (error, request, context) => {
  const digest =
    typeof error === "object" && error !== null && "digest" in error
      ? String((error as { digest?: unknown }).digest)
      : undefined;

  console.error(
    JSON.stringify({
      level: "error",
      source: "server",
      timestamp: new Date().toISOString(),
      message: error instanceof Error ? error.message : String(error),
      digest,
      stack: error instanceof Error ? error.stack : undefined,
      path: request.path,
      method: request.method,
      routePath: context.routePath,
      routeType: context.routeType,
      routerKind: context.routerKind,
      revalidateReason: context.revalidateReason ?? null,
    })
  );
};
