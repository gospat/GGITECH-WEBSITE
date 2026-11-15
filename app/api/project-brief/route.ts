import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { validateProjectBrief } from "@/lib/projectBrief";
import { buildProjectBriefEnquiry } from "@/lib/server/email/enquiry";
import { emailFailureResponse } from "@/lib/server/email/http";
import { createEnquiryReference } from "@/lib/server/email/reference";
import { sendEnquiryEmails } from "@/lib/server/email/service";
import { buildProjectBriefPdf } from "@/lib/server/projectBriefPdf";
import { rateLimit } from "@/lib/server/rateLimit";
import { getRequestIp, getUserAgent, isSameOriginRequest } from "@/lib/server/requestMeta";
import {
  recallSubmission,
  rememberSubmission,
  submissionFingerprint,
} from "@/lib/server/submissionGuard";

const MAX_REQUESTS_PER_HOUR = 3;

export async function POST(req: NextRequest) {
  // Checked before any work so a third-party page cannot spend our email quota.
  if (!isSameOriginRequest(req)) {
    return NextResponse.json({ ok: false, error: "Request blocked." }, { status: 403 });
  }

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

  // The key comes from `requestMeta`, which walks the forwarded chain back by
  // TRUSTED_PROXY_HOPS. A forged X-Forwarded-For therefore cannot hand a caller
  // a fresh bucket.
  const limitResult = await rateLimit({
    key: ip || ua || "unknown",
    limit: MAX_REQUESTS_PER_HOUR,
    windowMs: 60 * 60 * 1000,
  });
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

  const submission = validation.data;
  const fingerprint = submissionFingerprint(["project-brief", JSON.stringify(submission)]);

  // An identical brief means the browser replayed the POST and the first copy
  // already reached the team, so this one answers with that same success
  // instead of sending a second email and a second PDF.
  const alreadyAccepted = recallSubmission(fingerprint);
  if (alreadyAccepted) {
    return NextResponse.json({ ok: true, reference: alreadyAccepted }, { status: 200 });
  }

  const submittedAt = new Date();
  const submittedAtISO = submittedAt.toISOString();
  const reference = createEnquiryReference(submittedAt);

  let delivery;
  try {
    // The PDF is generated before the send so a rendering fault fails the
    // request cleanly rather than leaving a half-built email behind.
    const pdfBytes = await buildProjectBriefPdf({ submission, submittedAtISO });

    delivery = await sendEnquiryEmails({
      enquiry: buildProjectBriefEnquiry({ submission, reference, submittedAt }),
      attachments: [
        {
          filename: `project-brief-${submission.business.businessName.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}-${submittedAtISO.slice(
            0,
            10
          )}.pdf`,
          content: pdfBytes,
          contentType: "application/pdf",
        },
      ],
    });
  } catch (error) {
    return emailFailureResponse(error);
  }

  // Recorded only after the provider accepted the notification, so a failure
  // above leaves the visitor free to correct the form and send again.
  rememberSubmission(fingerprint, reference);

  // `acknowledged` tells the form whether it may repeat the "confirmation
  // sent" line. The acknowledgement is sent independently of the notification,
  // so it can fail after the provider has already accepted the brief.
  return NextResponse.json(
    { ok: true, reference, acknowledged: delivery.acknowledgement === "sent" },
    { status: 200 }
  );
}
