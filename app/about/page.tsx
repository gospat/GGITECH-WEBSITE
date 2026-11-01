import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Users, Target, Rocket } from "lucide-react";
import Illustration from "@/components/Illustration";
import { createMetadata } from "@/lib/site";

export const metadata: Metadata = createMetadata({
  title: "About",
  description:
    "GOSPAT Global Innovations Ltd builds secure, scalable digital systems through its technology division, GGI Tech. Learn who we are, our mission, and how we work.",
  path: "/about",
  keywords: ["about GGI Tech", "GOSPAT Global Innovations", "Lagos technology company"],
});

export default function AboutPage() {
  return (
    <main id="main" className="min-h-screen bg-background text-white">
      <Navbar />

      <div className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center mb-20">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">About Us</h1>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto">
            GOSPAT GLOBAL INNOVATIONS LTD is a technology company focused on developing secure,
            scalable digital systems that support institutions, businesses, and emerging
            technologies. Through its technology division, GGI Tech, we engineer platforms that are
            built to last—reliable under real-world load, maintainable over time, and designed with
            security as a default.
          </p>
        </div>

        <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 mb-24">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-emerald-400/10 opacity-70" />
          <Illustration
            src="/images/illustrations/about-hero.jpg"
            alt="Illustration representing GGI Tech's work across secure platforms, cloud infrastructure, and digital systems"
            className="w-full h-auto object-cover"
            priority
            sizes="(max-width: 1024px) 100vw, 1120px"
          />
        </div>

        <div className="relative bg-white/5 border border-white/10 rounded-3xl p-12 overflow-hidden mb-24">
          <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-primary/10 to-transparent pointer-events-none" />
          <div className="relative z-10">
            <h2 className="text-3xl font-bold mb-6">What We Believe</h2>
            <p className="text-gray-400 text-lg leading-relaxed max-w-4xl">
              Great products are not only designed—they are engineered. We believe the best
              technology teams build with clear architecture, measurable reliability, and
              disciplined execution. Our work prioritizes long-term maintainability, secure data
              handling, and performance that holds up under pressure.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-10">
              {[
                {
                  title: "Build for Reality",
                  desc: "Systems must work in the real world: unstable networks, peak traffic, changing requirements, and strict security expectations.",
                },
                {
                  title: "Clarity Over Complexity",
                  desc: "We prefer simple, testable designs that scale predictably over architectures that are impressive but fragile.",
                },
                {
                  title: "Security as Default",
                  desc: "We integrate secure-by-design patterns early—identity, access control, logging, and safe data flows from day one.",
                },
              ].map((item) => (
                <div key={item.title} className="bg-white/5 p-6 rounded-2xl border border-white/10">
                  <div className="text-white font-semibold mb-2">{item.title}</div>
                  <div className="text-gray-400 text-sm leading-relaxed">{item.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12 mb-32">
          <div className="bg-white/5 p-8 rounded-2xl border border-white/10">
            <Users className="w-12 h-12 text-primary mb-6" />
            <h2 className="text-2xl font-bold mb-4">Who We Are</h2>
            <p className="text-gray-400 leading-relaxed">
              We are engineers and builders focused on digital infrastructure. Through GGI Tech, we
              design and implement enterprise platforms, institutional systems, API-driven services,
              and modern infrastructure for reliability and scale.
            </p>
          </div>

          <div className="bg-white/5 p-8 rounded-2xl border border-white/10">
            <Target className="w-12 h-12 text-emerald-400 mb-6" />
            <h2 className="text-2xl font-bold mb-4">Our Mission</h2>
            <p className="text-gray-400 leading-relaxed">
              To create reliable technology solutions that improve operational efficiency,
              strengthen security, and enable organizations to operate more effectively in an
              increasingly digital world.
            </p>
          </div>

          <div className="bg-white/5 p-8 rounded-2xl border border-white/10">
            <Rocket className="w-12 h-12 text-purple-400 mb-6" />
            <h2 className="text-2xl font-bold mb-4">Our Vision</h2>
            <p className="text-gray-400 leading-relaxed">
              To become a trusted builder of advanced digital infrastructure and intelligent
              systems—delivering world-class engineering that supports institutions, businesses, and
              emerging technologies across Africa and beyond.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-32 items-start">
          <div className="bg-white/5 border border-white/10 rounded-3xl p-10">
            <h2 className="text-3xl font-bold mb-6">How We Work</h2>
            <p className="text-gray-400 leading-relaxed mb-8">
              We run projects with clarity. Every engagement starts with discovery, aligns on scope
              and constraints, and moves into delivery with measurable milestones and reliable
              communication.
            </p>
            <div className="space-y-5">
              {[
                {
                  step: "01",
                  title: "Discovery & Requirements",
                  desc: "We translate your goals into clear specifications and priorities.",
                },
                {
                  step: "02",
                  title: "Architecture & Planning",
                  desc: "We design data flows, security boundaries, and a delivery roadmap.",
                },
                {
                  step: "03",
                  title: "Build & Iterate",
                  desc: "We ship in increments, validate decisions early, and keep quality high.",
                },
                {
                  step: "04",
                  title: "Launch & Support",
                  desc: "We deploy safely, monitor, and maintain for long-term stability.",
                },
              ].map((s) => (
                <div key={s.step} className="flex gap-4">
                  <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-primary font-semibold">
                    {s.step}
                  </div>
                  <div>
                    <div className="text-white font-semibold">{s.title}</div>
                    <div className="text-gray-400 text-sm leading-relaxed">{s.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-3xl p-10">
            <h2 className="text-3xl font-bold mb-6">What You Can Expect</h2>
            <p className="text-gray-400 leading-relaxed mb-8">
              Our goal is to deliver systems that remain dependable after launch. We prioritize
              maintainable code, predictable performance, and operational visibility so your
              platform keeps working as demand grows.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                "Clean architecture and documented decisions",
                "Security-first engineering and safe data handling",
                "Performance optimization and scalability planning",
                "Deployment pipelines and environment discipline",
                "Monitoring, logging, and incident readiness",
                "Practical support and long-term maintainability",
              ].map((item) => (
                <div
                  key={item}
                  className="flex items-start gap-3 bg-white/5 border border-white/10 rounded-2xl p-4"
                >
                  <div className="w-2.5 h-2.5 rounded-full bg-primary mt-2" />
                  <div className="text-gray-300 text-sm leading-relaxed">{item}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="relative bg-white/5 border border-white/10 rounded-3xl p-12 overflow-hidden mb-32">
          <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-primary/10 to-transparent pointer-events-none" />
          <div className="relative z-10">
            <h2 className="text-3xl font-bold mb-6">
              Building Systems That Power Real Organizations
            </h2>
            <p className="text-gray-400 text-lg mb-8 max-w-4xl leading-relaxed">
              GGI Tech focuses on creating digital systems that address real operational challenges
              faced by institutions and businesses. Our solutions are designed with scalability,
              performance, and reliability at their core. By combining modern software engineering
              practices with strong system architecture, we build platforms that support long-term
              growth and technological advancement.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-12">
              {[
                { label: "Discovery", value: "Structured" },
                { label: "Architecture", value: "Designed" },
                { label: "Delivery", value: "Engineered" },
                { label: "Support", value: "Sustained" },
              ].map((item, index) => (
                <div key={index} className="text-center">
                  <div className="text-3xl font-bold text-white mb-2">{item.value}</div>
                  <div className="text-sm text-gray-500 uppercase tracking-wider">{item.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="text-center">
          <h2 className="text-3xl font-bold mb-6">Join Our Journey</h2>
          <p className="text-gray-400 max-w-2xl mx-auto mb-8">
            We welcome professionals and developers who share our commitment to excellence,
            innovation, and building systems that make a difference.
          </p>
          <a
            href="/careers"
            className="inline-flex items-center justify-center px-8 py-3 text-base font-medium text-white bg-white/10 border border-white/20 rounded-full hover:bg-white/20 transition-all duration-300"
          >
            View Careers
          </a>
        </div>
      </div>

      <Footer />
    </main>
  );
}
