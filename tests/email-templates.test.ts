import { render } from "@react-email/render";
import { createElement } from "react";
import { describe, expect, it } from "vitest";

import {
  ACKNOWLEDGEMENT_SUBJECT,
  EnquiryAcknowledgement,
  EnquiryNotification,
  enquiryAcknowledgementPreview,
  enquiryNotificationPreview,
  enquiryNotificationSubject,
} from "@/components/email";
import type { ContactMessage } from "@/lib/contactMessage";
import type { ProjectBriefSubmission } from "@/lib/projectBrief";
import { buildContactEnquiry, buildProjectBriefEnquiry } from "@/lib/server/email/enquiry";

const SUBMITTED_AT = new Date("2026-11-15T14:32:00Z");

/** `\r\n` is what a header injection looks like; `<script>` is what XSS looks like. */
const HOSTILE_MESSAGE: ContactMessage = {
  name: "Adaeze Okafor-Testcase",
  email: "adaeze@example.com",
  company: "",
  message: [
    "Please review <script>alert('xss')</script> and <img src=x onerror=alert(1)>.",
    "A quote \" and an ampersand & and an apostrophe ' must survive verbatim.",
  ].join("\n"),
};

const BRIEF: ProjectBriefSubmission = {
  contact: {
    clientName: "Tunde Example",
    email: "tunde@example.com",
    phone: "+234 801 234 5678",
    preferredContactMethod: "whatsapp",
    companyWebsite: "",
  },
  business: {
    businessName: "Northwind Testcase Ltd",
    businessDescription: "Freight forwarding between Lagos, Ibadan and Abuja.",
    targetAudience: "",
    location: "Lagos, Nigeria",
  },
  goals: {
    mainPurpose: "Give clients a shipment tracking dashboard.",
    desiredUserActions: "Track a shipment\nDownload invoices",
  },
  features: {
    contactForm: true,
    userAuth: true,
    adminDashboard: false,
    paymentIntegration: false,
    blogNews: false,
    bookingSystem: false,
    chatSystem: false,
    analyticsTracking: true,
    seoSetup: false,
    multilingual: false,
    other: "",
  },
  pagesRequired: "Home\nServices\nClient dashboard\nContact",
  design: {
    colorScheme: "",
    hasLogo: "yes",
    referenceWebsites: [],
    preferredStyle: "",
    accessibilityPriority: "yes",
  },
  content: { provideText: "yes", provideMedia: "no", needContentHelp: "yes" },
  domainHosting: { hasDomain: "yes", domainDetails: "", needHostingHelp: "no" },
  timeline: "",
  budget: "",
  additionalNotes: "",
  consent: true,
};

const CONTACT = buildContactEnquiry({
  message: HOSTILE_MESSAGE,
  reference: "GGI-261115-7QK4ZP",
  submittedAt: SUBMITTED_AT,
});

const BRIEF_ENQUIRY = buildProjectBriefEnquiry({
  submission: BRIEF,
  reference: "GGI-261115-M3XR9C",
  submittedAt: SUBMITTED_AT,
});

/**
 * React separates adjacent text nodes with `<!-- -->` in server-rendered
 * output, so `Hello {name},` arrives as three nodes. Stripping the markers lets
 * the assertions read the way the recipient reads the email.
 */
function plain(html: string): string {
  return html.replace(/<!-- -->/g, "");
}

const notificationHtml = async () =>
  plain(await render(createElement(EnquiryNotification, { enquiry: CONTACT }), { pretty: false }));
const acknowledgementHtml = async () =>
  plain(
    await render(createElement(EnquiryAcknowledgement, { enquiry: CONTACT }), { pretty: false })
  );

