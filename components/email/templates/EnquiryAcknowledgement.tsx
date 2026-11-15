import { CallToAction } from "@/components/email/CallToAction";
import { DetailList } from "@/components/email/DetailList";
import { EmailLayout } from "@/components/email/EmailLayout";
import { SectionCard } from "@/components/email/SectionCard";
import { EmailMuted, EmailParagraph, EmailTitle } from "@/components/email/Typography";
import { site } from "@/lib/site";
import type { EnquiryEmailData } from "@/lib/server/email/enquiry";
import { singleLine } from "@/lib/server/email/text";

/**
 * Automatic acknowledgement sent to the customer once the internal notification
 * has been accepted by Resend.
 *
 * It confirms receipt and nothing more. It does not promise a response window,
 * does not say the enquiry has been reviewed, and does not echo the brief back
 * — a summary is enough, and the full text stays in the team's mailbox.
 *
 * The reference number is described as what it is: an identifier printed on
 * this exchange, carried in both emails. Nothing here implies it can be looked
 * up, because no enquiry record is stored.
 */

export const ACKNOWLEDGEMENT_SUBJECT = "We've received your enquiry | GGITECH";

const FOOTER_NOTE = `You are receiving this email because a form was submitted on ${site.url.replace(/^https?:\/\//, "")}.`;

const NEXT_STEPS = [
  "Our team will review your enquiry and match it to the right specialist.",
  "If you need to add anything, reply to this email and leave your reference in the message.",
];

export function enquiryAcknowledgementPreview(enquiry: EnquiryEmailData): string {
  return `Reference ${enquiry.reference} — your enquiry has been received by ${site.name}.`;
}

export function EnquiryAcknowledgement({ enquiry }: { enquiry: EnquiryEmailData }) {
  const name = singleLine(enquiry.customerName);

  return (
    <EmailLayout preview={enquiryAcknowledgementPreview(enquiry)} footerNote={FOOTER_NOTE}>
      <EmailTitle>Thank you — we&apos;ve received your enquiry</EmailTitle>

      <EmailParagraph>Hello {name},</EmailParagraph>
      <EmailParagraph>
        Thank you for contacting {site.name}. We have received your enquiry and it is now with our
        team.
      </EmailParagraph>
      <EmailParagraph>
        This message is an automatic confirmation. A member of our team will get back to you using
        the details you provided.
      </EmailParagraph>

      <SectionCard heading="Your Enquiry">
        <DetailList details={enquiry.acknowledgementSummary} />
      </SectionCard>

      <SectionCard heading="What Happens Next">
        {NEXT_STEPS.map((step, index) => (
          <EmailParagraph key={step}>
            {index + 1}. {step}
          </EmailParagraph>
        ))}
      </SectionCard>

      <CallToAction href={site.url} label="Visit ggitech.dev" />

      <EmailParagraph>
        Kind regards,
        <br />
        The {site.name} team
      </EmailParagraph>

      <EmailMuted>
        Please keep the reference number above. It identifies this enquiry — if you reply, leave it
        in the message so your follow-up can be matched to it.
      </EmailMuted>
    </EmailLayout>
  );
}
