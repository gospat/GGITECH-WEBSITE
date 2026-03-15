import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SpotlightCard from "@/components/SpotlightCard";
import { SoftwareDevViz, SystemArchViz, Web3Viz, CloudViz } from "@/components/ServiceVisualizations";
import { Code, Server, Database, Cloud, Shield, Globe, Cpu, Layers } from "lucide-react";

const services = [
  {
    icon: <Code className="w-10 h-10 text-primary" />,
    title: "Software Development",
    description: "Custom web applications, enterprise platforms, and institutional systems using modern technologies and robust architecture.",
    features: ["Custom Web Apps", "Enterprise Solutions", "Institutional Systems", "Secure Payment Platforms"],
    viz: <SoftwareDevViz />
  },
  {
    icon: <Server className="w-10 h-10 text-emerald-400" />,
    title: "System Architecture",
    description: "Designing the foundation that ensures platforms remain stable, scalable, and secure even as they grow.",
    features: ["Backend System Design", "Database Architecture", "API Infrastructure", "Performance Optimization"],
    viz: <SystemArchViz />
  },
  {
    icon: <Globe className="w-10 h-10 text-purple-400" />,
    title: "Web3 Development",
    description: "Building decentralized applications, validator infrastructure, and blockchain-integrated platforms.",
    features: ["Smart Contracts", "Validator Nodes", "DApps", "Crypto Infrastructure"],
    viz: <Web3Viz />
  },
  {
    icon: <Cloud className="w-10 h-10 text-sky-400" />,
    title: "Cloud Infrastructure",
    description: "Designing and managing cloud infrastructure that powers mission-critical systems.",
    features: ["Server Deployment", "Linux Administration", "Cloud Setup", "Automated Pipelines"],
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
        
        <div className="mt-32 text-center bg-white/5 border border-white/10 rounded-3xl p-12">
          <h2 className="text-3xl font-bold mb-6">Ready to Build Something Extraordinary?</h2>
          <p className="text-gray-400 max-w-2xl mx-auto mb-8">
            Whether you are developing a new digital platform, modernizing existing infrastructure, or exploring emerging technologies, our team is ready to help turn your vision into reality.
          </p>
          <a href="/contact" className="inline-flex items-center justify-center px-8 py-3 text-base font-medium text-white bg-primary rounded-full hover:bg-blue-600 transition-all duration-300">
            Start Your Project
          </a>
        </div>
      </div>
      
      <Footer />
    </main>
  );
}
