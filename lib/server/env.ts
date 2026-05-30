function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing environment variable: ${name}`);
  return value;
}

function optional(name: string): string | undefined {
  const value = process.env[name];
  return value ? value : undefined;
}

export function getMailEnv() {
  const portRaw = optional("SMTP_PORT");
  const secureRaw = optional("SMTP_SECURE");

  return {
    smtpHost: required("SMTP_HOST"),
    smtpPort: portRaw ? Number(portRaw) : 587,
    smtpSecure: secureRaw ? secureRaw === "true" : false,
    smtpUser: required("SMTP_USER"),
    smtpPass: required("SMTP_PASS"),
    fromEmail: required("FROM_EMAIL"),
    officialBriefEmail: required("OFFICIAL_BRIEF_EMAIL"),
  };
}

