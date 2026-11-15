/**
 * Timestamp formatting for enquiry emails.
 *
 * The business operates from Lagos, so every internal notification states the
 * submission time in that zone *and* names the zone. An email that says only
 * "14:32" is ambiguous the moment it is read from another timezone.
 */

export const ENQUIRY_TIME_ZONE = "Africa/Lagos";

/**
 * West Africa Time. Nigeria has observed a single offset year-round since 1914,
 * so the fixed label cannot drift the way a DST-observing zone would.
 */
export const ENQUIRY_TIME_ZONE_LABEL = "WAT (Africa/Lagos)";

const formatter = new Intl.DateTimeFormat("en-GB", {
  timeZone: ENQUIRY_TIME_ZONE,
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

export function formatSubmittedAt(value: Date | string): string {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "Unknown";
  return `${formatter.format(date)} ${ENQUIRY_TIME_ZONE_LABEL}`;
}