describe("enquiry subjects and preheaders", () => {
  it("uses the required notification subject", () => {
    expect(enquiryNotificationSubject(CONTACT)).toBe(
      "[GGITECH] New Project Enquiry — Adaeze Okafor-Testcase"
    );
  });

  it("collapses a CRLF in the customer name before it reaches the subject line", () => {
    const hostile = buildContactEnquiry({
      message: { ...HOSTILE_MESSAGE, name: "Adaeze\r\nBcc: attacker@example.com" },
      reference: "GGI-261115-7QK4ZP",
      submittedAt: SUBMITTED_AT,
    });

    const subject = enquiryNotificationSubject(hostile);
    expect(subject).not.toMatch(/[\r\n]/);
  });

  it("uses the required acknowledgement subject", () => {
    expect(ACKNOWLEDGEMENT_SUBJECT).toBe("We've received your enquiry | GGITECH");
  });

  it("gives each template a distinct, non-empty preheader", () => {
    expect(enquiryNotificationPreview(CONTACT)).toContain("GGI-261115-7QK4ZP");
    expect(enquiryAcknowledgementPreview(CONTACT)).toContain("GGI-261115-7QK4ZP");
    expect(enquiryAcknowledgementPreview(CONTACT)).not.toBe(enquiryNotificationPreview(CONTACT));
  });
});

describe("EnquiryNotification", () => {
  it("renders the submission, contact and requirements sections", async () => {
    const html = await notificationHtml();

    expect(html).toContain("New Project Enquiry");
    expect(html).toContain("GGI-261115-7QK4ZP");
    expect(html).toContain("Customer Contact Details");
    expect(html).toContain("Enquiry Message");
    expect(html).toContain("Sunday 15 November 2026 at 15:32 WAT (Africa/Lagos)");
  });

  it("escapes submitted markup instead of rendering it", async () => {
    const html = await notificationHtml();

    // The customer's markup must arrive as text. The document does contain one
    // real `<img>` — the brand logo in the header — so the assertion is that no
    // element was built from the submitted string.
    expect(html).not.toMatch(/<script\b/i);
    expect(html).not.toMatch(/<img[^>]*src="x"/i);
    expect(html).not.toMatch(/<img[^>]*onerror/i);
    expect(html).toContain("&lt;script&gt;");
    expect(html).toContain("&lt;img src=x");
  });

  it("omits a row for a field the customer left blank", async () => {
    const html = await notificationHtml();

    // `company` is empty in the sample, so the contact form's optional row must
    // not appear at all — not even as an empty value.
    expect(html).not.toContain("Organisation");
  });

  it("omits fields that the contact form does not collect", async () => {
    const html = await notificationHtml();

    for (const absent of ["Estimated budget", "Expected timeline", "Preferred contact", "Phone"]) {
      expect(html).not.toContain(absent);
    }
  });

  it("preserves the author's line breaks in a long message", async () => {
    const html = await notificationHtml();

    expect(html).toContain("white-space:pre-wrap");
  });

  it("renders the project brief's own sections and only the ticked features", async () => {
    const html = plain(
      await render(createElement(EnquiryNotification, { enquiry: BRIEF_ENQUIRY }), {
        pretty: false,
      })
    );

    for (const heading of [
      "Customer Contact Details",
      "Project Requirements",
      "Goals &amp; Scope",
      "Design &amp; Content",
      "Domain &amp; Hosting",
    ]) {
      expect(html).toContain(heading);
    }

    expect(html).toContain("User accounts &amp; authentication");
    expect(html).toContain("Analytics");
    // Un-ticked boxes must not be listed as requested features.
    expect(html).not.toContain("Admin dashboard");
    expect(html).not.toContain("Payment integration");
    // Fields the customer left blank are skipped, including whole sections.
    expect(html).not.toContain("Timeline &amp; Budget");
    expect(html).not.toContain("Additional Information");
  });

  it("carries no internal server metadata", async () => {
    const html = await notificationHtml();

    expect(html).not.toContain("Source IP");
    expect(html).not.toContain("User Agent");
    expect(html).not.toContain("re_test_key");
  });
});

