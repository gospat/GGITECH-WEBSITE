import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-background text-white">
      <Navbar />
      
      <div className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto prose prose-invert">
        <h1 className="text-4xl md:text-5xl font-bold mb-8 text-center">Privacy Policy</h1>
        <p className="text-gray-400 text-center mb-12">Effective Date: March 15, 2026</p>
        
        <div className="space-y-8 text-gray-300 leading-relaxed">
          <p>
            GOSPAT GLOBAL INNOVATIONS LTD respects the privacy of visitors to our website and is committed to protecting personal information.
          </p>

          <h2 className="text-2xl font-bold text-white mt-12 mb-4">Information We Collect</h2>
          <p>
            We may collect information that users voluntarily provide when contacting us, such as:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Name</li>
            <li>Email address</li>
            <li>Contact information</li>
            <li>Messages submitted through contact forms</li>
          </ul>
          <p className="mt-4">
            We may also collect non-personal information such as browser type, device information, and usage data to improve website performance.
          </p>

          <h2 className="text-2xl font-bold text-white mt-12 mb-4">How We Use Information</h2>
          <p>
            Information collected may be used to:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Respond to inquiries</li>
            <li>Improve website functionality and user experience</li>
            <li>Communicate with users regarding services or updates</li>
            <li>Maintain website security</li>
          </ul>
          <p className="mt-4">
            We do not sell or rent personal information to third parties.
          </p>

          <h2 className="text-2xl font-bold text-white mt-12 mb-4">Data Security</h2>
          <p>
            We implement appropriate technical and organizational measures to protect personal data from unauthorized access, misuse, or disclosure.
          </p>

          <h2 className="text-2xl font-bold text-white mt-12 mb-4">Cookies</h2>
          <p>
            Our website may use cookies or similar technologies to improve functionality and user experience.
          </p>

          <h2 className="text-2xl font-bold text-white mt-12 mb-4">Changes to the Privacy Policy</h2>
          <p>
            We reserve the right to update this Privacy Policy when necessary. Updates will be reflected on this page.
          </p>
        </div>
      </div>
      
      <Footer />
    </main>
  );
}
