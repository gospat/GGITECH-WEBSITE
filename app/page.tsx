import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import About from "@/components/About";
import Stats from "@/components/Stats";
import Services from "@/components/Services";
import Projects from "@/components/Projects";
import Insights from "@/components/Insights";
import TechStack from "@/components/TechStack";
import Innovation from "@/components/Innovation";
import WhyUs from "@/components/WhyUs";
import Contact from "@/components/Contact";
import Footer from "@/components/Footer";
import { createMetadata } from "@/lib/site";

export const metadata: Metadata = createMetadata({
  title: "Engineering Digital Infrastructure",
  description:
    "GGI Tech designs and builds secure, scalable platforms for institutions, businesses, and emerging technologies — from software engineering and system architecture to cloud infrastructure and blockchain.",
  path: "/",
  keywords: [
    "GGI Tech",
    "software engineering company",
    "institutional systems",
    "cloud infrastructure",
    "blockchain development",
    "Lagos software company",
  ],
});

export default function Home() {
  return (
    <main id="main" className="min-h-screen bg-background text-text overflow-hidden">
      <Navbar />
      <Hero />
      <Stats />
      <About />
      <Services />
      <Projects />
      <TechStack />
      <Innovation />
      <Insights />
      <WhyUs />
      <Contact />
      <Footer />
    </main>
  );
}
