import { Button } from "@react-email/components";
import { emailBrand, emailFont, emailRadius } from "@/components/email/theme";

/**
 * Single-action button. Rendered as a styled link inside its own paragraph so
 * it degrades to a plain underlined link anywhere the table styling is dropped.
 */
export function CallToAction({ href, label }: { href: string; label: string }) {
  return (
    <Button href={href} style={button}>
      {label}
    </Button>
  );
}

const button: React.CSSProperties = {
  display: "inline-block",
  margin: "4px 0 20px",
  padding: "13px 26px",
  backgroundColor: emailBrand.button,
  borderRadius: emailRadius,
  fontFamily: emailFont,
  fontSize: "14px",
  lineHeight: "20px",
  fontWeight: 600,
  color: "#FFFFFF",
  textDecoration: "none",
};
