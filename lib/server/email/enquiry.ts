/**
 * Form-agnostic view model for enquiry emails.
 *
 * The two branded templates render this shape and know nothing about the
 * contact or project-brief payloads, so a third form can be added later by
 * writing one builder here rather than touching the design system.
 *
 * Two rules drive everything below:
 *
 * 1. Only fields that actually exist on the submitted form are displayed. The
 *    contact form has no phone, budget or timeline, so its email never renders
 *    an empty row for them.
 * 2. Optional fields appear only when the customer supplied a value. A blank
 *    row tells the reader nothing and makes the email look broken.
 */

import type { ContactMessage } from "@/lib/contactMessage";
import type { ProjectBriefFeatures, ProjectBriefSubmission } from "@/lib/projectBrief";
import { formatSubmittedAt } from "@/lib/server/email/format";
import { excerpt, listOrNone, yesNo } from "@/lib/server/email/text";

export type EnquiryFormKind = "contact" | "project-brief";

export const ENQUIRY_FORM_LABEL: Record<EnquiryFormKind, string> = {
  contact: "Website contact form",
  "project-brief": "Website project brief",
};

export type EnquiryDetail = {
  label: string;
  value: string;
  /** Renders the author's line breaks instead of collapsing them. */
  multiline?: boolean;
  /** Turns the value into a link, e.g. `mailto:` or `tel:`. */
  href?: string;
  /** Renders in the monospace face, for system-generated values like the reference. */
  mono?: boolean;
};

export type EnquirySection = {
  heading: string;
  details: EnquiryDetail[];
};

export type EnquiryEmailData = {
  formKind: EnquiryFormKind;
  /** Human label for the form the enquiry arrived through. */
  formLabel: string;
  reference: string;
  /** Already formatted with an explicit timezone. */
  submittedAt: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  /** Rendered first, under "Customer Contact Details". */
  contactDetails: EnquiryDetail[];
  /** Rendered after the contact block. */
  sections: EnquirySection[];
  /** Short, non-sensitive recap used by the acknowledgement. */
  acknowledgementSummary: EnquiryDetail[];
};

/** Appends a row unless the customer left the field blank. */
function addIf(
  details: EnquiryDetail[],
  label: string,
  value: string,
  options?: { multiline?: boolean }
): void {
  const trimmed = value.trim();
  if (!trimmed) return;
  details.push({ label, value: trimmed, ...options });
}

/** `+234 801 234 5678` -> `+2348012345678`, the only shape `tel:` accepts. */
function telHref(phone: string): string {
  return `tel:${phone.replace(/[^\d+]/g, "")}`;
}

const PREFERRED_CONTACT_LABEL: Record<
  ProjectBriefSubmission["contact"]["preferredContactMethod"],
  string
> = {
  email: "Email",
  phone: "Phone call",
  whatsapp: "WhatsApp",
};

/**
 * Only the features the customer actually ticked, paired with their form
 * labels so the team reads `Payments, Admin dashboard` rather than
 * `paymentIntegration: true`.
 */
const FEATURE_LABELS: ReadonlyArray<[keyof ProjectBriefFeatures, string]> = [
  ["contactForm", "Contact form"],
  ["userAuth", "User accounts & authentication"],
  ["adminDashboard", "Admin dashboard"],
  ["paymentIntegration", "Payment integration"],
  ["blogNews", "Blog / news"],
  ["bookingSystem", "Booking or scheduling"],
  ["chatSystem", "Chat or messaging"],
  ["analyticsTracking", "Analytics"],
  ["seoSetup", "SEO setup"],
  ["multilingual", "Multilingual support"],
];

function selectedFeatures(features: ProjectBriefFeatures): string[] {
  return FEATURE_LABELS.filter(([key]) => features[key] === true).map(([, label]) => label);
}

export function buildContactEnquiry(input: {
  message: ContactMessage;
  reference: string;
  submittedAt: Date;
}): EnquiryEmailData {
  const { message, reference, submittedAt } = input;
  const submitted = formatSubmittedAt(submittedAt);

  const contactDetails: EnquiryDetail[] = [
    { label: "Name", value: message.name },
    { label: "Email", value: message.email, href: `mailto:${message.email}` },
  ];
  addIf(contactDetails, "Organisation", message.company);

  return {
    formKind: "contact",
    formLabel: ENQUIRY_FORM_LABEL.contact,
    reference,
    submittedAt: submitted,
    customerName: message.name,
    customerEmail: message.email,
    contactDetails,
    sections: [
      {
        heading: "Enquiry Message",
        details: [{ label: "Message", value: message.message, multiline: true }],
      },
    ],
    acknowledgementSummary: [
      { label: "Reference", value: reference, mono: true },
      { label: "Submitted", value: submitted },
      { label: "Message", value: excerpt(message.message, 220) },
    ],
  };
}

