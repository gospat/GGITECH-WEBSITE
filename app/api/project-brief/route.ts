import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { validateProjectBrief } from "@/lib/projectBrief";
import { site } from "@/lib/site";
import { getMailEnv } from "@/lib/server/env";
import { getTransporter } from "@/lib/server/mailer";
import { buildProjectBriefPdf } from "@/lib/server/projectBriefPdf";
import { getRequestIp, getUserAgent } from "@/lib/server/requestMeta";
import { rateLimit } from "@/lib/server/rateLimit";

export async function POST(req: NextRequest) {
  let payload: unknown;

  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON body." }, { status: 400 });
  }

  const contactMaybe =
    typeof payload === "object" && payload !== null && "contact" in payload
      ? (payload as { contact?: unknown }).contact
      : undefined;
  const honeypot =
    typeof contactMaybe === "object" && contactMaybe !== null && "companyWebsite" in contactMaybe
      ? String((contactMaybe as { companyWebsite?: unknown }).companyWebsite ?? "").trim()
      : "";
  if (honeypot) {
    return NextResponse.json({ ok: true }, { status: 200 });
  }

  const ip = getRequestIp(req);
  const ua = getUserAgent(req);
  const limiterKey = ip || ua || "unknown";
  const limitResult = rateLimit({ key: limiterKey, limit: 3, windowMs: 60 * 60 * 1000 });
  if (!limitResult.ok) {
    return NextResponse.json(
      { ok: false, error: "Too many requests. Please try again later." },
      { status: 429, headers: { "Retry-After": String(limitResult.retryAfterSeconds) } }
    );
  }

  const validation = validateProjectBrief(payload);
  if (!validation.ok) {
    return NextResponse.json({ ok: false, errors: validation.errors }, { status: 400 });
  }

  let env;
  try {
    env = getMailEnv();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Server email configuration is missing." },
      { status: 500 }
    );
  }

  const submission = validation.data;
  const submittedAtISO = new Date().toISOString();

  const pdfBytes = await buildProjectBriefPdf({
    submission,
    submittedAtISO,
    sourceIp: ip,
    userAgent: ua,
  });

  const transporter = getTransporter();
  const internalSubject = `New Website Project Brief — ${submission.business.businessName}`;

  // An SMTP failure must not surface as an unhandled 500 — the client gets a
  // sanitised message and the real error stays in the server log.
  try {
    await transporter.sendMail({
      from: env.fromEmail,
      to: env.officialBriefEmail,
      replyTo: submission.contact.email,
      subject: internalSubject,
      text: [
        "A new website project brief has been submitted.",
        "",
        `Client: ${submission.contact.clientName}`,
        `Email: ${submission.contact.email}`,
        `Phone: ${submission.contact.phone || "-"}`,
        "",
        "The PDF summary is attached.",
      ].join("\n"),
      attachments: [
        {
          filename: `project-brief-${submission.business.businessName.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}-${submittedAtISO.slice(
            0,
            10
          )}.pdf`,
          content: Buffer.from(pdfBytes),
          contentType: "application/pdf",
        },
      ],
    });

    await transporter.sendMail({
      from: env.fromEmail,
      to: submission.contact.email,
      subject: "We received your project brief — GGI Tech",
      text: [
        `Dear ${submission.contact.clientName || "Client"},`,
        "",
        "Thank you for submitting your website project brief. Your message has been delivered successfully.",
        "",
        "Our team will review your requirements and reach out using your preferred contact method.",
        "",
        `${site.name} — A Division of ${site.legalName}`,
        site.email,
      ].join("\n"),
    });
  } catch (error) {
    console.error("project-brief: failed to send mail", error);
    return NextResponse.json(
      { ok: false, error: "We could not send your brief. Please try again shortly." },
      { status: 502 }
    );
  }

  return NextResponse.json({ ok: true }, { status: 200 });
}
