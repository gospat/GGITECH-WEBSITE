import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SpotlightCard from "@/components/SpotlightCard";
import { SoftwareDevViz, SystemArchViz, Web3Viz, CloudViz } from "@/components/ServiceVisualizations";
import { Code, Server, Cloud, Globe } from "lucide-react";

const services = [
  {
    icon: <Code className="w-10 h-10 text-primary" />,
    title: "Software Development",
    description:
      "We design and build powerful digital platforms tailored to real operational needs. From enterprise web apps to institutional portals, we deliver systems engineered for performance, security, and long-term maintainability.",
    features: [
      "Custom Web Application Development",
      "Enterprise Software Solutions",
      "Institutional & Administrative Systems",
      "Secure Payment Platform Integrations",
      "Database-Driven Platforms",
      "API Development & Integration",
    ],
    viz: <SoftwareDevViz />
  },
  {
    icon: <Server className="w-10 h-10 text-emerald-400" />,
    title: "System Architecture",
    description:
      "Building reliable software begins with strong architecture. We design backend foundations that remain stable under growth, handle complex workflows, and protect sensitive data with secure-by-design patterns.",
    features: [
      "Backend System Design",
      "Database Architecture & Data Modeling",
      "API Infrastructure & Service Boundaries",
      "Scalable Platform Design",
      "Secure Data Handling Systems",
      "Performance Optimization & Caching",
    ],
    viz: <SystemArchViz />
  },
  {
    icon: <Globe className="w-10 h-10 text-purple-400" />,
    title: "Web3 Development",
    description:
      "We build decentralized applications, validator infrastructure, and blockchain-integrated platforms with an engineering-first approach: secure key management, reliable deployments, and production monitoring.",
    features: [
      "Smart Contract Development",
      "Validator Node Infrastructure",
      "Blockchain Integrations for Applications",
      "Decentralized Application Development (DApps)",
      "Crypto Infrastructure & Tooling",
      "Security Reviews & Operational Runbooks",
    ],
    viz: <Web3Viz />
  },
  {
    icon: <Cloud className="w-10 h-10 text-sky-400" />,
    title: "Cloud Infrastructure",
    description:
      "Modern platforms require reliable infrastructure for uptime, performance, and security. We design and manage cloud infrastructure that powers mission-critical systems with clear monitoring and automated delivery.",
    features: [
      "Server Deployment & Configuration",
      "Linux Server Administration",
      "Cloud Platform Setup (AWS/Azure/GCP)",
      "Monitoring & Performance Optimization",
      "Secure Hosting Infrastructure",
      "Automated Deployment Pipelines (CI/CD)",
    ],
    viz: <CloudViz />
  }
];

export default function ServicesPage() {
  return (
    <main className="min-h-screen bg-background text-white">
      <Navbar />
      
      <div className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center mb-20">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">Our Services</h1>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto">
            At GGI Tech, we design and build powerful digital platforms tailored to the needs of modern organizations.
            Every system we deliver is engineered for reliability, security, and scalability—so it keeps working as your
            user base and operational complexity grow.
          </p>
        </div>
        
        <div className="space-y-32">
          {services.map((service, index) => (
            <div key={index} className={`flex flex-col ${index % 2 === 1 ? 'lg:flex-row-reverse' : 'lg:flex-row'} gap-16 items-center`}>
              <div className="flex-1">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-white/5 border border-white/10 mb-8">
                  {service.icon}
                </div>
                <h2 className="text-3xl md:text-4xl font-bold mb-6">{service.title}</h2>
                <p className="text-gray-400 text-lg leading-relaxed mb-8">
                  {service.description}
                </p>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {service.features.map((feature, i) => (
                    <li key={i} className="flex items-center text-gray-300">
                      <div className="w-2 h-2 rounded-full bg-primary mr-3" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
              
              <div className="flex-1 w-full h-[400px]">
                <SpotlightCard className="w-full h-full flex items-center justify-center bg-white/5 border-white/10 group overflow-hidden">
                  {service.viz}
                </SpotlightCard>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-32 grid grid-cols-1 lg:grid-cols-2 gap-10">
          <div className="bg-white/5 border border-white/10 rounded-3xl p-10">
            <h2 className="text-3xl font-bold mb-6">How We Deliver</h2>
            <p className="text-gray-400 leading-relaxed mb-8">
              Our delivery process is designed to reduce risk and keep projects predictable. We align on scope early,
              validate assumptions with milestones, and ship in increments with clear quality gates.
            </p>
            <div className="space-y-5">
              {[
                { step: "01", title: "Discovery", desc: "Requirements capture, constraints mapping, and success metrics." },
                { step: "02", title: "System Design", desc: "Architecture, data model, security boundaries, and delivery plan." },
                { step: "03", title: "Build", desc: "Implementation with testing, code review discipline, and performance focus." },
                { step: "04", title: "Launch", desc: "Deployment automation, monitoring, and safe rollout." },
                { step: "05", title: "Support", desc: "Maintenance, improvements, and operational continuity." },
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
            <h2 className="text-3xl font-bold mb-6">What You Receive</h2>
            <p className="text-gray-400 leading-relaxed mb-8">
              We do not only ship features. We ship a system you can operate confidently: clear architecture, reliable
              deployments, and documentation that makes future work easier.
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
                <div key={item} className="flex items-start gap-3 bg-white/5 border border-white/10 rounded-2xl p-4">
                  <div className="w-2.5 h-2.5 rounded-full bg-primary mt-2" />
                  <div className="text-gray-300 text-sm leading-relaxed">{item}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        <div className="mt-32 text-center bg-white/5 border border-white/10 rounded-3xl p-12">
          <h2 className="text-3xl font-bold mb-6">Ready to Build Something Extraordinary?</h2>
          <p className="text-gray-400 max-w-2xl mx-auto mb-8">
            Whether you are developing a new digital platform, modernizing existing infrastructure, or exploring emerging technologies, our team is ready to help turn your vision into reality.
          </p>
          <a href="/project-brief" className="inline-flex items-center justify-center px-8 py-3 text-base font-medium text-white bg-primary rounded-full hover:bg-blue-600 transition-all duration-300">
            Submit a Project Brief
          </a>
        </div>
      </div>
      
      <Footer />
    </main>
  );
}
