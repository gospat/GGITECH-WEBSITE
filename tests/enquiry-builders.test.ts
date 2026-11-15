import { describe, expect, it } from "vitest";

import type { ContactMessage } from "@/lib/contactMessage";
import type { ProjectBriefSubmission } from "@/lib/projectBrief";
import { buildContactEnquiry, buildProjectBriefEnquiry } from "@/lib/server/email/enquiry";

const SUBMITTED_AT = new Date("2026-11-15T14:32:00Z");

function brief(overrides: Partial<ProjectBriefSubmission> = {}): ProjectBriefSubmission {
  return {
    contact: {
      clientName: "Tunde Example",
      email: "tunde@example.com",
      phone: "",
      preferredContactMethod: "email",
      companyWebsite: "",
    },
    business: {
      businessName: "Northwind Testcase Ltd",
      businessDescription: "Freight forwarding.",
      targetAudience: "",
      location: "",
    },
    goals: { mainPurpose: "A tracking dashboard.", desiredUserActions: "" },
    features: {
      contactForm: false,
      userAuth: false,
      adminDashboard: false,
      paymentIntegration: false,
      blogNews: false,
      bookingSystem: false,
      chatSystem: false,
      analyticsTracking: false,
      seoSetup: false,
      multilingual: false,
      other: "",
    },
    pagesRequired: "Home\nContact",
    design: {
      colorScheme: "",
      hasLogo: "no",
      referenceWebsites: [],
      preferredStyle: "",
      accessibilityPriority: "no",
    },
    content: { provideText: "no", provideMedia: "no", needContentHelp: "no" },
    domainHosting: { hasDomain: "no", domainDetails: "", needHostingHelp: "no" },
    timeline: "",
    budget: "",
    additionalNotes: "",
    consent: true,
    ...overrides,
  };
}

describe("buildContactEnquiry", () => {
  const base: ContactMessage = {
    name: "Adaeze Okafor-Testcase",
    email: "adaeze@example.com",
    company: "",
    message: "We need a new marketing site.",
  };

  it("labels the form and carries the reference through", () => {
    const enquiry = buildContactEnquiry({
      message: base,
      reference: "GGI-261115-7QK4ZP",
      submittedAt: SUBMITTED_AT,
    });

    expect(enquiry.formKind).toBe("contact");
    expect(enquiry.formLabel).toBe("Website contact form");
    expect(enquiry.reference).toBe("GGI-261115-7QK4ZP");
  });

  it("omits a blank optional row rather than rendering an empty value", () => {
    const enquiry = buildContactEnquiry({
      message: base,
      reference: "GGI-261115-7QK4ZP",
      submittedAt: SUBMITTED_AT,
    });

    expect(enquiry.contactDetails.map((d) => d.label)).toEqual(["Name", "Email"]);
  });

  it("adds the organisation row only when supplied", () => {
    const enquiry = buildContactEnquiry({
      message: { ...base, company: "Northwind Testcase Ltd" },
      reference: "GGI-261115-7QK4ZP",
      submittedAt: SUBMITTED_AT,
    });

    expect(enquiry.contactDetails.map((d) => d.label)).toEqual(["Name", "Email", "Organisation"]);
  });

  it("links the customer's email as a mailto", () => {
    const enquiry = buildContactEnquiry({
      message: base,
      reference: "GGI-261115-7QK4ZP",
      submittedAt: SUBMITTED_AT,
    });

    expect(enquiry.contactDetails[1].href).toBe("mailto:adaeze@example.com");
  });

  it("marks the reference as monospace in the acknowledgement summary", () => {
    const enquiry = buildContactEnquiry({
      message: base,
      reference: "GGI-261115-7QK4ZP",
      submittedAt: SUBMITTED_AT,
    });

    const reference = enquiry.acknowledgementSummary.find((d) => d.label === "Reference");
    expect(reference?.mono).toBe(true);
  });

  it("shortens the message in the acknowledgement but keeps the full text for the team", () => {
    const long = "x".repeat(1_000) + " and a closing thought.";
    const enquiry = buildContactEnquiry({
      message: { ...base, message: long },
      reference: "GGI-261115-7QK4ZP",
      submittedAt: SUBMITTED_AT,
    });

    const summary = enquiry.acknowledgementSummary.find((d) => d.label === "Message");
    expect(summary?.value.length).toBeLessThan(long.length);
    expect(summary?.value).toMatch(/…$/);
    expect(enquiry.sections[0].details[0].value).toBe(long);
  });
});

