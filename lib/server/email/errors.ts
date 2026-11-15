/**
 * Failures the email layer distinguishes so route handlers can answer with an
 * appropriate status code and a message that is safe to show a visitor.
 *
 * `EmailConfigError` is a server-side misconfiguration: it is the operator's
 * problem, never the visitor's, so it maps to 5xx and is never echoed back.
 * `EmailDeliveryError` is the provider refusing or timing out.
 */

export class EmailConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "EmailConfigError";
  }
}

export class EmailDeliveryError extends Error {
  /** Provider-reported code, kept for the server log only. */
  readonly providerCode?: string;

  constructor(message: string, options?: { providerCode?: string; cause?: unknown }) {
    super(message);
    this.name = "EmailDeliveryError";
    this.providerCode = options?.providerCode;
    if (options?.cause !== undefined) this.cause = options.cause;
  }
}
