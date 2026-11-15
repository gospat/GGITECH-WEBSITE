/**
 * Server-only configuration for outbound email.
 *
 * Nothing here is read while the application builds. Production values live in
 * `/var/www/ggitech/shared/.env.production` and systemd injects them through
 * `EnvironmentFile=` at runtime, so a build — including CI — never needs real
 * email credentials.
 *
 * Parsing is deliberately lazy. `getEmailEnv()` throws only at the moment an
 * enquiry is submitted, which means an incomplete configuration cannot stop the
 * site or its health check from serving, and a misconfigured deployment fails
 * closed with an explicit server-side error instead of sending nothing.
 */

import { isEmail, isSafeHeaderValue } from "@/lib/validation";
import { EmailConfigError } from "@/lib/server/email/errors";

export type EmailEnv = {
  /** Resend API key. Server-only; must never reach the browser bundle. */
  apiKey: string;
  /** Verified sender identity, e.g. `GGITECH <notifications@ggitech.dev>`. */
  from: string;
  /** Internal destination for enquiry notifications. Never taken from a form. */
  notificationEmail: string;
  /** Reply-To on outbound acknowledgements. */
  replyToEmail: string;
  /** Whether a customer acknowledgement is attempted after a successful send. */
  autoReplyEnabled: boolean;
  /** Hard ceiling on a single Resend request so a route cannot hang. */
  requestTimeoutMs: number;
};

/** A hung provider call must not hold a visitor's request open indefinitely. */
export const EMAIL_REQUEST_TIMEOUT_MS = 10_000;

function read(name: string): string | undefined {
  const value = process.env[name];
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function required(name: string): string {
  const value = read(name);
  if (!value) throw new EmailConfigError(`Missing required environment variable: ${name}`);
  return value;
}

function readBoolean(name: string, fallback: boolean): boolean {
  const value = read(name)?.toLowerCase();
  if (value === undefined) return fallback;
  if (["true", "1", "yes", "on"].includes(value)) return true;
  if (["false", "0", "no", "off"].includes(value)) return false;
  throw new EmailConfigError(`Environment variable ${name} must be "true" or "false".`);
}

/** `RESEND_FROM_EMAIL` accepts a bare address or the `Display Name <address>` form. */
function senderAddress(value: string): string {
  const angled = /<([^>]*)>/.exec(value);
  return (angled ? angled[1] : value).trim();
}

function assertHeaderSafe(name: string, value: string): void {
  if (!isSafeHeaderValue(value)) {
    throw new EmailConfigError(`Environment variable ${name} must not contain line breaks.`);
  }
}

export function getEmailEnv(): EmailEnv {
  const from = required("RESEND_FROM_EMAIL");
  const notificationEmail = required("CONTACT_NOTIFICATION_EMAIL");
  const replyToEmail = read("CONTACT_REPLY_TO_EMAIL") ?? notificationEmail;

  for (const [name, value] of [
    ["RESEND_FROM_EMAIL", from],
    ["CONTACT_NOTIFICATION_EMAIL", notificationEmail],
    ["CONTACT_REPLY_TO_EMAIL", replyToEmail],
  ] as const) {
    assertHeaderSafe(name, value);
  }

  if (!isEmail(senderAddress(from))) {
    throw new EmailConfigError("RESEND_FROM_EMAIL must contain a valid email address.");
  }
  if (!isEmail(notificationEmail)) {
    throw new EmailConfigError("CONTACT_NOTIFICATION_EMAIL must be a valid email address.");
  }
  if (!isEmail(replyToEmail)) {
    throw new EmailConfigError("CONTACT_REPLY_TO_EMAIL must be a valid email address.");
  }

  return {
    apiKey: required("RESEND_API_KEY"),
    from,
    notificationEmail,
    replyToEmail,
    autoReplyEnabled: readBoolean("CONTACT_AUTO_REPLY_ENABLED", true),
    requestTimeoutMs: EMAIL_REQUEST_TIMEOUT_MS,
  };
}
