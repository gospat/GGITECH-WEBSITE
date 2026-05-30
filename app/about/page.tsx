import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Users, Target, Rocket } from "lucide-react";

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-background text-white">
      <Navbar />
      
      <div className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center mb-20">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">About Us</h1>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto">
            GOSPAT GLOBAL INNOVATIONS LTD is a technology company focused on developing innovative digital systems that support institutions, businesses, and emerging technologies.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12 mb-32">
          <div className="bg-white/5 p-8 rounded-2xl border border-white/10">
            <Users className="w-12 h-12 text-primary mb-6" />
            <h2 className="text-2xl font-bold mb-4">Who We Are</h2>
            <p className="text-gray-400 leading-relaxed">
              Through its technology division GGI Tech, the company designs and builds scalable platforms, enterprise systems, and advanced digital infrastructure.
            </p>
          </div>
          
          <div className="bg-white/5 p-8 rounded-2xl border border-white/10">
            <Target className="w-12 h-12 text-emerald-400 mb-6" />
            <h2 className="text-2xl font-bold mb-4">Our Mission</h2>
            <p className="text-gray-400 leading-relaxed">
              To create reliable technology solutions that improve operational efficiency, enhance digital experiences, and enable organizations to operate more effectively.
            </p>
          </div>
          
          <div className="bg-white/5 p-8 rounded-2xl border border-white/10">
            <Rocket className="w-12 h-12 text-purple-400 mb-6" />
            <h2 className="text-2xl font-bold mb-4">Our Vision</h2>
            <p className="text-gray-400 leading-relaxed">
              To become a global leader in the development of advanced digital infrastructure and intelligent technology systems.
            </p>
          </div>
        </div>
        
        <div className="relative bg-white/5 border border-white/10 rounded-3xl p-12 overflow-hidden mb-32">
          <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-primary/10 to-transparent pointer-events-none" />
          <div className="relative z-10">
            <h2 className="text-3xl font-bold mb-6">Building Systems That Power Real Organizations</h2>
            <p className="text-gray-400 text-lg mb-8 max-w-4xl leading-relaxed">
              GGI Tech focuses on creating digital systems that address real operational challenges faced by institutions and businesses. Our solutions are designed with scalability, performance, and reliability at their core. By combining modern software engineering practices with strong system architecture, we build platforms that support long-term growth and technological advancement.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-12">
              {[
                { label: "Digital Platforms", value: "Developed" },
                { label: "Enterprise Systems", value: "Engineered" },
                { label: "Secure Infrastructure", value: "Deployed" },
                { label: "Institutions", value: "Supported" },
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
            We welcome professionals and developers who share our commitment to excellence, innovation, and building systems that make a difference.
          </p>
          <a href="/careers" className="inline-flex items-center justify-center px-8 py-3 text-base font-medium text-white bg-white/10 border border-white/20 rounded-full hover:bg-white/20 transition-all duration-300">
            View Careers
          </a>
        </div>
      </div>
      
      <Footer />
    </main>
  );
}
