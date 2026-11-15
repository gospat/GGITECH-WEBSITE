/**
 * Outbound email service.
 *
 * Everything the website sends leaves through this module, over the Resend
 * HTTPS API. There is no SMTP transport: Resend is the only provider, and the
 * previous nodemailer configuration has been removed rather than kept as a
 * fallback, so there is exactly one code path to reason about.
 *
 * ## What "sent" means
 *
 * Resend answering with a message id means the provider has **accepted** the
 * message for delivery. It is not a confirmed delivery: the receiving mailbox
 * may still bounce, defer, or file it as spam. Nothing here reports delivery,
 * and no part of the site claims otherwise. Confirmed delivery would need a
 * Resend webhook and somewhere durable to record the event, which this
 * deployment does not have.
 *
 * ## Ordering
 *
 * The internal notification is attempted first and its failure is fatal — a
 * visitor is never told their enquiry was received when the team's copy was
 * rejected. The acknowledgement is attempted only after that succeeds, and its
 * failure is swallowed and logged, because the enquiry itself has already been
 * delivered by that point.
 */

import { render } from "@react-email/render";
import { createElement } from "react";
import type { ReactElement } from "react";
import { Resend } from "resend";

import {
  ACKNOWLEDGEMENT_SUBJECT,
  EnquiryAcknowledgement,
  EnquiryNotification,
  enquiryNotificationSubject,
} from "@/components/email";
import { getEmailEnv, type EmailEnv } from "@/lib/server/email/config";
import { EmailConfigError, EmailDeliveryError } from "@/lib/server/email/errors";
import type { EnquiryEmailData } from "@/lib/server/email/enquiry";
import { logEmailEvent } from "@/lib/server/email/log";
import { createRequestNonce } from "@/lib/server/email/reference";

/** Mirrors the subset of Resend's `Attachment` this application actually uses. */
export type EmailAttachment = {
  filename: string;
  content: Uint8Array;
  contentType?: string;
};

export type EnquiryDelivery = {
  reference: string;
  /** Resend's id for the internal notification, for log correlation. */
  notificationMessageId: string;
  /** `failed` is logged and tolerated: the enquiry itself was already delivered. */
  acknowledgement: "sent" | "skipped" | "failed";
};

export type EnquirySubmission = {
  enquiry: EnquiryEmailData;
  /** The project brief PDF, when the submitting form produces one. */
  attachments?: EmailAttachment[];
};

type SendOutcome = { messageId: string; durationMs: number };

type OutgoingMessage = {
  to: string;
  replyTo: string;
  subject: string;
  html: string;
  text: string;
  attachments?: EmailAttachment[];
};

/**
 * Short, non-sensitive label for the log. Never a provider response body — a
 * provider message can quote the request it rejected, which would put customer
 * data in a log sink.
 */
function describeFailure(error: unknown): string {
  // A config message names the missing variable and never carries its value.
  if (error instanceof EmailConfigError) return `config:${error.message}`;
  if (error instanceof EmailDeliveryError) return error.providerCode ?? "delivery_failed";
  // `error.name` for a plain `Error` is just "Error", which says nothing.
  if (error instanceof Error && error.name !== "Error") return error.name;
  return "unexpected_error";
}

/**
 * React Email escapes all text it renders, so the customer's message, name and
 * project brief reach the template as text nodes and arrive as literal
 * characters. `pretty: false` skips the optional Prettier pass, which keeps the
 * render dependency-free and the output free of whitespace-only nodes that some
 * clients collapse differently.
 */
async function renderBoth(element: ReactElement): Promise<{ html: string; text: string }> {
  const [html, text] = await Promise.all([
    render(element, { pretty: false }),
    render(element, { pretty: false, plainText: true }),
  ]);
  return { html, text };
}

/**
 * One provider call. Any outcome other than an accepted message is normalised
 * into `EmailDeliveryError` so callers never have to inspect a Resend-shaped
 * response, and so provider text cannot leak into a visitor-facing string.
 */
