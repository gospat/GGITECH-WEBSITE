import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import type { ProjectBriefSubmission } from "@/lib/projectBrief";

type PdfBuildInput = {
  submission: ProjectBriefSubmission;
  submittedAtISO: string;
  sourceIp?: string;
  userAgent?: string;
};

function yesNoLabel(value: "yes" | "no"): string {
  return value === "yes" ? "Yes" : "No";
}

function boolLabel(value: boolean): string {
  return value ? "Yes" : "No";
}

function sanitizeLine(value: string): string {
  return value.replace(/\r/g, "").trim();
}

function bulletList(items: { label: string; value: string }[]): string[] {
  return items
    .map((i) => `${i.label}: ${sanitizeLine(i.value || "-")}`)
    .filter(Boolean);
}

export async function buildProjectBriefPdf(input: PdfBuildInput): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const pageSize: [number, number] = [595.28, 841.89];
  let page = pdfDoc.addPage(pageSize);

  const marginX = 50;
  const marginTop = 60;
  const marginBottom = 60;
  const maxWidth = pageSize[0] - marginX * 2;

  let y = pageSize[1] - marginTop;

  const colorText = rgb(0.94, 0.94, 0.96);
  const colorMuted = rgb(0.74, 0.74, 0.78);
  const colorAccent = rgb(0.23, 0.51, 0.96);

  const titleSize = 18;
  const headingSize = 12.5;
  const bodySize = 10.5;
  const lineGap = 4;

  const ensureSpace = (minNeeded: number) => {
    if (y - minNeeded >= marginBottom) return;
    page = pdfDoc.addPage(pageSize);
    y = pageSize[1] - marginTop;
  };

  const drawWrappedText = (text: string, opts: { bold?: boolean; size?: number; color?: ReturnType<typeof rgb> }) => {
    const size = opts.size ?? bodySize;
    const usedFont = opts.bold ? fontBold : font;
    const color = opts.color ?? colorText;

    const paragraphs = text.split("\n");
    for (const p of paragraphs) {
      const paragraph = sanitizeLine(p);
      if (!paragraph) {
        y -= size + lineGap;
        continue;
      }

      const words = paragraph.split(/\s+/);
      let line = "";

      for (const word of words) {
        const next = line ? `${line} ${word}` : word;
        const width = usedFont.widthOfTextAtSize(next, size);
        if (width <= maxWidth) {
          line = next;
          continue;
        }

        ensureSpace(size + lineGap);
        page.drawText(line, { x: marginX, y, size, font: usedFont, color });
        y -= size + lineGap;
        line = word;
      }

      if (line) {
        ensureSpace(size + lineGap);
        page.drawText(line, { x: marginX, y, size, font: usedFont, color });
        y -= size + lineGap;
      }

      y -= 2;
    }
  };

  const drawHeading = (heading: string) => {
    ensureSpace(headingSize + 14);
    y -= 6;
    page.drawText(heading, { x: marginX, y, size: headingSize, font: fontBold, color: colorAccent });
    y -= headingSize + 8;
  };

  const { submission } = input;

  page.drawText("WEBSITE PROJECT BRIEF / REQUIREMENT FORM", {
    x: marginX,
    y,
    size: titleSize,
    font: fontBold,
    color: colorText,
  });
  y -= titleSize + 10;

  page.drawText(`Submitted: ${input.submittedAtISO}`, {
    x: marginX,
    y,
    size: 9.5,
    font,
    color: colorMuted,
  });
  y -= 18;

  drawWrappedText(
    "Thank you for your time. This document summarizes the information provided and will be used to guide the discovery and development process.",
    { size: bodySize, color: colorMuted }
  );
  y -= 8;

  drawHeading("1. BUSINESS INFORMATION");
  drawWrappedText(
    bulletList([
      { label: "Business Name", value: submission.business.businessName },
      { label: "Business Description", value: submission.business.businessDescription },
      { label: "Target Audience", value: submission.business.targetAudience },
      { label: "Location", value: submission.business.location },
    ]).join("\n"),
    { size: bodySize }
  );

  drawHeading("2. PROJECT GOAL");
  drawWrappedText(
    bulletList([
      { label: "Main Purpose", value: submission.goals.mainPurpose },
      { label: "Desired User Actions", value: submission.goals.desiredUserActions },
    ]).join("\n"),
    { size: bodySize }
  );

  drawHeading("3. WEBSITE FEATURES");
  const features = submission.features;
  drawWrappedText(
    [
      `Contact Form: ${boolLabel(features.contactForm)}`,
      `User Registration/Login: ${boolLabel(features.userAuth)}`,
      `Admin Dashboard: ${boolLabel(features.adminDashboard)}`,
      `Payment Integration: ${boolLabel(features.paymentIntegration)}`,
      `Blog/News Section: ${boolLabel(features.blogNews)}`,
      `Booking System: ${boolLabel(features.bookingSystem)}`,
      `Chat System: ${boolLabel(features.chatSystem)}`,
      `Analytics/Tracking: ${boolLabel(features.analyticsTracking)}`,
      `SEO Setup: ${boolLabel(features.seoSetup)}`,
      `Multilingual: ${boolLabel(features.multilingual)}`,
      `Other: ${features.other || "-"}`,
    ].join("\n"),
    { size: bodySize }
  );

  drawHeading("4. PAGES REQUIRED");
  drawWrappedText(submission.pagesRequired || "-", { size: bodySize });

  drawHeading("5. DESIGN PREFERENCES");
  drawWrappedText(
    bulletList([
      { label: "Color Scheme", value: submission.design.colorScheme || "-" },
      { label: "Logo Available", value: yesNoLabel(submission.design.hasLogo) },
      { label: "Preferred Style", value: submission.design.preferredStyle || "-" },
      { label: "Accessibility Priority", value: yesNoLabel(submission.design.accessibilityPriority) },
      {
        label: "Reference Websites",
        value: submission.design.referenceWebsites.length > 0 ? submission.design.referenceWebsites.join(", ") : "-",
      },
    ]).join("\n"),
    { size: bodySize }
  );

  drawHeading("6. CONTENT");
  drawWrappedText(
    bulletList([
      { label: "Will Provide Text Content", value: yesNoLabel(submission.content.provideText) },
      { label: "Will Provide Images/Videos", value: yesNoLabel(submission.content.provideMedia) },
      { label: "Needs Help Creating Content", value: yesNoLabel(submission.content.needContentHelp) },
    ]).join("\n"),
    { size: bodySize }
  );

  drawHeading("7. DOMAIN & HOSTING");
  drawWrappedText(
    bulletList([
      { label: "Already Has Domain", value: yesNoLabel(submission.domainHosting.hasDomain) },
      { label: "Domain Details", value: submission.domainHosting.domainDetails || "-" },
      { label: "Needs Hosting Help", value: yesNoLabel(submission.domainHosting.needHostingHelp) },
    ]).join("\n"),
    { size: bodySize }
  );

  drawHeading("8. TIMELINE");
  drawWrappedText(submission.timeline || "-", { size: bodySize });

  drawHeading("9. BUDGET");
  drawWrappedText(submission.budget || "-", { size: bodySize });

  drawHeading("10. ADDITIONAL NOTES");
  drawWrappedText(submission.additionalNotes || "-", { size: bodySize });

  drawHeading("CONTACT");
  drawWrappedText(
    bulletList([
      { label: "Client Name", value: submission.contact.clientName },
      { label: "Email", value: submission.contact.email },
      { label: "Phone", value: submission.contact.phone || "-" },
      { label: "Preferred Contact Method", value: submission.contact.preferredContactMethod },
    ]).join("\n"),
    { size: bodySize }
  );

  ensureSpace(18);
  y -= 8;
  page.drawText("Internal Metadata", { x: marginX, y, size: 10, font: fontBold, color: colorMuted });
  y -= 14;
  drawWrappedText(
    bulletList([
      { label: "Source IP", value: input.sourceIp || "-" },
      { label: "User Agent", value: input.userAgent || "-" },
    ]).join("\n"),
    { size: 9.5, color: colorMuted }
  );

  return pdfDoc.save();
}

