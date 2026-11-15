import { Column, Img, Row, Section, Text } from "@react-email/components";
import { site } from "@/lib/site";
import { emailBrand, emailClass, emailFont, emailRadius } from "@/components/email/theme";

/**
 * Branded masthead: the Iso Cube mark on the brand ink plate, with the wordmark
 * alongside.
 *
 * The mark is raster (`icon-512.png`) rather than the SVG lockup because
 * Outlook desktop does not render SVG, and the file is an opaque brand plate so
 * a dark-mode client that inverts transparent PNGs cannot mangle it. The
 * wordmark itself is live text in the system stack, which keeps the header
 * legible even when images are blocked — the default in Outlook.
 */
export function EmailHeader() {
  return (
    <Section className={emailClass.header} style={header}>
      <Row>
        <Column style={markColumn}>
          <Img
            src={`${site.url}/brand/icon-512.png`}
            width="42"
            height="42"
            alt={`${site.name} logo`}
            style={mark}
          />
        </Column>
        <Column style={wordmarkColumn}>
          <Text style={wordmark}>{site.name}</Text>
          <Text style={tagline}>{site.tagline}</Text>
        </Column>
      </Row>
    </Section>
  );
}

const header: React.CSSProperties = {
  backgroundColor: emailBrand.ink,
  borderRadius: `${emailRadius} ${emailRadius} 0 0`,
  padding: "22px 28px",
};

const markColumn: React.CSSProperties = {
  width: "54px",
  padding: "0",
  verticalAlign: "middle",
};

const mark: React.CSSProperties = {
  display: "block",
  borderRadius: "8px",
};

const wordmarkColumn: React.CSSProperties = {
  padding: "0",
  verticalAlign: "middle",
};

const wordmark: React.CSSProperties = {
  margin: "0",
  fontFamily: emailFont,
  fontSize: "17px",
  lineHeight: "22px",
  fontWeight: 700,
  letterSpacing: "0.01em",
  color: emailBrand.textOnInk,
};

const tagline: React.CSSProperties = {
  margin: "3px 0 0",
  fontFamily: emailFont,
  fontSize: "11px",
  lineHeight: "15px",
  fontWeight: 600,
  letterSpacing: "0.09em",
  textTransform: "uppercase",
  color: emailBrand.textOnInkMuted,
};