async function sendMessage(
  client: Resend,
  env: EmailEnv,
  message: OutgoingMessage
): Promise<SendOutcome> {
  const started = Date.now();

  let result: Awaited<ReturnType<Resend["emails"]["send"]>>;
  try {
    result = await client.emails.send(
      {
        from: env.from,
        to: message.to,
        replyTo: message.replyTo,
        subject: message.subject,
        html: message.html,
        text: message.text,
        ...(message.attachments ? { attachments: message.attachments } : {}),
      },
      {
        // A double submit that slipped past the button guard would otherwise
        // produce two provider calls; Resend collapses them into one message.
        idempotencyKey: createRequestNonce(),
        // Resend's request options expose no timeout of their own, so the
        // deadline is enforced on the fetch signal.
        signal: AbortSignal.timeout(env.requestTimeoutMs),
      }
    );
  } catch (cause) {
    const timedOut =
      cause instanceof Error && (cause.name === "TimeoutError" || cause.name === "AbortError");

    throw new EmailDeliveryError(
      timedOut
        ? "The email provider did not respond in time."
        : "The email provider could not be reached.",
      { providerCode: timedOut ? "timeout" : "network_error", cause }
    );
  }

  if (result.error) {
    throw new EmailDeliveryError("The email provider rejected the message.", {
      providerCode: result.error.name,
    });
  }

  return { messageId: result.data.id, durationMs: Date.now() - started };
}

/**
 * Sends the internal notification, then the optional customer acknowledgement.
 *
 * Throws `EmailConfigError` when the deployment is not configured and
 * `EmailDeliveryError` when the internal notification was not accepted. Both
 * are the caller's cue to answer the visitor with a failure, never with a
 * success.
 */
export async function sendEnquiryEmails(input: EnquirySubmission): Promise<EnquiryDelivery> {
  const { enquiry, attachments } = input;
  const form = enquiry.formKind;

  let env: EmailEnv;
  let client: Resend;
  let outcome: SendOutcome;

  try {
    // Read first: a misconfigured deployment must fail before any rendering or
    // provider work happens. The catch below always throws, so `env` and
    // `client` are definitely assigned by the time the acknowledgement runs.
    env = getEmailEnv();
    client = new Resend(env.apiKey);

    const body = await renderBoth(createElement(EnquiryNotification, { enquiry }));

    outcome = await sendMessage(client, env, {
      to: env.notificationEmail,
      // The customer's own address, so the team replies from their normal mail
      // client without copying and pasting.
      replyTo: enquiry.customerEmail,
      subject: enquiryNotificationSubject(enquiry),
      html: body.html,
      text: body.text,
      ...(attachments ? { attachments } : {}),
    });
  } catch (error) {
    logEmailEvent({
      level: "error",
      event: "enquiry.notification_failed",
      form,
      reference: enquiry.reference,
      reason: describeFailure(error),
    });
    throw error;
  }

  logEmailEvent({
    level: "info",
    event: "enquiry.notification_accepted",
    form,
    reference: enquiry.reference,
    providerMessageId: outcome.messageId,
    durationMs: outcome.durationMs,
  });

  let acknowledgement: EnquiryDelivery["acknowledgement"] = "skipped";

  if (!env.autoReplyEnabled) {
    logEmailEvent({
      level: "info",
      event: "enquiry.acknowledgement_skipped",
      form,
      reference: enquiry.reference,
      reason: "CONTACT_AUTO_REPLY_ENABLED is false",
    });
  } else {
    try {
      const body = await renderBoth(createElement(EnquiryAcknowledgement, { enquiry }));

      const sent = await sendMessage(client, env, {
        to: enquiry.customerEmail,
        // Points at the monitored internal mailbox, not at the customer, so a
        // reply to the acknowledgement reaches the team.
        replyTo: env.replyToEmail,
        subject: ACKNOWLEDGEMENT_SUBJECT,
        html: body.html,
        text: body.text,
      });

      acknowledgement = "sent";
      logEmailEvent({
        level: "info",
        event: "enquiry.acknowledgement_accepted",
        form,
        reference: enquiry.reference,
        providerMessageId: sent.messageId,
        durationMs: sent.durationMs,
      });
    } catch (error) {
      acknowledgement = "failed";
      logEmailEvent({
        level: "error",
        event: "enquiry.acknowledgement_failed",
        form,
        reference: enquiry.reference,
        reason: describeFailure(error),
      });
    }
  }

  return {
    reference: enquiry.reference,
    notificationMessageId: outcome.messageId,
    acknowledgement,
  };
}