describe("EnquiryAcknowledgement", () => {
  const html = () => acknowledgementHtml();

  it("greets the customer by name and confirms receipt", async () => {
    const output = await html();

    expect(output).toContain("Hello Adaeze Okafor-Testcase");
    expect(output).toContain("we&#x27;ve received your enquiry");
    expect(output).toContain("GGI-261115-7QK4ZP");
  });

  it("states plainly that the message is automatic", async () => {
    const output = await html();

    expect(output).toContain("This message is an automatic confirmation");
  });

  it("promises no response window", async () => {
    const output = await html();

    expect(output).not.toMatch(/within \d+ (business )?(day|days|hour|hours)/i);
    expect(output).not.toMatch(/24 hours/i);
    expect(output).not.toMatch(/business day/i);
  });

  it("sends only a summary, not the full brief", async () => {
    const output = await render(createElement(EnquiryAcknowledgement, { enquiry: BRIEF_ENQUIRY }), {
      pretty: false,
    });

    expect(output).toContain("Northwind Testcase Ltd");
    // The sensitive detail stays in the team's copy.
    expect(output).not.toContain("Freight forwarding between Lagos");
    expect(output).not.toContain("Download invoices");
  });

  it("escapes submitted markup", async () => {
    const output = await html();

    expect(output).not.toContain("<script>alert");
    expect(output).toContain("&lt;script&gt;");
  });

  it("includes the verified website address and the legal footer", async () => {
    const output = await html();

    expect(output).toContain("https://ggitech.dev");
    expect(output).toContain("GOSPAT Global Innovations Ltd");
    expect(output).toContain("Lagos, Nigeria");
  });

  it("shows no mailbox that is not confirmed to receive mail", async () => {
    const output = await html();

    expect(output).not.toContain("info@ggitech.dev");
    expect(output).not.toContain("hello@ggitech.dev");
    expect(output).not.toContain("notifications@ggitech.dev");
  });
});

describe("email rendering in general", () => {
  it("inlines its styles and embeds no script or external stylesheet", async () => {
    const outputs = await Promise.all([notificationHtml(), acknowledgementHtml()]);

    for (const html of outputs) {
      expect(html).not.toMatch(/<script\b/i);
      expect(html).not.toMatch(/<link\b[^>]*stylesheet/i);
      // React Email inlines styles onto the elements themselves.
      expect(html).toContain("style=");
    }
  });

  it("sets a language and text direction on the document", async () => {
    const html = await notificationHtml();

    expect(html).toMatch(/<html[^>]*lang="en"/);
    expect(html).toMatch(/dir="ltr"/);
  });

  it("announces light/dark support and keeps the card light in dark mode", async () => {
    const html = await notificationHtml();

    expect(html).toContain("color-scheme");
    expect(html).toContain("prefers-color-scheme: dark");
  });

  it("references the logo over HTTPS with alternative text", async () => {
    const html = await notificationHtml();

    expect(html).toContain("https://ggitech.dev/brand/icon-512.png");
    expect(html).toMatch(/alt="GGI Tech logo"/);
  });

  it("produces a plain-text alternative for both templates", async () => {
    const [notificationText, acknowledgementText] = await Promise.all([
      render(createElement(EnquiryNotification, { enquiry: CONTACT }), {
        pretty: false,
        plainText: true,
      }),
      render(createElement(EnquiryAcknowledgement, { enquiry: CONTACT }), {
        pretty: false,
        plainText: true,
      }),
    ]);

    expect(notificationText).toContain("GGI-261115-7QK4ZP");
    // The section heading is uppercased in the HTML, and the text renderer
    // carries that transform through, so the plain-text copy is uppercase too.
    expect(notificationText).toContain("CUSTOMER CONTACT DETAILS");
    expect(notificationText).not.toContain("<div");
    expect(acknowledgementText).toContain("Hello Adaeze Okafor-Testcase");
    expect(acknowledgementText).toContain("GOSPAT Global Innovations Ltd");
    expect(acknowledgementText).not.toContain("<div");
  });
});
