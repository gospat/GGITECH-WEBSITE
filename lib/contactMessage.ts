import { asString, clampText, isEmail, isRecord, isSafeHeaderValue } from "@/lib/validation";

export type ContactMessage = {
  name: string;
  email: string;
  company: string;
  message: string;
};

export type ContactValidation =
  { ok: true; data: ContactMessage } | { ok: false; errors: string[] };

export const MIN_MESSAGE_LENGTH = 10;

export function validateContactMessage(payload: unknown): ContactValidation {
  if (!isRecord(payload)) return { ok: false, errors: ["Invalid payload."] };

  const errors: string[] = [];

  const name = clampText(asString(payload.name), 120);
  const email = clampText(asString(payload.email).toLowerCase(), 254);
  const company = clampText(asString(payload.company), 160);
  const message = clampText(asString(payload.message), 4000);

  if (!name) errors.push("Name is required.");
  if (!isEmail(email)) errors.push("A valid email is required.");
  if (message.length < MIN_MESSAGE_LENGTH) {
    errors.push(`Please provide a message of at least ${MIN_MESSAGE_LENGTH} characters.`);
  }
  if (!isSafeHeaderValue(name) || !isSafeHeaderValue(company)) {
    errors.push("Invalid characters detected in the submitted fields.");
  }

  if (errors.length > 0) return { ok: false, errors };

  return { ok: true, data: { name, email, company, message } };
}
