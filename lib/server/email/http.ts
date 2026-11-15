/**
 * Maps email-layer failures onto responses that are safe to show a visitor.
 *
 * Both enquiry endpoints share this so their behaviour cannot drift, and so
 * neither can accidentally echo a provider message, a status code, a stack
 * trace or the notification address back to the browser. The reason a send
 * failed is already in the structured log the service emits.
 */

import { NextResponse } from "next/server";
import { EmailConfigError, EmailDeliveryError } from "@/lib/server/email/errors";
import { site } from "@/lib/site";

/**
 * The form cannot send, so the visitor is pointed at the published contact
 * address — the one route that still works.
 */
const FAILURE_MESSAGE = `We could not send your message right now. Please email ${site.email} directly.`;

/**
 * - `EmailConfigError` — the deployment is misconfigured. Not the visitor's
 *   problem and not something they can retry past, hence 503 rather than 500.
 * - `EmailDeliveryError` — the provider refused, timed out or was unreachable
 *   after the request was accepted: 502, and worth another attempt.
 * - anything else — an unexpected server fault, reported as a plain 500.
 */
export function emailFailureResponse(error: unknown): NextResponse {
  const status =
    error instanceof EmailConfigError ? 503 : error instanceof EmailDeliveryError ? 502 : 500;

  return NextResponse.json({ ok: false, error: FAILURE_MESSAGE }, { status });
}
