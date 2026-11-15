import type { Metadata } from "next";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { contactEmail, createMetadata } from "@/lib/site";

export const metadata: Metadata = createMetadata({
  title: "Privacy Policy",
  description:
    "How GOSPAT Global Innovations Ltd (GGI Tech) collects, uses, discloses, and protects personal information on this website and through our forms.",
  path: "/privacy",
});

export default function PrivacyPage() {
  return (
    <main id="main" className="min-h-screen bg-background text-white">
      <Navbar />

      <div className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto prose prose-invert">
        <h1 className="text-4xl md:text-5xl font-bold mb-8 text-center">Privacy Policy</h1>
        <p className="text-gray-400 text-center mb-12">Effective Date: May 31, 2026</p>

        <div className="space-y-8 text-gray-300 leading-relaxed">
          <p>
            GOSPAT Global Innovations Ltd (“Company”, “we”, “our”, or “us”), operating its
            technology brand as GGI Tech, respects your privacy and is committed to protecting
            personal information. This Privacy Policy explains how we collect, use, disclose, and
            protect information when you visit our website and use our forms and related online
            experiences (collectively, the “Site”).
          </p>

          <p>
            This document is provided for general informational purposes and does not constitute
            legal advice. You should consult qualified legal counsel to confirm that this policy
            meets your specific legal and regulatory obligations.
          </p>

          <h2 className="text-2xl font-bold text-white mt-12 mb-4">1. Information We Collect</h2>
          <p>
            We may collect information you provide directly to us, such as when you contact us or
            submit a project brief. Depending on the form, this may include:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Name and business name</li>
            <li>Email address and phone number</li>
            <li>
              Project requirements and preferences (pages, features, timelines, budget ranges)
            </li>
            <li>Messages you submit via forms</li>
          </ul>
          <p className="mt-4">
            We may also collect certain information automatically, including device and browser
            information, approximate location (derived from IP), and usage data to improve
            performance and security.
          </p>

          <h2 className="text-2xl font-bold text-white mt-12 mb-4">
            2. Cookies and Similar Technologies
          </h2>
          <p>
            We use cookies and similar technologies to provide core website functionality and
            improve user experience. Where applicable, we provide cookie settings that allow you to
            manage preferences.
          </p>
          <p>
            Cookies may be used for essential functionality (such as remembering preferences) and,
            if enabled, analytics to understand site usage. You can adjust cookie settings using the
            Site controls and/or your browser settings.
          </p>

          <h2 className="text-2xl font-bold text-white mt-12 mb-4">3. How We Use Information</h2>
          <p>We may use the information we collect for the following purposes:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Respond to inquiries and provide requested information</li>
            <li>Review and evaluate project requirements and prepare proposals or scopes</li>
            <li>Send submission confirmations and operational communications</li>
            <li>Improve Site performance, usability, and content quality</li>
            <li>Maintain security, prevent abuse, and protect our systems and users</li>
          </ul>
          <p className="mt-4">We do not sell personal information.</p>

          <h2 className="text-2xl font-bold text-white mt-12 mb-4">
            4. Legal Bases (Where Applicable)
          </h2>
          <p>
            Depending on your jurisdiction, our legal bases for processing may include: your consent
            (for certain cookies or communications), performance of a contract or pre-contract steps
            (responding to your request), compliance with legal obligations, and our legitimate
            interests (such as site security and service improvement).
          </p>

          <h2 className="text-2xl font-bold text-white mt-12 mb-4">5. How We Share Information</h2>
          <p>
            We may share information with service providers who help us operate the Site and
            communicate with you, such as email delivery providers, hosting providers, and security
            tooling. These providers are authorized to process personal information only as
            necessary to provide services to us.
          </p>
          <p>
            If payments are introduced in the future, we may share payment-related details with
            payment processors as necessary to process transactions. We will not store full card
            details on our systems where a processor is used.
          </p>

          <h2 className="text-2xl font-bold text-white mt-12 mb-4">
            6. International Data Transfers
          </h2>
          <p>
            We may process and store information in countries other than your own. Where required by
            law, we take steps to ensure appropriate safeguards are in place for cross-border
            transfers.
          </p>

          <h2 className="text-2xl font-bold text-white mt-12 mb-4">7. Data Retention</h2>
          <p>
            We retain personal information for as long as necessary to fulfill the purposes
            described in this policy, including responding to requests, maintaining business
            records, resolving disputes, and enforcing agreements. Retention periods may vary based
            on the type of data and applicable legal requirements.
          </p>

          <h2 className="text-2xl font-bold text-white mt-12 mb-4">8. Data Security</h2>
          <p>
            We implement appropriate technical and organizational measures designed to protect
            personal data from unauthorized access, misuse, disclosure, alteration, or destruction.
            However, no method of transmission or storage is completely secure, and we cannot
            guarantee absolute security.
          </p>

          <h2 className="text-2xl font-bold text-white mt-12 mb-4">
            9. Your Rights and Choices (Global)
          </h2>
          <p>
            Depending on where you live and the nature of our relationship with you, you may have
            rights regarding your personal information. These rights can include requesting access
            to information we hold about you, asking us to correct inaccurate information,
            requesting deletion (where allowed), and objecting to or restricting certain processing.
          </p>
          <p>You can also manage certain choices directly:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>
              Cookie preferences: use the Site’s cookie settings controls (where available) and your
              browser settings.
            </li>
            <li>
              Emails: you can request we stop sending non-essential communications by contacting us.
            </li>
          </ul>
          <p className="mt-4">
            To exercise applicable rights, contact us using the details in the “Contact” section. We
            may need to verify your identity before responding and may ask for additional
            information to help us locate the relevant data.
          </p>

          <h2 className="text-2xl font-bold text-white mt-12 mb-4">
            10. European Economic Area & United Kingdom (GDPR / UK GDPR)
          </h2>
          <p>
            If you are located in the EEA or UK, the Company acts as a data controller for personal
            data processed in connection with the Site. Where required, we rely on lawful bases such
            as your consent (for certain cookies and communications), performance of a contract or
            taking steps at your request prior to entering into a contract (responding to inquiries
            and briefs), compliance with legal obligations, and legitimate interests (including
            operating, securing, and improving the Site).
          </p>
          <p>
            Subject to applicable law, you may have the right to request: access, rectification,
            erasure, restriction, portability, and to object to processing (including certain direct
            marketing). Where processing is based on consent, you may withdraw consent at any time
            without affecting the lawfulness of processing before withdrawal.
          </p>
          <p>
            You also have the right to lodge a complaint with your local supervisory authority. If
            you would like the relevant authority contact details, contact us.
          </p>
          <p>
            For international transfers, we may rely on recognized safeguards such as adequacy
            decisions, Standard Contractual Clauses (SCCs), and/or the UK International Data
            Transfer Agreement (IDTA), as applicable.
          </p>

          <h2 className="text-2xl font-bold text-white mt-12 mb-4">
            11. Nigeria (NDPR and Related Requirements)
          </h2>
          <p>
            If you are located in Nigeria, we process personal data in line with applicable Nigerian
            data protection requirements, including the Nigeria Data Protection Regulation (NDPR)
            and related guidance. Where relevant, our processing is grounded in lawful purposes such
            as consent, contractual necessity, legal obligations, and legitimate interests
            (including cybersecurity and fraud prevention).
          </p>

          <h2 className="text-2xl font-bold text-white mt-12 mb-4">
            12. California Privacy Notice (CCPA / CPRA)
          </h2>
          <p>
            This section applies only to California residents where the California Consumer Privacy
            Act, as amended by the California Privacy Rights Act (CCPA/CPRA), applies. For purposes
            of this notice, “personal information” has the meaning defined by the CCPA/CPRA.
          </p>
          <p>
            In the last 12 months, we may have collected the following categories of personal
            information (depending on how you use the Site): identifiers (such as name and email),
            commercial or professional information (such as business name and project requirements),
            and internet or network activity information (such as device and usage data). We collect
            this information from you, automatically from your device/browser, and from service
            providers that help us operate the Site.
          </p>
          <p>
            We use personal information for purposes described in this Privacy Policy, including
            responding to requests, evaluating project briefs, operating and securing the Site, and
            improving content and performance. We may disclose personal information to service
            providers for these purposes.
          </p>
          <p>
            We do not sell personal information. We also do not share personal information for
            cross-context behavioral advertising. If we introduce advertising or analytics
            arrangements that would be considered a “sale” or “share” under applicable law, we will
            update this policy and provide appropriate opt-out mechanisms.
          </p>
          <p>
            Subject to applicable law, California residents may have rights to: know/access, delete,
            correct, opt out of sale/sharing, and limit the use/disclosure of sensitive personal
            information (if applicable). We will not discriminate against you for exercising your
            rights.
          </p>
          <p>
            To submit a request, use our{" "}
            <Link href="/contact" className="text-primary hover:text-white">
              contact form
            </Link>
            {contactEmail ? (
              <>
                {" "}
                or email <strong>{contactEmail}</strong>
              </>
            ) : null}
            . We may need to verify your identity before fulfilling requests. You may also designate
            an authorized agent to make a request on your behalf, subject to verification and proof
            of authorization.
          </p>

          <h2 className="text-2xl font-bold text-white mt-12 mb-4">13. Children’s Privacy</h2>
          <p>
            The Site is not directed to children, and we do not knowingly collect personal
            information from children. If you believe a child has provided us personal information,
            contact us and we will take steps to delete it.
          </p>

          <h2 className="text-2xl font-bold text-white mt-12 mb-4">14. Third-Party Links</h2>
          <p>
            The Site may contain links to third-party websites. We are not responsible for the
            privacy practices of third-party sites. We encourage you to review their privacy
            policies.
          </p>

          <h2 className="text-2xl font-bold text-white mt-12 mb-4">
            15. Changes to This Privacy Policy
          </h2>
          <p>
            We may update this Privacy Policy from time to time. The “Effective Date” above
            indicates when it was last updated. Continued use of the Site after changes become
            effective means you accept the updated policy.
          </p>

          <h2 className="text-2xl font-bold text-white mt-12 mb-4">16. Contact</h2>
          <p>
            For privacy-related questions or requests, use our{" "}
            <Link href="/contact" className="text-primary hover:text-white">
              contact form
            </Link>
            {contactEmail ? (
              <>
                {" "}
                or email <strong>{contactEmail}</strong>
              </>
            ) : null}
            .
          </p>
        </div>
      </div>

      <Footer />
    </main>
  );
}
