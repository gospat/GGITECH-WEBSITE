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

/**
 * Fields are read individually and joined here, rather than taken from a single
 * `format()` call.
 *
 * `format()` hands back the locale's own pattern, punctuation included, and that
 * punctuation is CLDR data that shifts between ICU versions. Node 20 (ICU 75)
 * renders en-GB as `Sunday 15 November 2026 at 15:32`; Node 22 ships a newer ICU
 * whose en-GB pattern inserts a comma — `Sunday, 15 November 2026 at 15:32`.
 * Identical locale, identical options, different string, on machines that
 * disagree about nothing else. The wording of a customer-facing email should not
 * be a function of the reader's Node version, so the assembly belongs to us.
 *
 * `formatToParts()` keeps the locale responsible only for the field *values*
 * ("November", "Sunday"), which is where localisation is genuinely wanted, and
 * leaves the structure ("weekday day month year at hour:minute") fixed.
 *
 * `hourCycle: "h23"` rather than `hour12: false`: the latter is the older flag
 * and some ICU builds resolve it to `h24`, which prints midnight as `24:00`
 * instead of `00:00`.
 */
const formatter = new Intl.DateTimeFormat("en-GB", {
  timeZone: ENQUIRY_TIME_ZONE,
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

function field(parts: Intl.DateTimeFormatPart[], type: Intl.DateTimeFormatPartTypes): string {
  return parts.find((part) => part.type === type)?.value ?? "";
}

/**
 * `Sunday 15 November 2026 at 15:32 WAT (Africa/Lagos)`, in every environment.
 *
 * An unparseable value yields `"Unknown"` rather than `Invalid Date`, so a
 * malformed timestamp degrades to an odd-looking row in one email instead of
 * putting that string in front of the team.
 */
export function formatSubmittedAt(value: Date | string): string {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "Unknown";

  const parts = formatter.formatToParts(date);
  const datePart = ["weekday", "day", "month", "year"]
    .map((type) => field(parts, type as Intl.DateTimeFormatPartTypes))
    .filter(Boolean)
    .join(" ");

  return `${datePart} at ${field(parts, "hour")}:${field(parts, "minute")} ${ENQUIRY_TIME_ZONE_LABEL}`;
}
