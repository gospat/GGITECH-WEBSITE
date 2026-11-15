/**
 * Text helpers shared by the enquiry builders and the templates.
 *
 * Everything here returns plain strings. React Email escapes text it renders,
 * so the job of this module is not to sanitise HTML — it is to normalise the
 * shape of submitted values (collapse header-breaking whitespace, keep excerpts
 * short) so the templates and the subject lines stay simple.
 */

/**
 * Collapses newlines and tabs to single spaces.
 *
 * Two uses: values that end up in a mail header, where a CRLF would be a header
 * injection, and single-row summary values that must not break the layout.
 */
export function singleLine(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

/** Shortens a value for a summary row without cutting mid-word where possible. */
export function excerpt(value: string, maxLength = 280): string {
  const flat = singleLine(value);
  if (flat.length <= maxLength) return flat;

  const clipped = flat.slice(0, maxLength);
  const lastSpace = clipped.lastIndexOf(" ");
  const head = lastSpace > maxLength * 0.5 ? clipped.slice(0, lastSpace) : clipped;
  return `${head.trimEnd()}…`;
}

export function yesNo(value: boolean): string {
  return value ? "Yes" : "No";
}

/** Joins the labels of the options a customer selected, e.g. `Payments, Blog`. */
export function listOrNone(values: string[]): string {
  const cleaned = values.map((value) => value.trim()).filter(Boolean);
  return cleaned.length > 0 ? cleaned.join(", ") : "None selected";
}
