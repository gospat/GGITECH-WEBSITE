import { asString, clampText, isEmail, isRecord, isSafeHeaderValue } from "@/lib/validation";

export type YesNo = "yes" | "no";

export type ProjectBriefFeatures = {
  contactForm: boolean;
  userAuth: boolean;
  adminDashboard: boolean;
  paymentIntegration: boolean;
  blogNews: boolean;
  bookingSystem: boolean;
  chatSystem: boolean;
  analyticsTracking: boolean;
  seoSetup: boolean;
  multilingual: boolean;
  other: string;
};

export type ProjectBriefDesign = {
  colorScheme: string;
  hasLogo: YesNo;
  referenceWebsites: string[];
  preferredStyle: string;
  accessibilityPriority: YesNo;
};

export type ProjectBriefContent = {
  provideText: YesNo;
  provideMedia: YesNo;
  needContentHelp: YesNo;
};

export type ProjectBriefDomainHosting = {
  hasDomain: YesNo;
  domainDetails: string;
  needHostingHelp: YesNo;
};

export type ProjectBriefContact = {
  clientName: string;
  email: string;
  phone: string;
  preferredContactMethod: "email" | "phone" | "whatsapp";
  companyWebsite: string;
};

export type ProjectBriefBusiness = {
  businessName: string;
  businessDescription: string;
  targetAudience: string;
  location: string;
};

export type ProjectBriefGoals = {
  mainPurpose: string;
  desiredUserActions: string;
};

export type ProjectBriefSubmission = {
  contact: ProjectBriefContact;
  business: ProjectBriefBusiness;
  goals: ProjectBriefGoals;
  features: ProjectBriefFeatures;
  pagesRequired: string;
  design: ProjectBriefDesign;
  content: ProjectBriefContent;
  domainHosting: ProjectBriefDomainHosting;
  timeline: string;
  budget: string;
  additionalNotes: string;
  consent: boolean;
};

export type ValidationResult =
  { ok: true; data: ProjectBriefSubmission } | { ok: false; errors: string[] };

function asYesNo(value: unknown, fallback: YesNo = "no"): YesNo {
  if (value === "yes" || value === "no") return value;
  return fallback;
}

function asBoolean(value: unknown): boolean {
  return value === true;
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((v) => typeof v === "string")
    .map((v) => v.trim())
    .filter(Boolean)
    .slice(0, 10);
}

export function validateProjectBrief(payload: unknown): ValidationResult {
  const errors: string[] = [];

  if (!isRecord(payload)) return { ok: false, errors: ["Invalid payload."] };

  const contactRaw = isRecord(payload.contact) ? payload.contact : {};
  const businessRaw = isRecord(payload.business) ? payload.business : {};
  const goalsRaw = isRecord(payload.goals) ? payload.goals : {};
  const featuresRaw = isRecord(payload.features) ? payload.features : {};
  const designRaw = isRecord(payload.design) ? payload.design : {};
  const contentRaw = isRecord(payload.content) ? payload.content : {};
  const domainHostingRaw = isRecord(payload.domainHosting) ? payload.domainHosting : {};

  const contact: ProjectBriefContact = {
    clientName: clampText(asString(contactRaw.clientName), 120),
    email: clampText(asString(contactRaw.email).toLowerCase(), 254),
    phone: clampText(asString(contactRaw.phone), 50),
    preferredContactMethod:
      contactRaw.preferredContactMethod === "phone" ||
      contactRaw.preferredContactMethod === "whatsapp" ||
      contactRaw.preferredContactMethod === "email"
        ? contactRaw.preferredContactMethod
        : "email",
    companyWebsite: clampText(asString(contactRaw.companyWebsite), 200),
  };

  if (!contact.clientName) errors.push("Client name is required.");
  if (!isEmail(contact.email)) errors.push("A valid email is required.");

  const business: ProjectBriefBusiness = {
    businessName: clampText(asString(businessRaw.businessName), 160),
    businessDescription: clampText(asString(businessRaw.businessDescription), 2000),
    targetAudience: clampText(asString(businessRaw.targetAudience), 800),
    location: clampText(asString(businessRaw.location), 120),
  };

  if (!business.businessName) errors.push("Business name is required.");
  if (!business.businessDescription) errors.push("Business description is required.");

  // businessName is interpolated into the notification email's subject line, so
  // it gets the same CRLF guard the contact endpoint applies to its own header
  // fields. clientName shares the rule for consistency.
  if (!isSafeHeaderValue(business.businessName) || !isSafeHeaderValue(contact.clientName)) {
    errors.push("Name fields must not contain line breaks.");
  }

  const goals: ProjectBriefGoals = {
    mainPurpose: clampText(asString(goalsRaw.mainPurpose), 240),
    desiredUserActions: clampText(asString(goalsRaw.desiredUserActions), 1200),
  };

  if (!goals.mainPurpose) errors.push("Main purpose is required.");

  const features: ProjectBriefFeatures = {
    contactForm: asBoolean(featuresRaw.contactForm),
    userAuth: asBoolean(featuresRaw.userAuth),
    adminDashboard: asBoolean(featuresRaw.adminDashboard),
    paymentIntegration: asBoolean(featuresRaw.paymentIntegration),
    blogNews: asBoolean(featuresRaw.blogNews),
    bookingSystem: asBoolean(featuresRaw.bookingSystem),
    chatSystem: asBoolean(featuresRaw.chatSystem),
    analyticsTracking: asBoolean(featuresRaw.analyticsTracking),
    seoSetup: asBoolean(featuresRaw.seoSetup),
    multilingual: asBoolean(featuresRaw.multilingual),
    other: clampText(asString(featuresRaw.other), 500),
  };

  const pagesRequired = clampText(asString(payload.pagesRequired), 2000);
  if (!pagesRequired) errors.push("Pages required is required.");

  const design: ProjectBriefDesign = {
    colorScheme: clampText(asString(designRaw.colorScheme), 200),
    hasLogo: asYesNo(designRaw.hasLogo, "no"),
    referenceWebsites: asStringArray(designRaw.referenceWebsites),
    preferredStyle: clampText(asString(designRaw.preferredStyle), 120),
    accessibilityPriority: asYesNo(designRaw.accessibilityPriority, "yes"),
  };

  const content: ProjectBriefContent = {
    provideText: asYesNo(contentRaw.provideText, "no"),
    provideMedia: asYesNo(contentRaw.provideMedia, "no"),
    needContentHelp: asYesNo(contentRaw.needContentHelp, "no"),
  };

  const domainHosting: ProjectBriefDomainHosting = {
    hasDomain: asYesNo(domainHostingRaw.hasDomain, "no"),
    domainDetails: clampText(asString(domainHostingRaw.domainDetails), 200),
    needHostingHelp: asYesNo(domainHostingRaw.needHostingHelp, "no"),
  };

  const timeline = clampText(asString(payload.timeline), 200);
  const budget = clampText(asString(payload.budget), 120);
  const additionalNotes = clampText(asString(payload.additionalNotes), 4000);
  const consent = payload.consent === true;

  if (!consent) errors.push("Consent is required.");

  if (errors.length > 0) return { ok: false, errors };

  return {
    ok: true,
    data: {
      contact,
      business,
      goals,
      features,
      pagesRequired,
      design,
      content,
      domainHosting,
      timeline,
      budget,
      additionalNotes,
      consent,
    },
  };
}
