import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Contact from "@/components/Contact";
import { createMetadata } from "@/lib/site";

export const metadata: Metadata = createMetadata({
  title: "Contact",
  description:
    "Talk to GGI Tech about the platform you need to build. Send us a message and we will respond with a clear next step.",
  path: "/contact",
  keywords: ["contact GGI Tech", "software project enquiry", "Lagos software company"],
});

export default function ContactPage() {
  return (
    <main id="main" className="min-h-screen bg-background text-white">
      <Navbar />
      <Contact headingLevel="h1" />
      <Footer />
    </main>
  );
}