describe("buildProjectBriefEnquiry", () => {
  it("respects the customer's preferred contact method", () => {
    const enquiry = buildProjectBriefEnquiry({
      submission: brief({
        contact: {
          clientName: "Tunde Example",
          email: "tunde@example.com",
          phone: "",
          preferredContactMethod: "whatsapp",
          companyWebsite: "",
        },
      }),
      reference: "GGI-261115-M3XR9C",
      submittedAt: SUBMITTED_AT,
    });

    const preferred = enquiry.contactDetails.find((d) => d.label === "Preferred contact");
    expect(preferred?.value).toBe("WhatsApp");
  });

  it("turns a formatted phone number into a dialable tel link", () => {
    const enquiry = buildProjectBriefEnquiry({
      submission: brief({
        contact: {
          clientName: "Tunde Example",
          email: "tunde@example.com",
          phone: "+234 801 234 5678",
          preferredContactMethod: "phone",
          companyWebsite: "",
        },
      }),
      reference: "GGI-261115-M3XR9C",
      submittedAt: SUBMITTED_AT,
    });

    const phone = enquiry.contactDetails.find((d) => d.label === "Phone");
    expect(phone?.href).toBe("tel:+2348012345678");
  });

  it("lists only the features the customer ticked, using their form labels", () => {
    const enquiry = buildProjectBriefEnquiry({
      submission: brief({
        features: {
          contactForm: true,
          userAuth: false,
          adminDashboard: true,
          paymentIntegration: false,
          blogNews: false,
          bookingSystem: false,
          chatSystem: false,
          analyticsTracking: false,
          seoSetup: false,
          multilingual: false,
          other: "",
        },
      }),
      reference: "GGI-261115-M3XR9C",
      submittedAt: SUBMITTED_AT,
    });

    const scope = enquiry.sections.find((s) => s.heading === "Goals & Scope");
    const features = scope?.details.find((d) => d.label === "Features requested");
    expect(features?.value).toBe("Contact form, Admin dashboard");
  });

  it("says so explicitly when no feature box was ticked", () => {
    const enquiry = buildProjectBriefEnquiry({
      submission: brief(),
      reference: "GGI-261115-M3XR9C",
      submittedAt: SUBMITTED_AT,
    });

    const scope = enquiry.sections.find((s) => s.heading === "Goals & Scope");
    expect(scope?.details.find((d) => d.label === "Features requested")?.value).toBe(
      "None selected"
    );
  });

  it("drops the timeline, budget and notes sections when nothing was supplied", () => {
    const enquiry = buildProjectBriefEnquiry({
      submission: brief(),
      reference: "GGI-261115-M3XR9C",
      submittedAt: SUBMITTED_AT,
    });

    const headings = enquiry.sections.map((s) => s.heading);
    expect(headings).not.toContain("Timeline & Budget");
    expect(headings).not.toContain("Additional Information");
  });

  it("adds the timeline and budget section once either is supplied", () => {
    const enquiry = buildProjectBriefEnquiry({
      submission: brief({ budget: "₦4,500,000 – ₦6,000,000" }),
      reference: "GGI-261115-M3XR9C",
      submittedAt: SUBMITTED_AT,
    });

    const section = enquiry.sections.find((s) => s.heading === "Timeline & Budget");
    expect(section?.details.map((d) => d.label)).toEqual(["Estimated budget"]);
  });

  it("keeps the author's line breaks in a multi-line field", () => {
    const enquiry = buildProjectBriefEnquiry({
      submission: brief({ pagesRequired: "Home\nAbout\nContact" }),
      reference: "GGI-261115-M3XR9C",
      submittedAt: SUBMITTED_AT,
    });

    const pages = enquiry.sections
      .find((s) => s.heading === "Goals & Scope")
      ?.details.find((d) => d.label === "Pages or screens required");
    expect(pages?.multiline).toBe(true);
    expect(pages?.value).toContain("\n");
  });

  it("renders yes/no answers as words rather than raw values", () => {
    const enquiry = buildProjectBriefEnquiry({
      submission: brief({
        design: {
          colorScheme: "",
          hasLogo: "yes",
          referenceWebsites: [],
          preferredStyle: "",
          accessibilityPriority: "yes",
        },
      }),
      reference: "GGI-261115-M3XR9C",
      submittedAt: SUBMITTED_AT,
    });

    const design = enquiry.sections.find((s) => s.heading === "Design & Content");
    expect(design?.details.find((d) => d.label === "Brand assets available")?.value).toBe("Yes");
    expect(design?.details.find((d) => d.label === "Needs help with content")?.value).toBe("No");
  });

  it("keeps reference websites on their own lines", () => {
    const enquiry = buildProjectBriefEnquiry({
      submission: brief({
        design: {
          colorScheme: "",
          hasLogo: "no",
          referenceWebsites: ["https://a.example.com", "https://b.example.com"],
          preferredStyle: "",
          accessibilityPriority: "no",
        },
      }),
      reference: "GGI-261115-M3XR9C",
      submittedAt: SUBMITTED_AT,
    });

    const design = enquiry.sections.find((s) => s.heading === "Design & Content");
    const references = design?.details.find((d) => d.label === "Reference websites");
    expect(references?.value).toBe("https://a.example.com\nhttps://b.example.com");
  });

  it("exposes the customer phone on the view model when supplied", () => {
    const enquiry = buildProjectBriefEnquiry({
      submission: brief({
        contact: {
          clientName: "Tunde Example",
          email: "tunde@example.com",
          phone: "+234 801 234 5678",
          preferredContactMethod: "email",
          companyWebsite: "",
        },
      }),
      reference: "GGI-261115-M3XR9C",
      submittedAt: SUBMITTED_AT,
    });

    expect(enquiry.customerPhone).toBe("+234 801 234 5678");
  });
});
