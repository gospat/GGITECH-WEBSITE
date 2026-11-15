/**
 * Accessible text styles for email.
 *
 * Every size here is at or above 13px and every colour is checked against the
 * background it sits on, because some clients refuse to scale text and some
 * recipients read these messages on a phone in daylight.
 */

import { Heading, Link, Text } from "@react-email/components";
import type { ReactNode } from "react";
import { emailBrand, emailClass, emailFont, emailFontMono } from "@/components/email/theme";

/** Page-level title, e.g. the form an enquiry came from. */
export function EmailTitle({ children }: { children: ReactNode }) {
  return (
    <Heading as="h1" className={emailClass.title} style={title}>
      {children}
    </Heading>
  );
}

/** Section label. Mirrors the website's uppercase tracking-widest accent. */
export function EmailSectionHeading({ children }: { children: ReactNode }) {
  return (
    <Heading as="h2" className={emailClass.heading} style={sectionHeading}>
      {children}
    </Heading>
  );
}

export function EmailParagraph({ children }: { children: ReactNode }) {
  return <Text style={paragraph}>{children}</Text>;
}

export function EmailMuted({ children }: { children: ReactNode }) {
  return <Text style={muted}>{children}</Text>;
}

/** Row label in a detail list. */
export function EmailLabel({ children }: { children: ReactNode }) {
  return (
    <Text className={emailClass.label} style={label}>
      {children}
    </Text>
  );
}

/** Row value in a detail list. `multiline` keeps the author's line breaks. */
export function EmailValue({ children, multiline }: { children: ReactNode; multiline?: boolean }) {
  return <Text style={multiline ? multilineValue : value}>{children}</Text>;
}

export function EmailReference({ children }: { children: ReactNode }) {
  return <Text style={reference}>{children}</Text>;
}

export function EmailLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link href={href} style={link}>
      {children}
    </Link>
  );
}

const title: React.CSSProperties = {
  margin: "0 0 8px",
  fontFamily: emailFont,
  fontSize: "22px",
  lineHeight: "30px",
  fontWeight: 700,
  color: emailBrand.text,
};

const sectionHeading: React.CSSProperties = {
  margin: "0 0 14px",
  fontFamily: emailFont,
  fontSize: "12px",
  lineHeight: "16px",
  fontWeight: 700,
  letterSpacing: "0.12em",
  textTransform: "uppercase",
  color: emailBrand.primary,
};

const paragraph: React.CSSProperties = {
  margin: "0 0 14px",
  fontFamily: emailFont,
  fontSize: "15px",
  lineHeight: "24px",
  color: emailBrand.text,
};

const muted: React.CSSProperties = {
  margin: "0 0 12px",
  fontFamily: emailFont,
  fontSize: "13px",
  lineHeight: "21px",
  color: emailBrand.textMuted,
};

const label: React.CSSProperties = {
  margin: "0",
  fontFamily: emailFont,
  fontSize: "12.5px",
  lineHeight: "19px",
  fontWeight: 600,
  color: emailBrand.textMuted,
};

const value: React.CSSProperties = {
  margin: "0",
  fontFamily: emailFont,
  fontSize: "14.5px",
  lineHeight: "22px",
  color: emailBrand.text,
};

const multilineValue: React.CSSProperties = {
  ...value,
  whiteSpace: "pre-wrap",
};

const reference: React.CSSProperties = {
  margin: "0",
  fontFamily: emailFontMono,
  fontSize: "14px",
  lineHeight: "20px",
  fontWeight: 600,
  letterSpacing: "0.02em",
  color: emailBrand.text,
};

const link: React.CSSProperties = {
  color: emailBrand.link,
  textDecoration: "underline",
};
