import { Section } from "@react-email/components";
import type { ReactNode } from "react";
import { EmailSectionHeading } from "@/components/email/Typography";
import { emailBrand, emailRadius } from "@/components/email/theme";

/**
 * Information summary section: a tinted panel with a heading and whatever rows
 * or prose the template puts inside it. Rows are stacked rather than laid out
 * in two columns on purpose — a fixed label column has to be squeezed to fit a
 * 320px screen, and email clients do not agree on how to stack table cells.
 */
export function SectionCard({ heading, children }: { heading: string; children: ReactNode }) {
  return (
    <Section style={card}>
      <EmailSectionHeading>{heading}</EmailSectionHeading>
      {children}
    </Section>
  );
}

const card: React.CSSProperties = {
  backgroundColor: emailBrand.surface,
  border: `1px solid ${emailBrand.border}`,
  borderRadius: emailRadius,
  padding: "18px 20px 6px",
  margin: "0 0 16px",
};
