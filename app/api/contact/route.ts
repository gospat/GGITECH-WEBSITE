import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { validateContactMessage } from "@/lib/contactMessage";
import { buildContactEnquiry } from "@/lib/server/email/enquiry";
import { emailFailureResponse } from "@/lib/server/email/http";
import { createEnquiryReference } from "@/lib/server/email/reference";
import { sendEnquiryEmails } from "@/lib/server/email/service";
import { rateLimit } from "@/lib/server/rateLimit";
import { getRequestIp, getUserAgent, isSameOriginRequest } from "@/lib/server/requestMeta";
import {
  recallSubmission,
  rememberSubmission,
  submissionFingerprint,
} from "@/lib/server/submissionGuard";
import { isRecord } from "@/lib/validation";

const MAX_REQUESTS_PER_HOUR = 5;

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

  // Honeypot: real users never fill a hidden field.
  if (
    isRecord(payload) &&
    String((payload as Record<string, unknown>).companyWebsite ?? "").trim().length > 0
  ) {
    return NextResponse.json({ ok: true }, { status: 200 });
  }

  const ip = getRequestIp(req);
  const userAgent = getUserAgent(req);

  // The key comes from `requestMeta`, which walks the forwarded chain back by
  // TRUSTED_PROXY_HOPS. A forged X-Forwarded-For therefore cannot hand a caller
  // a fresh bucket.
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

  const message = validation.data;
  const fingerprint = submissionFingerprint([
    "contact",
    message.name,
    message.email,
    message.company,
    message.message,
  ]);

  // An identical body means the browser replayed the POST and the first copy
  // already reached the team, so this one answers with that same success
  // instead of sending a second email.
  const alreadyAccepted = recallSubmission(fingerprint);
  if (alreadyAccepted) {
    return NextResponse.json({ ok: true, reference: alreadyAccepted }, { status: 200 });
  }

  const submittedAt = new Date();
  const reference = createEnquiryReference(submittedAt);

  let delivery;
  try {
    delivery = await sendEnquiryEmails({
      enquiry: buildContactEnquiry({ message, reference, submittedAt }),
    });
  } catch (error) {
    return emailFailureResponse(error);
  }

  // Recorded only after the provider accepted the notification, so a failure
  // above leaves the visitor free to correct the form and send again.
  rememberSubmission(fingerprint, reference);

  return NextResponse.json(
    { ok: true, reference, acknowledged: delivery.acknowledgement === "sent" },
    { status: 200 }
  );
}
