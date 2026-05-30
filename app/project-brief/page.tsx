import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ProjectBriefForm from "@/components/ProjectBriefForm";

export default function ProjectBriefPage() {
  return (
    <main className="min-h-screen bg-background text-white">
      <Navbar />

      <div className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">Website Project Brief</h1>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto">
            To ensure we build exactly what you need, please fill out this form with as much detail as possible. After
            submission, you will receive an email confirmation and our team will receive a structured PDF brief.
          </p>
        </div>

        <ProjectBriefForm />
      </div>

      <Footer />
    </main>
  );
}

