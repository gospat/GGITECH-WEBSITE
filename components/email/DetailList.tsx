import { Section } from "@react-email/components";
import { EmailLabel, EmailLink, EmailReference, EmailValue } from "@/components/email/Typography";
import type { EnquiryDetail } from "@/lib/server/email/enquiry";

/**
 * Label/value detail rows.
 *
 * Values are rendered as React text nodes, never as markup, so a message
 * containing `<script>` is escaped by React and shown literally. The only way
 * a value becomes a link is through the `href` the builder set from a validated
 * address, which keeps a submitted string from choosing its own destination.
 */
export function DetailList({ details }: { details: EnquiryDetail[] }) {
  return (
    <>
      {details.map((detail, index) => (
        <Section key={`${detail.label}-${index}`} style={row(index === details.length - 1)}>
          <EmailLabel>{detail.label}</EmailLabel>
          {detail.mono ? (
            <EmailReference>{detail.value}</EmailReference>
          ) : (
            <EmailValue multiline={detail.multiline}>
              {detail.href ? (
                <EmailLink href={detail.href}>{detail.value}</EmailLink>
              ) : (
                detail.value
              )}
            </EmailValue>
          )}
        </Section>
      ))}
    </>
  );
}

function row(last: boolean): React.CSSProperties {
  return { margin: last ? "0" : "0 0 14px" };
}
