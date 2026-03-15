import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-background text-white">
      <Navbar />
      
      <div className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto prose prose-invert">
        <h1 className="text-4xl md:text-5xl font-bold mb-8 text-center">Terms of Service</h1>
        <p className="text-gray-400 text-center mb-12">Effective Date: March 15, 2026</p>
        
        <div className="space-y-8 text-gray-300 leading-relaxed">
          <p>
            Welcome to the website of GOSPAT GLOBAL INNOVATIONS LTD (“Company”, “we”, “our”, or “us”). By accessing or using our website, you agree to comply with and be bound by the following Terms of Service.
          </p>

          <h2 className="text-2xl font-bold text-white mt-12 mb-4">Use of the Website</h2>
          <p>
            The content provided on this website is for informational purposes only. Users agree to use the website in a lawful manner and not engage in any activity that may damage, disrupt, or interfere with the website or its services.
          </p>
          <p>
            Unauthorized use of the website, including attempts to gain unauthorized access to systems, servers, or data associated with the website, is strictly prohibited.
          </p>

          <h2 className="text-2xl font-bold text-white mt-12 mb-4">Intellectual Property</h2>
          <p>
            All content on this website, including text, graphics, logos, and software, is the property of GOSPAT GLOBAL INNOVATIONS LTD unless otherwise stated. Unauthorized reproduction, distribution, or modification of any content is prohibited without prior written permission.
          </p>

          <h2 className="text-2xl font-bold text-white mt-12 mb-4">Limitation of Liability</h2>
          <p>
            While we strive to ensure the accuracy and reliability of the information on this website, we make no guarantees regarding completeness or accuracy. The company shall not be held liable for any damages arising from the use or inability to use this website.
          </p>

          <h2 className="text-2xl font-bold text-white mt-12 mb-4">Third-Party Links</h2>
          <p>
            This website may contain links to external websites. We are not responsible for the content, policies, or practices of third-party websites.
          </p>

          <h2 className="text-2xl font-bold text-white mt-12 mb-4">Changes to the Terms</h2>
          <p>
            We reserve the right to modify or update these Terms of Service at any time. Continued use of the website after changes have been made indicates acceptance of the updated terms.
          </p>
        </div>
      </div>
      
      <Footer />
    </main>
  );
}
