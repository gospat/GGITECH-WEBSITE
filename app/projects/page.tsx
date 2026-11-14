import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CheckCircle } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Illustration from "@/components/Illustration";
import { capabilities } from "@/lib/content/capabilities";
import { createMetadata } from "@/lib/site";

export const metadata: Metadata = createMetadata({
  title: "Capabilities",
  description:
    "The systems GGI Tech engineers: institutional platforms, payment infrastructure, healthcare platforms, and blockchain infrastructure — and the engineering approach behind each.",
  path: "/projects",
  keywords: [
    "institutional platforms",
    "payment infrastructure",
    "healthcare platforms",
    "blockchain infrastructure",
  ],
});

export default function CapabilitiesPage() {
  return (
    <main id="main" className="min-h-screen bg-background text-white">
      <Navbar />

      <div className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <header className="text-center mb-20">
          <p className="text-sm font-semibold text-primary tracking-widest uppercase mb-4">
            Capability Areas
          </p>
          <h1 className="text-4xl md:text-6xl font-bold mb-6 text-balance">What We Build</h1>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto">
            Each area below describes the class of system we engineer and the principles we apply to
            it. These are statements of our engineering method, not client case studies.
          </p>
        </header>

        <div className="space-y-24">
          {capabilities.map((capability, index) => (
            <section
              key={capability.slug}
              className={`flex flex-col gap-16 items-center ${
                index % 2 === 1 ? "lg:flex-row-reverse" : "lg:flex-row"
              }`}
            >
              <div className="flex-1">
                <h2 className="text-3xl md:text-4xl font-bold mb-6">{capability.title}</h2>
                <p className="text-gray-400 text-lg leading-relaxed mb-8">{capability.summary}</p>

                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                  {capability.approach.map((item) => (
                    <li key={item} className="flex items-start text-gray-300 leading-relaxed">
                      <CheckCircle
                        className="w-5 h-5 text-primary mr-3 flex-shrink-0 mt-0.5"
                        aria-hidden="true"
                      />
                      {item}
                    </li>
                  ))}
                </ul>

                <Link
                  href={`/projects/${capability.slug}`}
                  className="inline-flex items-center text-sm font-medium text-white hover:text-primary transition-colors"
                >
                  Explore this capability
                  <ArrowRight className="w-4 h-4 ml-2" aria-hidden="true" />
                </Link>
              </div>

              <div className="flex-1 w-full">
                <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5">
                  <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-emerald-400/10 opacity-70" />
                  <Illustration
                    src={capability.image}
                    alt={capability.imageAlt}
                    className="w-full h-auto object-cover"
                    sizes="(max-width: 1024px) 100vw, 560px"
                  />
                </div>
              </div>
            </section>
          ))}
        </div>

        <div className="mt-32 text-center bg-white/5 border border-white/10 rounded-3xl p-12">
          <h2 className="text-3xl font-bold mb-6">Ready to Build Something Extraordinary?</h2>
          <p className="text-gray-400 max-w-2xl mx-auto mb-8">
            Whether you are building a new platform, modernising existing infrastructure, or
            exploring emerging technologies, our team can help turn the vision into a working
            system.
          </p>
          <Link
            href="/project-brief"
            className="inline-flex items-center justify-center px-8 py-3.5 text-base font-medium text-white bg-primary rounded-full hover:bg-blue-600 transition-all duration-300"
          >
            Submit a Project Brief
            <ArrowRight className="w-4 h-4 ml-2" aria-hidden="true" />
          </Link>
        </div>
      </div>

      <Footer />
    </main>
  );
}
