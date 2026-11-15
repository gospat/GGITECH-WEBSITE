import { Hr } from "@react-email/components";
import { emailBrand } from "@/components/email/theme";

/** Horizontal rule between blocks of an email. */
export function Divider() {
  return (
    <Hr
      style={{
        borderColor: emailBrand.rule,
        borderTopWidth: "1px",
        borderBottomWidth: "0",
        margin: "24px 0",
      }}
    />
  );
}
