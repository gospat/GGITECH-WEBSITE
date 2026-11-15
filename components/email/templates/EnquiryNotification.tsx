import { CallToAction } from "@/components/email/CallToAction";
import { DetailList } from "@/components/email/DetailList";
import { Divider } from "@/components/email/Divider";
import { EmailLayout } from "@/components/email/EmailLayout";
import { SectionCard } from "@/components/email/SectionCard";
import { EmailMuted, EmailParagraph, EmailTitle } from "@/components/email/Typography";
import type { EnquiryDetail, EnquiryEmailData } from "@/lib/server/email/enquiry";
import { singleLine } from "@/lib/server/email/text";

/**
 * Internal notification sent to `CONTACT_NOTIFICATION_EMAIL`.
 *
 * `replyTo` on the message is the customer's address, so the team's normal
 * email client replies straight back to them. The reference number is the only
 * identifier either side shares, so it is repeated in the subject-adjacent
 * summary, the card and the acknowledgement.
 */

const FOOTER_NOTE =
  "Automated notification from the ggitech.dev website. Internal use only — please do not forward outside the team.";

export function enquiryNotificationSubject(enquiry: EnquiryEmailData): string {
  return `[GGITECH] New Project Enquiry — ${singleLine(enquiry.customerName)}`;
}

export function enquiryNotificationPreview(enquiry: EnquiryEmailData): string {
  return `${enquiry.reference} — ${enquiry.formLabel} from ${singleLine(enquiry.customerName)}`;
}

export function EnquiryNotification({ enquiry }: { enquiry: EnquiryEmailData }) {
  const name = singleLine(enquiry.customerName);

  // Form, reference and time are properties of the submission rather than
  // customer answers, so they get their own summary card ahead of the contact
  // details the team actually needs to act on.
  const submissionMeta: EnquiryDetail[] = [
    { label: "Reference", value: enquiry.reference, mono: true },
    { label: "Received", value: enquiry.submittedAt },
    { label: "Submitted through", value: enquiry.formLabel },
  ];

  return (
    <EmailLayout preview={enquiryNotificationPreview(enquiry)} footerNote={FOOTER_NOTE}>
      <EmailTitle>New Project Enquiry</EmailTitle>
      <EmailParagraph>
        {name} submitted the {enquiry.formLabel.toLowerCase()} on ggitech.dev. The full submission
        is below.
      </EmailParagraph>

      <Divider />

      <SectionCard heading="Submission">
        <DetailList details={submissionMeta} />
      </SectionCard>

      <SectionCard heading="Customer Contact Details">
        <DetailList details={enquiry.contactDetails} />
      </SectionCard>

      {enquiry.sections.map((section) => (
        <SectionCard key={section.heading} heading={section.heading}>
          <DetailList details={section.details} />
        </SectionCard>
      ))}

      <CallToAction href={`mailto:${enquiry.customerEmail}`} label={`Reply to ${name}`} />

      <EmailMuted>
        Replying to this email reaches {name} directly — the customer&apos;s address is already set
        as the reply-to.
      </EmailMuted>
    </EmailLayout>
  );
}
