import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-background text-white">
      <Navbar />
      
      <div className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto prose prose-invert">
        <h1 className="text-4xl md:text-5xl font-bold mb-8 text-center">Terms of Service</h1>
        <p className="text-gray-400 text-center mb-12">Effective Date: May 31, 2026</p>
        
        <div className="space-y-8 text-gray-300 leading-relaxed">
          <p>
            Welcome to the website of GOSPAT GLOBAL INNOVATIONS LTD (“Company”, “we”, “our”, or “us”), operating its
            technology brand as GGI Tech (“GGI Tech”). These Terms of Service (“Terms”) govern your access to and use of
            our website, forms, and related online experiences (collectively, the “Site”).
          </p>

          <p>
            By using the Site, you agree to these Terms. If you do not agree, do not use the Site.
          </p>

          <p>
            This document is provided for general informational purposes and does not constitute legal advice. You should
            consult qualified legal counsel to confirm that these Terms meet your specific legal, regulatory, and business
            requirements.
          </p>

          <h2 className="text-2xl font-bold text-white mt-12 mb-4">1. Who May Use the Site</h2>
          <p>
            You may use the Site only if you are capable of forming a binding contract in your jurisdiction and are not
            prohibited from using the Site under applicable law. If you are using the Site on behalf of an organization,
            you represent that you have the authority to bind that organization to these Terms.
          </p>

          <h2 className="text-2xl font-bold text-white mt-12 mb-4">2. Purpose of the Site</h2>
          <p>
            The Site provides information about our services and enables you to contact us, submit project requirements,
            or request consultations. The Site itself is not a marketplace, and we do not guarantee that any inquiry will
            result in a project engagement.
          </p>

          <h2 className="text-2xl font-bold text-white mt-12 mb-4">3. Project Brief / Requirement Submissions</h2>
          <p>
            If you submit information through a contact form, a project brief form, or other submission method, you agree
            to provide accurate, current, and complete information. You understand that:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Submissions are used to evaluate and scope potential work and to respond to your request.</li>
            <li>Submitting a brief does not create a binding agreement to deliver services.</li>
            <li>We may follow up using the contact details you provide.</li>
          </ul>

          <h2 className="text-2xl font-bold text-white mt-12 mb-4">4. Communications</h2>
          <p>
            By submitting your contact information, you authorize us to contact you regarding your inquiry. We may send
            confirmation emails when you submit forms. You can request that we stop contacting you at any time by using
            the contact information provided below.
          </p>

          <h2 className="text-2xl font-bold text-white mt-12 mb-4">5. Acceptable Use</h2>
          <p>You agree not to misuse the Site. Without limitation, you agree not to:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Access or attempt to access non-public systems, accounts, or data.</li>
            <li>Probe, scan, or test the vulnerability of the Site or related systems.</li>
            <li>Interfere with or disrupt the integrity or performance of the Site (including via automated traffic).</li>
            <li>Upload, transmit, or submit malicious code, or content that is unlawful or infringes rights.</li>
            <li>Use the Site to send spam, unsolicited messages, or deceptive communications.</li>
          </ul>

          <h2 className="text-2xl font-bold text-white mt-12 mb-4">6. Intellectual Property</h2>
          <p>
            The Site and its content, including text, graphics, logos, interfaces, and software, are owned by the Company
            or its licensors and are protected by applicable intellectual property laws. You may view and use the Site
            for your internal, non-commercial purposes. Any other use requires our prior written permission.
          </p>

          <h2 className="text-2xl font-bold text-white mt-12 mb-4">7. Service Engagements and Statements of Work</h2>
          <p>
            If we agree to provide services to you, the commercial terms (including scope, deliverables, timeline, and
            fees) will be set out in a separate written agreement, proposal, or statement of work (“SOW”). In the event
            of a conflict between these Terms and an executed SOW, the SOW will control for that engagement.
          </p>

          <h2 className="text-2xl font-bold text-white mt-12 mb-4">8. Payments (If Applicable)</h2>
          <p>
            Some engagements may involve payments, invoicing, deposits, subscription fees, or third-party payment
            processors. If payments are applicable, the relevant payment terms will be specified in your proposal or
            SOW. We are not responsible for third-party payment processors and their systems, availability, or policies.
          </p>

          <h2 className="text-2xl font-bold text-white mt-12 mb-4">9. Disclaimers</h2>
          <p>
            The Site is provided on an “as is” and “as available” basis. While we strive for accuracy and reliability, we
            do not warrant that the Site will be uninterrupted, error-free, secure, or free of harmful components, or
            that content is complete or current. Your use of the Site is at your own risk.
          </p>

          <h2 className="text-2xl font-bold text-white mt-12 mb-4">10. Limitation of Liability</h2>
          <p>
            To the maximum extent permitted by law, the Company and its directors, officers, employees, contractors, and
            agents will not be liable for any indirect, incidental, consequential, special, exemplary, or punitive
            damages, or any loss of profits, revenue, data, or goodwill, arising out of or related to your use of (or
            inability to use) the Site.
          </p>

          <h2 className="text-2xl font-bold text-white mt-12 mb-4">11. Indemnity</h2>
          <p>
            You agree to indemnify and hold harmless the Company from and against any claims, liabilities, damages,
            losses, and expenses (including reasonable legal fees) arising out of or related to your misuse of the Site,
            your violation of these Terms, or your infringement of any rights of a third party.
          </p>

          <h2 className="text-2xl font-bold text-white mt-12 mb-4">12. Third-Party Links and Services</h2>
          <p>
            The Site may link to third-party websites or services. We do not control and are not responsible for third
            parties’ content, policies, or practices. Your interactions with third-party services are governed by their
            own terms and privacy policies.
          </p>

          <h2 className="text-2xl font-bold text-white mt-12 mb-4">13. Changes to the Site and Terms</h2>
          <p>
            We may update the Site or these Terms from time to time. The “Effective Date” above indicates when these
            Terms were last updated. By continuing to use the Site after changes become effective, you accept the
            revised Terms.
          </p>

          <h2 className="text-2xl font-bold text-white mt-12 mb-4">14. Governing Law</h2>
          <p>
            These Terms will be governed by and interpreted in accordance with the laws applicable to the Company,
            without regard to conflict of law principles, except where mandatory laws of your jurisdiction apply.
          </p>

          <h2 className="text-2xl font-bold text-white mt-12 mb-4">15. Regional Disclosures and Mandatory Rights</h2>
          <p>
            Some jurisdictions provide consumers and business users with rights and protections that cannot be waived by
            contract. Nothing in these Terms is intended to exclude, restrict, or modify rights that are mandatory under
            applicable law.
          </p>
          <p>
            If you are located in the European Economic Area or the United Kingdom, mandatory consumer protection laws
            may grant you additional rights. If you are located in the United States, some states may provide specific
            protections for consumers and online services. If you are located in Nigeria, mandatory statutory rights may
            also apply. Where there is a conflict between these Terms and non-waivable legal rights, those rights will
            prevail to the extent of the conflict.
          </p>
          <p>
            Privacy and data protection terms are addressed in our Privacy Policy. If you submit information through the
            Site, you acknowledge that our handling of that information is governed by the Privacy Policy, in addition
            to these Terms.
          </p>

          <h2 className="text-2xl font-bold text-white mt-12 mb-4">16. Severability and Interpretation</h2>
          <p>
            If any provision of these Terms is found to be unlawful, void, or unenforceable, that provision will be
            deemed severable and will not affect the validity and enforceability of the remaining provisions. Headings
            are for convenience only and do not affect interpretation.
          </p>

          <h2 className="text-2xl font-bold text-white mt-12 mb-4">17. Contact</h2>
          <p>
            Questions about these Terms can be sent to: <strong>contact@ggitech.dev</strong>
          </p>
        </div>
      </div>
      
      <Footer />
    </main>
  );
}
