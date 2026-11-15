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
import { contactEmail } from "@/lib/site";

/**
 * The form could not send, so the visitor is told that plainly.
 *
 * When `NEXT_PUBLIC_CONTACT_EMAIL` is configured, the published address is
 * offered as the working alternative. When it is not — including when the
 * whole email configuration is missing, which is the common case for this
 * branch — no address is printed. Naming a mailbox that may not exist, in the
 * one message where the visitor has nowhere else to turn, is the failure this
 * guards against. The contact form is still reachable, so "try again" is a
 * real instruction rather than a dead end.
 */
function failureMessage(): string {
  return contactEmail
    ? `We could not send your message right now. Please email ${contactEmail} directly.`
    : "We could not send your message right now. Please try again shortly.";
}

/**
 * - `EmailConfigError` — the deployment is misconfigured. Not the visitor's
 *   problem and not something they can retry past, hence 503 rather than 500.
 * - `EmailDeliveryError` — the provider refused, timed out or was unreachable
 *   after the request was accepted: 502, and worth another attempt.
 * - anything else — an unexpected server fault, reported as a plain 500.
 *
 * Success is never signalled from here: this only runs when the primary
 * notification was not accepted by Resend.
 */
export function emailFailureResponse(error: unknown): NextResponse {
  const status =
    error instanceof EmailConfigError ? 503 : error instanceof EmailDeliveryError ? 502 : 500;

  return NextResponse.json({ ok: false, error: failureMessage() }, { status });
}
