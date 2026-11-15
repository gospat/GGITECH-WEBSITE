/**
 * Public surface of the email design system.
 *
 * Adding a new email type means adding one folder under `templates/` that
 * composes the components below; nothing else in the application changes.
 */

export { CallToAction } from "@/components/email/CallToAction";
export { DetailList } from "@/components/email/DetailList";
export { Divider } from "@/components/email/Divider";
export { EmailFooter } from "@/components/email/EmailFooter";
export { EmailHeader } from "@/components/email/EmailHeader";
export { EmailLayout } from "@/components/email/EmailLayout";
export { SectionCard } from "@/components/email/SectionCard";
export {
  EmailLabel,
  EmailLink,
  EmailMuted,
  EmailParagraph,
  EmailReference,
  EmailSectionHeading,
  EmailTitle,
  EmailValue,
} from "@/components/email/Typography";
export {
  emailBaseCss,
  emailBrand,
  emailClass,
  emailFont,
  emailRadius,
} from "@/components/email/theme";

export {
  ACKNOWLEDGEMENT_SUBJECT,
  EnquiryAcknowledgement,
  enquiryAcknowledgementPreview,
} from "@/components/email/templates/EnquiryAcknowledgement";
export {
  EnquiryNotification,
  enquiryNotificationPreview,
  enquiryNotificationSubject,
} from "@/components/email/templates/EnquiryNotification";
