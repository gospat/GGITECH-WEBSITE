/**
 * Renders both branded enquiry emails to disk so they can be opened in a
 * browser. Development only.
 *
 *     npm run preview:email
 *     open .email-preview/contact-acknowledgement.html
 *
 * This script never contacts Resend and never reads `RESEND_API_KEY`,
 * `CONTACT_NOTIFICATION_EMAIL` or any other email variable: it only builds the
 * view model and calls the same templates the service does. The data below is
 * entirely fictional and committed nowhere — the output directory is
 * git-ignored — so no customer information can leak into the repository.
 *
 * What to check in the output: the reference row renders in monospace, a blank
 * optional field leaves no empty row, the long description keeps its line
 * breaks, and special characters appear as literal text rather than markup.
 */

import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { render } from "@react-email/render";
import { createElement } from "react";
import type { ReactElement } from "react";

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
import type { EnquiryEmailData } from "@/lib/server/email/enquiry";

const OUTPUT_DIR = ".email-preview";
const REFERENCE_DATE = new Date("2026-11-15T14:32:00Z");

/** Fictional. The reserved `.example` TLD cannot receive mail by design. */
const SAMPLE_CONTACT: ContactMessage = {
  name: "Adaeze Okafor-Testcase",
  email: "adaeze@example.com",
  company: "Northwind Testcase Ltd — Lagos & Abuja",
  message: [
    "Hello team,",
    "",
    "We need a new marketing site for a logistics business, plus a customer",
    "dashboard where clients can track shipments.",
    "",
    'Angle-bracket check: <script>alert("xss")</script> and <> and "quotes".',
    "Accents and symbols: café, 5% — €1,200, em—dash, ✓.",
  ].join("\n"),
};

const SAMPLE_BRIEF: ProjectBriefSubmission = {
  contact: {
    clientName: "Tunde Example",
    email: "tunde@example.com",
    phone: "+234 801 234 5678",
    preferredContactMethod: "whatsapp",
    companyWebsite: "https://northwind.example.com",
  },
  business: {
    businessName: "Northwind Testcase Ltd",
    businessDescription:
      "A regional logistics operator moving freight between Lagos, Ibadan and Abuja, with a small in-house fleet and a growing set of corporate clients.",
    targetAudience: "Operations managers at mid-sized manufacturers and importers.",
    location: "Lagos, Nigeria",
  },
  goals: {
    mainPurpose: "Replace the current brochure site and give clients a tracking dashboard.",
    desiredUserActions: "Request a quote, track a shipment, download invoices.",
  },
  features: {
    contactForm: true,
    userAuth: true,
    adminDashboard: true,
    paymentIntegration: true,
    blogNews: false,
    bookingSystem: false,
    chatSystem: true,
    analyticsTracking: true,
    seoSetup: true,
    multilingual: false,
    other: "Bulk shipment CSV import for operations staff.",
  },
  pagesRequired: [
    "Home",
    "Services (three sub-pages)",
    "Client dashboard with shipment tracking",
    "Quote request",
    "About and contact",
  ].join("\n"),
  design: {
    colorScheme: "Deep navy with an amber accent",
    hasLogo: "yes",
    referenceWebsites: ["https://heavyload.example.com", "https://seafreight.example.com"],
    preferredStyle: "Corporate and restrained",
    accessibilityPriority: "yes",
  },
  content: {
    provideText: "yes",
    provideMedia: "no",
    needContentHelp: "yes",
  },
  domainHosting: {
    hasDomain: "yes",
    domainDetails: "northwindtestcase.example.com is registered and delegated",
    needHostingHelp: "no",
  },
  timeline: "Prefer live before the next quarter",
  budget: "₦4,500,000 – ₦6,000,000",
  additionalNotes:
    "The dashboard must work on tablets in the warehouse, so touch targets matter.\nWe would also like the site to load quickly on 3G.",
  consent: true,
};

type Preview = {
  slug: string;
  subject: string;
  preheader: string;
  enquiry: EnquiryEmailData;
  element: ReactElement;
};

function previews(): Preview[] {
  const contact = buildContactEnquiry({
    message: SAMPLE_CONTACT,
    reference: "GGI-261115-7QK4ZP",
    submittedAt: REFERENCE_DATE,
  });
  const brief = buildProjectBriefEnquiry({
    submission: SAMPLE_BRIEF,
    reference: "GGI-261115-M3XR9C",
    submittedAt: REFERENCE_DATE,
  });

  return [
    {
      slug: "contact-notification",
      subject: enquiryNotificationSubject(contact),
      preheader: enquiryNotificationPreview(contact),
      enquiry: contact,
      element: createElement(EnquiryNotification, { enquiry: contact }),
    },
    {
      slug: "contact-acknowledgement",
      subject: ACKNOWLEDGEMENT_SUBJECT,
      preheader: enquiryAcknowledgementPreview(contact),
      enquiry: contact,
      element: createElement(EnquiryAcknowledgement, { enquiry: contact }),
    },
    {
      slug: "brief-notification",
      subject: enquiryNotificationSubject(brief),
      preheader: enquiryNotificationPreview(brief),
      enquiry: brief,
      element: createElement(EnquiryNotification, { enquiry: brief }),
    },
    {
      slug: "brief-acknowledgement",
      subject: ACKNOWLEDGEMENT_SUBJECT,
      preheader: enquiryAcknowledgementPreview(brief),
      enquiry: brief,
      element: createElement(EnquiryAcknowledgement, { enquiry: brief }),
    },
  ];
}

/**
 * Cheap guard against a sample that no longer exercises the templates. A
 * preview that silently renders a nearly empty email is worse than none.
 */
function assertSampleShape(enquiry: EnquiryEmailData): void {
  if (enquiry.contactDetails.length === 0 || enquiry.sections.length === 0) {
    throw new Error(`Sample data for ${enquiry.formKind} produced no sections.`);
  }
}

async function main(): Promise<void> {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Email previews are a development tool and refuse to run in production.");
  }

  const outputDir = join(process.cwd(), OUTPUT_DIR);
  await mkdir(outputDir, { recursive: true });

  const rows: { file: string; subject: string; preheader: string }[] = [];

  for (const preview of previews()) {
    assertSampleShape(preview.enquiry);

    const html = await render(preview.element, { pretty: true });
    const text = await render(preview.element, { pretty: false, plainText: true });

    await writeFile(join(outputDir, `${preview.slug}.html`), html, "utf8");
    await writeFile(join(outputDir, `${preview.slug}.txt`), text, "utf8");

    rows.push({
      file: `${preview.slug}.html`,
      subject: preview.subject,
      preheader: preview.preheader,
    });
  }

  console.info(`Rendered ${rows.length} previews into ${OUTPUT_DIR}/ using fictional data.\n`);
  for (const row of rows) {
    console.info(`  ${row.file}`);
    console.info(`    subject:   ${row.subject}`);
    console.info(`    preheader: ${row.preheader}`);
  }
  console.info(`\nOpen one with: open ${OUTPUT_DIR}/${rows[0].file}`);
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