export function buildProjectBriefEnquiry(input: {
  submission: ProjectBriefSubmission;
  reference: string;
  submittedAt: Date;
}): EnquiryEmailData {
  const { submission, reference, submittedAt } = input;
  const submitted = formatSubmittedAt(submittedAt);
  const { contact, business, goals, features, design, content, domainHosting } = submission;

  const contactDetails: EnquiryDetail[] = [
    { label: "Name", value: contact.clientName },
    { label: "Email", value: contact.email, href: `mailto:${contact.email}` },
  ];
  if (contact.phone.trim()) {
    contactDetails.push({
      label: "Phone",
      value: contact.phone.trim(),
      href: telHref(contact.phone),
    });
  }
  contactDetails.push({
    label: "Preferred contact",
    value: PREFERRED_CONTACT_LABEL[contact.preferredContactMethod],
  });
  addIf(contactDetails, "Company website", contact.companyWebsite);

  const overview: EnquiryDetail[] = [
    { label: "Business or organisation", value: business.businessName },
    { label: "What it does", value: business.businessDescription, multiline: true },
  ];
  addIf(overview, "Target audience", business.targetAudience, { multiline: true });
  addIf(overview, "Location", business.location);

  const scope: EnquiryDetail[] = [
    { label: "Main purpose of the site", value: goals.mainPurpose },
    { label: "Features requested", value: listOrNone(selectedFeatures(features)) },
  ];
  addIf(scope, "Desired user actions", goals.desiredUserActions, { multiline: true });
  addIf(scope, "Pages or screens required", submission.pagesRequired, { multiline: true });
  addIf(scope, "Other features", features.other);

  const designDetails: EnquiryDetail[] = [
    { label: "Brand assets available", value: yesNo(design.hasLogo === "yes") },
    { label: "Accessibility is a priority", value: yesNo(design.accessibilityPriority === "yes") },
    { label: "Supplying written content", value: yesNo(content.provideText === "yes") },
    { label: "Supplying images or media", value: yesNo(content.provideMedia === "yes") },
    { label: "Needs help with content", value: yesNo(content.needContentHelp === "yes") },
  ];
  addIf(designDetails, "Colour preferences", design.colorScheme);
  addIf(designDetails, "Preferred style", design.preferredStyle);
  if (design.referenceWebsites.length > 0) {
    designDetails.push({
      label: "Reference websites",
      value: design.referenceWebsites.join("\n"),
      multiline: true,
    });
  }

  const hosting: EnquiryDetail[] = [
    { label: "Already has a domain", value: yesNo(domainHosting.hasDomain === "yes") },
    { label: "Needs help with hosting", value: yesNo(domainHosting.needHostingHelp === "yes") },
  ];
  addIf(hosting, "Domain details", domainHosting.domainDetails);

  const timeline: EnquiryDetail[] = [];
  addIf(timeline, "Expected timeline", submission.timeline);
  addIf(timeline, "Estimated budget", submission.budget);

  const sections: EnquirySection[] = [
    { heading: "Project Requirements", details: overview },
    { heading: "Goals & Scope", details: scope },
    { heading: "Design & Content", details: designDetails },
    { heading: "Domain & Hosting", details: hosting },
  ];
  if (timeline.length > 0) sections.push({ heading: "Timeline & Budget", details: timeline });
  if (submission.additionalNotes.trim()) {
    sections.push({
      heading: "Additional Information",
      details: [
        { label: "Additional notes", value: submission.additionalNotes.trim(), multiline: true },
      ],
    });
  }

  const acknowledgementSummary: EnquiryDetail[] = [
    { label: "Reference", value: reference, mono: true },
    { label: "Submitted", value: submitted },
    { label: "Project", value: business.businessName },
    { label: "Scope", value: excerpt(submission.pagesRequired, 200) },
  ];
  addIf(acknowledgementSummary, "Expected timeline", submission.timeline);

  return {
    formKind: "project-brief",
    formLabel: ENQUIRY_FORM_LABEL["project-brief"],
    reference,
    submittedAt: submitted,
    customerName: contact.clientName,
    customerEmail: contact.email,
    ...(contact.phone.trim() ? { customerPhone: contact.phone.trim() } : {}),
    contactDetails,
    sections,
    acknowledgementSummary,
  };
}
