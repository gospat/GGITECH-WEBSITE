import { describe, expect, it } from "vitest";

import { validateContactMessage } from "@/lib/contactMessage";
import { validateProjectBrief } from "@/lib/projectBrief";

describe("validateContactMessage", () => {
  const valid = {
    name: "Adaeze Okafor-Testcase",
    email: "adaeze@example.com",
    company: "Northwind Testcase Ltd",
    message: "We would like to discuss a new marketing site for our business.",
  };

  it("accepts a well-formed submission", () => {
    const result = validateContactMessage(valid);

    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data.email).toBe("adaeze@example.com");
  });

  it("rejects a non-object payload", () => {
    expect(validateContactMessage("not an object").ok).toBe(false);
    expect(validateContactMessage(null).ok).toBe(false);
  });

  it("requires a name", () => {
    const result = validateContactMessage({ ...valid, name: "   " });

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.join(" ")).toMatch(/name is required/i);
  });

  it("requires a well-formed email address", () => {
    for (const email of ["", "adaeze", "adaeze@", "@example.com", "a b@example.com"]) {
      const result = validateContactMessage({ ...valid, email });
      expect(result.ok, `expected ${JSON.stringify(email)} to be rejected`).toBe(false);
    }
  });

  it("requires a message of a useful length", () => {
    const result = validateContactMessage({ ...valid, message: "too short" });

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.join(" ")).toMatch(/at least 10 characters/i);
  });

  it("clamps an excessively long message instead of rejecting it", () => {
    const result = validateContactMessage({ ...valid, message: "x".repeat(10_000) });

    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data.message.length).toBe(4_000);
  });

  it("clamps long name and company values", () => {
    const result = validateContactMessage({
      ...valid,
      name: "n".repeat(400),
      company: "c".repeat(400),
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.name.length).toBe(120);
      expect(result.data.company.length).toBe(160);
    }
  });

  it("rejects a CRLF header injection in the name", () => {
    const result = validateContactMessage({
      ...valid,
      name: "Adaeze\r\nBcc: attacker@example.com",
    });

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.join(" ")).toMatch(/invalid characters/i);
  });

  it("rejects a CRLF header injection in the company field", () => {
    const result = validateContactMessage({
      ...valid,
      company: "Northwind\nBcc: attacker@example.com",
    });

    expect(result.ok).toBe(false);
  });

  it("keeps a script tag as literal text rather than stripping it", () => {
    // Escaping is the template's job; validation must not silently mangle the
    // enquiry, and must not treat markup in the body as a header risk.
    const result = validateContactMessage({
      ...valid,
      message: "Please review <script>alert('xss')</script> before we start.",
    });

    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data.message).toContain("<script>");
  });

  it("lower-cases and trims the submitted address", () => {
    const result = validateContactMessage({ ...valid, email: "  Adaeze@Example.COM " });

    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data.email).toBe("adaeze@example.com");
  });

  it("coerces non-string field values to empty rather than throwing", () => {
    const result = validateContactMessage({ ...valid, name: 42, message: { $gt: "" } });

    expect(result.ok).toBe(false);
  });
});

describe("validateProjectBrief", () => {
  const valid = {
    contact: {
      clientName: "Tunde Example",
      email: "tunde@example.com",
      phone: "+234 801 234 5678",
      preferredContactMethod: "email",
      companyWebsite: "",
    },
    business: {
      businessName: "Northwind Testcase Ltd",
      businessDescription: "Freight forwarding between Lagos and Abuja.",
      targetAudience: "",
      location: "Lagos",
    },
    goals: { mainPurpose: "A tracking dashboard.", desiredUserActions: "" },
    features: { contactForm: true, other: "" },
    pagesRequired: "Home\nContact",
    design: {
      colorScheme: "",
      hasLogo: "yes",
      referenceWebsites: [],
      preferredStyle: "",
      accessibilityPriority: "yes",
    },
    content: { provideText: "yes", provideMedia: "no", needContentHelp: "no" },
    domainHosting: { hasDomain: "no", domainDetails: "", needHostingHelp: "yes" },
    timeline: "",
    budget: "",
    additionalNotes: "",
    consent: true,
  };

  it("accepts a complete brief", () => {
    expect(validateProjectBrief(valid).ok).toBe(true);
  });

  it("requires consent", () => {
    const result = validateProjectBrief({ ...valid, consent: false });

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.join(" ")).toMatch(/consent is required/i);
  });

  it("requires each essential answer", () => {
    const result = validateProjectBrief({
      ...valid,
      contact: { ...valid.contact, clientName: "" },
      business: { ...valid.business, businessName: "", businessDescription: "" },
      goals: { mainPurpose: "", desiredUserActions: "" },
      pagesRequired: "",
    });

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.length).toBeGreaterThanOrEqual(5);
  });

  it("rejects an invalid email address", () => {
    const result = validateProjectBrief({
      ...valid,
      contact: { ...valid.contact, email: "tunde@" },
    });

    expect(result.ok).toBe(false);
  });

  it("rejects a CRLF injection in the name that reaches the notification subject", () => {
    const result = validateProjectBrief({
      ...valid,
      business: { ...valid.business, businessName: "Northwind\r\nBcc: attacker@example.com" },
    });

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.join(" ")).toMatch(/line breaks/i);
  });

  it("clamps an excessively long brief instead of rejecting it", () => {
    const result = validateProjectBrief({
      ...valid,
      pagesRequired: "x".repeat(5_000),
      additionalNotes: "y".repeat(9_000),
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.pagesRequired.length).toBe(2_000);
      expect(result.data.additionalNotes.length).toBe(4_000);
    }
  });

  it("defaults an unrecognised enum to a safe value rather than failing open", () => {
    const result = validateProjectBrief({
      ...valid,
      contact: { ...valid.contact, preferredContactMethod: "carrier-pigeon" },
      design: { ...valid.design, hasLogo: "maybe" },
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.contact.preferredContactMethod).toBe("email");
      expect(result.data.design.hasLogo).toBe("no");
    }
  });

  it("treats a non-array reference website field as empty", () => {
    const result = validateProjectBrief({
      ...valid,
      design: { ...valid.design, referenceWebsites: "https://a.example.com" },
    });

    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data.design.referenceWebsites).toEqual([]);
  });

  it("caps the number of reference websites", () => {
    const result = validateProjectBrief({
      ...valid,
      design: {
        ...valid.design,
        referenceWebsites: Array.from({ length: 40 }, (_, i) => `https://${i}.example.com`),
      },
    });

    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data.design.referenceWebsites.length).toBe(10);
  });

  it("rejects a payload that is not an object", () => {
    expect(validateProjectBrief(undefined).ok).toBe(false);
  });
});
