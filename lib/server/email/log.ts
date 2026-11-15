/**
 * Structured operational logging for the email layer.
 *
 * Every line is a single JSON object, matching `instrumentation.ts`, so log
 * drains index it without extra parsing.
 *
 * Deliberately absent: the API key, message bodies, and the customer's email
 * address. Enquiries are correlated by their reference number instead, which is
 * enough to trace a submission without copying personal data into a log sink.
 */

import type { EnquiryFormKind } from "@/lib/server/email/enquiry";

export type EmailLogEventName =
  | "enquiry.notification_accepted"
  | "enquiry.notification_failed"
  | "enquiry.acknowledgement_accepted"
  | "enquiry.acknowledgement_skipped"
  | "enquiry.acknowledgement_failed";

export type EmailLogEvent = {
  level: "info" | "error";
  event: EmailLogEventName;
  form: EnquiryFormKind;
  reference: string;
  /** Resend's message id, present once the provider has accepted a message. */
  providerMessageId?: string;
  /** Short, non-sensitive explanation. Never a full provider response. */
  reason?: string;
  durationMs?: number;
};

export function logEmailEvent(event: EmailLogEvent): void {
  const line = JSON.stringify({
    source: "email",
    timestamp: new Date().toISOString(),
    ...event,
  });

  if (event.level === "error") console.error(line);
  else console.info(line);
}
