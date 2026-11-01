import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ProjectBriefForm from "@/components/ProjectBriefForm";
import Illustration from "@/components/Illustration";
import { createMetadata } from "@/lib/site";

export const metadata: Metadata = createMetadata({
  title: "Project Brief",
  description:
    "Submit a structured project brief to GGI Tech. Tell us about the platform you need and receive an email confirmation with our team briefed on your requirements.",
  path: "/project-brief",
  keywords: ["project brief", "request a quote", "software project enquiry"],
});

export default function ProjectBriefPage() {
  return (
    <main id="main" className="min-h-screen bg-background text-white">
      <Navbar />

      <div className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">Website Project Brief</h1>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto">
            To ensure we build exactly what you need, please fill out this form with as much detail
            as possible. After submission, you will receive an email confirmation and our team will
            receive a structured PDF brief.
          </p>
        </div>

        <div className="mb-12 overflow-hidden rounded-2xl border border-white/10 bg-white/5">
          <Illustration
            src="/images/illustrations/project-brief-hero.jpg"
            alt="Illustration representing a structured project brief and requirement gathering process"
            className="w-full h-auto object-cover"
            sizes="(max-width: 1024px) 100vw, 1024px"
          />
        </div>

        <ProjectBriefForm />
      </div>

      <Footer />
    </main>
  );
}
