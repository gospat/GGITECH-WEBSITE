import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SpotlightCard from "@/components/SpotlightCard";
import {
  CloudViz,
  SoftwareDevViz,
  SystemArchViz,
  Web3Viz,
} from "@/components/ServiceVisualizations";
import Illustration from "@/components/Illustration";
import { deliveryProcess, services } from "@/lib/content/services";
import { createMetadata } from "@/lib/site";

export const metadata: Metadata = createMetadata({
  title: "Services",
  description:
    "Software engineering, system architecture, blockchain, institutional systems, cloud and DevOps, and security engineering — the services GGI Tech delivers for institutions and businesses.",
  path: "/services",
  keywords: [
    "software engineering services",
    "system architecture",
    "cloud devops",
    "security engineering",
    "institutional systems",
  ],
});

/** A dedicated animation exists for four services; the rest render their own mark. */
const visualBySlug: Record<string, ReactNode> = {
  "software-engineering": <SoftwareDevViz />,
  "system-architecture": <SystemArchViz />,
  "blockchain-web3": <Web3Viz />,
  "cloud-devops": <CloudViz />,
};

export default function ServicesPage() {
  return (
    <main id="main" className="min-h-screen bg-background text-white">
      <Navbar />

      <div className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <header className="text-center mb-20">
          <h1 className="text-4xl md:text-6xl font-bold mb-6 text-balance">Our Services</h1>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto">
            At GGI Tech, we design and build powerful digital platforms tailored to the needs of
            modern organisations. Every system we deliver is engineered for reliability, security,
            and scalability—so it keeps working as your user base and operational complexity grow.
          </p>
        </header>

        <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 mb-24">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-emerald-400/10 opacity-70" />
          <Illustration
            src="/images/illustrations/services-hero.jpg"
            alt="Illustration representing GGI Tech services across architecture, cloud, security, and digital systems"
            className="w-full h-auto object-cover"
            priority
            sizes="(max-width: 1024px) 100vw, 1120px"
          />
        </div>

        <div className="space-y-32">
          {services.map((service, index) => {
            const Icon = service.icon;
            const visual = visualBySlug[service.slug];

            return (
              <section
                key={service.slug}
                id={service.slug}
                className={`flex flex-col ${
                  index % 2 === 1 ? "lg:flex-row-reverse" : "lg:flex-row"
                } gap-16 items-center`}
              >
                <div className="flex-1">
                  <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-white/5 border border-white/10 mb-8">
                    <Icon className={`w-10 h-10 ${service.accent}`} aria-hidden="true" />
                  </div>
                  <h2 className="text-3xl md:text-4xl font-bold mb-6">{service.title}</h2>
                  <p className="text-gray-400 text-lg leading-relaxed mb-8">{service.summary}</p>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {service.deliverables.map((deliverable) => (
                      <li key={deliverable} className="flex items-center text-gray-300">
                        <span className="w-2 h-2 rounded-full bg-primary mr-3" aria-hidden="true" />
                        {deliverable}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="flex-1 w-full h-[400px]">
                  <SpotlightCard className="w-full h-full flex items-center justify-center bg-white/5 border-white/10 group overflow-hidden">
                    {visual ?? (
                      <div className="flex flex-col items-center gap-4 p-10 text-center">
                        <Icon className={`w-20 h-20 ${service.accent}`} aria-hidden="true" />
                        <span className="text-lg font-semibold text-white">{service.title}</span>
                      </div>
                    )}
                  </SpotlightCard>
                </div>
              </section>
            );
          })}
        </div>

        <div className="mt-32 grid grid-cols-1 lg:grid-cols-2 gap-10">
          <div className="bg-white/5 border border-white/10 rounded-3xl p-10">
            <h2 className="text-3xl font-bold mb-6">How We Deliver</h2>
            <p className="text-gray-400 leading-relaxed mb-8">
              Our delivery process is designed to reduce risk and keep projects predictable. We
              align on scope early, validate assumptions with milestones, and ship in increments
              with clear quality gates.
            </p>
            <div className="space-y-5">
              {deliveryProcess.map((item, index) => (
                <div key={item.step} className="flex gap-4">
                  <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-primary font-semibold">
                    {String(index + 1).padStart(2, "0")}
                  </div>
                  <div>
                    <div className="text-white font-semibold">{item.step}</div>
                    <div className="text-gray-400 text-sm leading-relaxed">{item.detail}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-3xl p-10">
            <h2 className="text-3xl font-bold mb-6">What You Receive</h2>
            <p className="text-gray-400 leading-relaxed mb-8">
              We do not only ship features. We ship a system you can operate confidently: clear
              architecture, reliable deployments, and documentation that makes future work easier.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                "Architecture and implementation aligned to your goals",
                "Security-first engineering and safe data handling",
                "Performance tuning and scalability planning",
                "Deployment automation and environment discipline",
                "Monitoring and operational visibility",
                "Documentation for handover and long-term maintenance",
              ].map((item) => (
                <div
                  key={item}
                  className="flex items-start gap-3 bg-white/5 border border-white/10 rounded-2xl p-4"
                >
                  <div className="w-2.5 h-2.5 rounded-full bg-primary mt-2" aria-hidden="true" />
                  <div className="text-gray-300 text-sm leading-relaxed">{item}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-32 text-center bg-white/5 border border-white/10 rounded-3xl p-12">
          <h2 className="text-3xl font-bold mb-6">Ready to Build Something Extraordinary?</h2>
          <p className="text-gray-400 max-w-2xl mx-auto mb-8">
            Whether you are developing a new digital platform, modernising existing infrastructure,
            or exploring emerging technologies, our team is ready to help turn your vision into
            reality.
          </p>
          <Link
            href="/project-brief"
            className="inline-flex items-center justify-center px-8 py-3 text-base font-medium text-white bg-primary rounded-full hover:bg-blue-600 transition-all duration-300"
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
