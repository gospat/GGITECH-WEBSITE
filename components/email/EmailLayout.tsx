import { Body, Container, Head, Html, Preview, Section } from "@react-email/components";
import type { ReactNode } from "react";
import { EmailFooter } from "@/components/email/EmailFooter";
import { EmailHeader } from "@/components/email/EmailHeader";
import { emailBaseCss, emailBrand, emailClass, emailFont } from "@/components/email/theme";

/**
 * Shared shell for every GGITECH email: masthead, white content panel, branded
 * footer, plus the hidden preheader that inboxes show next to the subject.
 *
 * There is no `<style>` link and no script anywhere in these templates — some
 * clients strip both — so each element carries its own inline styles and the
 * stylesheet below only refines what already works without it.
 *
 * Server-only: these components are rendered by the email service and must
 * never be imported into a client component.
 */
export function EmailLayout({
  preview,
  footerNote,
  children,
}: {
  preview: string;
  footerNote: string;
  children: ReactNode;
}) {
  return (
    <Html lang="en" dir="ltr">
      <Head>
        <meta name="color-scheme" content="light dark" />
        <meta name="supported-color-schemes" content="light dark" />
        <meta name="x-apple-disable-message-reformatting" />
        <style>{emailBaseCss}</style>
      </Head>

      <Preview>{preview}</Preview>

      <Body style={body}>
        <Container className={emailClass.shell} style={shell}>
          <EmailHeader />
          <Section className={emailClass.card} style={card}>
            {children}
          </Section>
          <EmailFooter note={footerNote} />
        </Container>
      </Body>
    </Html>
  );
}

const body: React.CSSProperties = {
  backgroundColor: emailBrand.page,
  fontFamily: emailFont,
  margin: "0",
  padding: "24px 12px",
};

const shell: React.CSSProperties = {
  maxWidth: "600px",
  width: "100%",
  margin: "0 auto",
  backgroundColor: emailBrand.page,
};

const card: React.CSSProperties = {
  backgroundColor: emailBrand.paper,
  borderRadius: "0 0 10px 10px",
  padding: "26px 28px 22px",
};
