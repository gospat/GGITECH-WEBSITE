import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { validateContactMessage } from "@/lib/contactMessage";
import { getMailEnv } from "@/lib/server/env";
import { getTransporter } from "@/lib/server/mailer";
import { rateLimit } from "@/lib/server/rateLimit";
import { getRequestIp, getUserAgent, isSameOriginRequest } from "@/lib/server/requestMeta";
import { site } from "@/lib/site";
import { isRecord } from "@/lib/validation";

const MAX_REQUESTS_PER_HOUR = 5;

export async function POST(req: NextRequest) {
  // Checked before any work so a third-party page cannot spend our SMTP quota.
  if (!isSameOriginRequest(req)) {
    return NextResponse.json({ ok: false, error: "Request blocked." }, { status: 403 });
  }

  let payload: unknown;

  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON body." }, { status: 400 });
  }

  // Honeypot: real users never fill a hidden field.
  if (
    isRecord(payload) &&
    String((payload as Record<string, unknown>).companyWebsite ?? "").trim().length > 0
  ) {
    return NextResponse.json({ ok: true }, { status: 200 });
  }

  const ip = getRequestIp(req);
  const userAgent = getUserAgent(req);

  const limit = await rateLimit({
    key: `contact:${ip || userAgent || "unknown"}`,
    limit: MAX_REQUESTS_PER_HOUR,
    windowMs: 60 * 60 * 1000,
  });

  if (!limit.ok) {
    return NextResponse.json(
      { ok: false, error: "Too many messages sent. Please try again later." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } }
    );
  }

  const validation = validateContactMessage(payload);
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

  const { name, email, company, message } = validation.data;
  const transporter = getTransporter();

  try {
    await transporter.sendMail({
      from: env.fromEmail,
      to: env.officialBriefEmail,
      replyTo: email,
      subject: `Website enquiry — ${name}`,
      text: [
        "A new message was submitted through the website contact form.",
        "",
        `Name: ${name}`,
        `Email: ${email}`,
        `Company: ${company || "-"}`,
        `Received: ${new Date().toISOString()}`,
        "",
        "Message:",
        message,
      ].join("\n"),
    });

    await transporter.sendMail({
      from: env.fromEmail,
      to: email,
      subject: `We received your message — ${site.name}`,
      text: [
        `Dear ${name},`,
        "",
        `Thank you for contacting ${site.name}. Your message has been received and our team will respond shortly.`,
        "",
        "For reference, this is the message you sent:",
        "",
        message,
        "",
        `${site.name} — A Division of ${site.legalName}`,
        site.email,
      ].join("\n"),
    });
  } catch {
    return NextResponse.json(
      {
        ok: false,
        error: `We could not send your message right now. Please email ${site.email} directly.`,
      },
      { status: 502 }
    );
  }

  return NextResponse.json({ ok: true }, { status: 200 });
}
