import { describe, expect, it } from "vitest";

import {
  ENQUIRY_TIME_ZONE,
  ENQUIRY_TIME_ZONE_LABEL,
  formatSubmittedAt,
} from "@/lib/server/email/format";

/**
 * These assertions are deliberately exact strings.
 *
 * The formatter previously leaned on `Intl.DateTimeFormat#format()`, which
 * returns the locale's own pattern — punctuation included. That punctuation is
 * CLDR data and moves between ICU releases: CI (Node 22) rendered en-GB with a
 * comma after the weekday where local Node 20 did not, so the same submission
 * produced two different sentences. Asserting the full string here is what
 * catches a regression back to locale-emitted literals; loosening it to a
 * regex would hide exactly the drift it exists to catch.
 */
describe("formatSubmittedAt", () => {
  it("renders a fixed, punctuation-stable sentence", () => {
    expect(formatSubmittedAt(new Date("2026-11-15T14:32:00Z"))).toBe(
      "Sunday 15 November 2026 at 15:32 WAT (Africa/Lagos)"
    );
  });

  it("never emits the locale's comma after the weekday", () => {
    // The failure this file was written for: some ICU versions format en-GB as
    // "Sunday, 15 November 2026 at 15:32". The comma must not reappear.
    expect(formatSubmittedAt(new Date("2026-11-15T14:32:00Z"))).not.toMatch(/^\w+, /);
  });

  it("converts to Lagos time rather than the host timezone", () => {
    // 23:30 UTC is already the next day in Lagos (UTC+1), so the date rolls
    // forward too. A formatter that quietly used the server's zone would print
    // 14 November here.
    expect(formatSubmittedAt(new Date("2026-11-14T23:30:00Z"))).toBe(
      "Sunday 15 November 2026 at 00:30 WAT (Africa/Lagos)"
    );
  });

  it("prints midnight as 00:00, not 24:00", () => {
    expect(formatSubmittedAt(new Date("2026-11-14T23:00:00Z"))).toContain("00:00");
  });

  it("pads a single-digit hour so the column stays aligned", () => {
    // 06:05 in Lagos.
    expect(formatSubmittedAt(new Date("2026-11-15T05:05:00Z"))).toBe(
      "Sunday 15 November 2026 at 06:05 WAT (Africa/Lagos)"
    );
  });

  it("renders a range of dates and weekdays consistently", () => {
    const cases: Array<[string, string]> = [
      ["2026-01-01T09:00:00Z", "Thursday 1 January 2026 at 10:00 WAT (Africa/Lagos)"],
      ["2026-06-30T21:15:00Z", "Tuesday 30 June 2026 at 22:15 WAT (Africa/Lagos)"],
      ["2026-12-25T12:00:00Z", "Friday 25 December 2026 at 13:00 WAT (Africa/Lagos)"],
      ["2027-02-28T23:59:00Z", "Monday 1 March 2027 at 00:59 WAT (Africa/Lagos)"],
    ];

    for (const [input, expected] of cases) {
      expect(formatSubmittedAt(new Date(input)), `for ${input}`).toBe(expected);
    }
  });

  it("accepts an ISO string as well as a Date", () => {
    expect(formatSubmittedAt("2026-11-15T14:32:00Z")).toBe(
      "Sunday 15 November 2026 at 15:32 WAT (Africa/Lagos)"
    );
  });

  it("returns Unknown for an unparseable timestamp", () => {
    for (const value of ["not a date", "", "2026-13-45T99:99:99Z"]) {
      expect(formatSubmittedAt(value)).toBe("Unknown");
    }
  });

  it("returns Unknown for an Invalid Date object", () => {
    expect(formatSubmittedAt(new Date(Number.NaN))).toBe("Unknown");
  });

  it("keeps the zone name in every output", () => {
    // The suffix is the whole point: a bare time is ambiguous when read from
    // another timezone, which is why the label is fixed rather than derived.
    expect(ENQUIRY_TIME_ZONE).toBe("Africa/Lagos");
    expect(ENQUIRY_TIME_ZONE_LABEL).toBe("WAT (Africa/Lagos)");
    expect(formatSubmittedAt(new Date("2026-11-15T14:32:00Z"))).toContain(ENQUIRY_TIME_ZONE_LABEL);
  });

  it("does not consult the host timezone", () => {
    // Same instant, opposite host zones, identical output. This is the property
    // the ICU drift broke, stated independently of any particular pattern.
    const instant = new Date("2026-07-04T18:45:00Z");
    const before = process.env.TZ;
    try {
      process.env.TZ = "Pacific/Auckland";
      const auckland = formatSubmittedAt(instant);
      process.env.TZ = "America/Los_Angeles";
      const losAngeles = formatSubmittedAt(instant);
      expect(auckland).toBe(losAngeles);
      expect(auckland).toBe("Saturday 4 July 2026 at 19:45 WAT (Africa/Lagos)");
    } finally {
      if (before === undefined) delete process.env.TZ;
      else process.env.TZ = before;
    }
  });
});
