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

export default function Home() {
  return (
    <main className="min-h-screen bg-background text-text overflow-hidden">
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
