import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";
import { getMailEnv } from "@/lib/server/env";

let transporter: Transporter | null = null;

export function getTransporter(): Transporter {
  if (transporter) return transporter;

  const env = getMailEnv();

  transporter = nodemailer.createTransport({
    host: env.smtpHost,
    port: env.smtpPort,
    secure: env.smtpSecure,
    auth: {
      user: env.smtpUser,
      pass: env.smtpPass,
    },
  });

  return transporter;
}
