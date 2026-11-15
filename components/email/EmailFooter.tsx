import { Link, Section, Text } from "@react-email/components";
import { site } from "@/lib/site";
import { emailBrand, emailClass, emailFont } from "@/components/email/theme";

/** `https://ggitech.dev` -> `ggitech.dev` for display. */
const displayUrl = site.url.replace(/^https?:\/\//, "");

/**
 * Branded footer.
 *
 * There is deliberately no contact address here. A mailbox is only published
 * once it is verified to receive mail (`NEXT_PUBLIC_CONTACT_EMAIL`), and this
 * footer has no configuration to read — so the website is the destination it
 * names. That keeps an automated email from pointing a customer at a reply
 * address that silently bounces.
 *
 * `note` is the reason-for-receipt line, which differs between the internal
 * notification and the customer acknowledgement.
 */
export function EmailFooter({ note }: { note: string }) {
  return (
    <Section className={emailClass.footer} style={footer}>
      <Text style={entity}>{site.legalName}</Text>
      <Text style={meta}>
        {site.location}
        {" · "}
        <Link href={site.url} style={footerLink}>
          {displayUrl}
        </Link>
      </Text>
      <Text style={reason}>{note}</Text>
    </Section>
  );
}

const footer: React.CSSProperties = {
  padding: "18px 28px 8px",
  textAlign: "center",
};

const entity: React.CSSProperties = {
  margin: "0 0 4px",
  fontFamily: emailFont,
  fontSize: "12px",
  lineHeight: "18px",
  fontWeight: 600,
  color: emailBrand.textMuted,
};

const meta: React.CSSProperties = {
  margin: "0 0 10px",
  fontFamily: emailFont,
  fontSize: "12px",
  lineHeight: "18px",
  color: emailBrand.textMuted,
};

const footerLink: React.CSSProperties = {
  color: emailBrand.link,
  textDecoration: "underline",
};

const reason: React.CSSProperties = {
  margin: "0",
  fontFamily: emailFont,
  fontSize: "11.5px",
  lineHeight: "17px",
  color: "#6B7280",
};
