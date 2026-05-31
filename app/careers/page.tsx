import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SpotlightCard from "@/components/SpotlightCard";
import { Briefcase, Users, Zap, Globe } from "lucide-react";

const careers = [
  {
    role: "Senior Full Stack Engineer",
    type: "Full-time",
    location: "Remote / Lagos",
    description: "Lead the development of scalable enterprise platforms using Next.js, Node.js, and Cloud Infrastructure."
  },
  {
    role: "Blockchain Developer",
    type: "Contract",
    location: "Remote",
    description: "Build smart contracts and validator infrastructure for Solana and Ethereum ecosystems."
  },
  {
    role: "System Architect",
    type: "Full-time",
    location: "Lagos",
    description: "Design high-performance backend systems capable of handling millions of concurrent users."
  }
];

export default function CareersPage() {
  return (
    <main className="min-h-screen bg-background text-white">
      <Navbar />
      
      <div className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center mb-20">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">Join Our Team</h1>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto">
            At GGI Tech, we believe innovation thrives in an environment that encourages creativity, curiosity, and continuous learning.
          </p>
          <p className="text-gray-400 max-w-3xl mx-auto mt-6 leading-relaxed">
            We build systems that have to work in the real world: institutional platforms, secure digital infrastructure, and modern web
            experiences built with rigorous engineering practices. If you care about reliability, clean architecture, and shipping work you
            can stand behind, you will feel at home here.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-32">
          <SpotlightCard className="p-8 h-full bg-white/5 border border-white/10 group">
            <Zap className="w-10 h-10 text-yellow-400 mb-6 group-hover:scale-110 transition-transform" />
            <h3 className="text-2xl font-bold mb-4">Innovation First</h3>
            <p className="text-gray-400 leading-relaxed">
              We push the boundaries of what&apos;s possible, constantly experimenting with emerging technologies.
            </p>
          </SpotlightCard>
          
          <SpotlightCard className="p-8 h-full bg-white/5 border border-white/10 group">
            <Users className="w-10 h-10 text-primary mb-6 group-hover:scale-110 transition-transform" />
            <h3 className="text-2xl font-bold mb-4">Collaborative Culture</h3>
            <p className="text-gray-400 leading-relaxed">
              Work alongside talented engineers and researchers who are passionate about building impactful systems.
            </p>
          </SpotlightCard>
          
          <SpotlightCard className="p-8 h-full bg-white/5 border border-white/10 group">
            <Globe className="w-10 h-10 text-emerald-400 mb-6 group-hover:scale-110 transition-transform" />
            <h3 className="text-2xl font-bold mb-4">Global Impact</h3>
            <p className="text-gray-400 leading-relaxed">
              Contribute to projects that solve real-world challenges for institutions across Africa and beyond.
            </p>
          </SpotlightCard>
        </div>
        
        <div className="mb-20">
          <h2 className="text-3xl font-bold mb-12 text-center">Open Positions</h2>
          <div className="space-y-6">
            {careers.map((job, index) => (
              <div key={index} className="flex flex-col md:flex-row justify-between items-center p-8 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-colors">
                <div className="mb-6 md:mb-0 text-center md:text-left">
                  <h3 className="text-xl font-bold text-white mb-2">{job.role}</h3>
                  <div className="flex items-center justify-center md:justify-start space-x-4 text-sm text-gray-400 mb-4">
                    <span className="flex items-center"><Briefcase className="w-4 h-4 mr-2" /> {job.type}</span>
                    <span className="flex items-center"><Globe className="w-4 h-4 mr-2" /> {job.location}</span>
                  </div>
                  <p className="text-gray-400 max-w-2xl">{job.description}</p>
                </div>
                <a href={`mailto:careers@ggitech.dev?subject=Application for ${job.role}`} className="px-6 py-3 bg-primary text-white rounded-full hover:bg-blue-600 transition-colors font-medium">
                  Apply Now
                </a>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 mb-20">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-10">
            <h2 className="text-2xl font-bold mb-4">What You’ll Work On</h2>
            <p className="text-gray-400 leading-relaxed mb-6">
              Work is driven by real needs: performance under load, secure data handling, predictable deployments, and systems that remain
              maintainable long after launch. We value engineers who can reason about trade-offs and design for reliability, not just quick
              feature delivery.
            </p>
            <ul className="space-y-3 text-gray-300">
              <li className="flex items-start"><span className="text-primary mr-3">•</span>Backend services and APIs with clear boundaries and observability.</li>
              <li className="flex items-start"><span className="text-primary mr-3">•</span>Modern web apps with thoughtful UX and strong accessibility fundamentals.</li>
              <li className="flex items-start"><span className="text-primary mr-3">•</span>Infrastructure automation, monitoring, and incident-ready operations.</li>
              <li className="flex items-start"><span className="text-primary mr-3">•</span>Applied research prototypes from the Technology Lab that can be productionized.</li>
            </ul>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-10">
            <h2 className="text-2xl font-bold mb-4">How Our Hiring Works</h2>
            <p className="text-gray-400 leading-relaxed mb-6">
              We keep hiring structured and respectful. We aim for a process that evaluates real engineering ability, communication, and
              judgment, without unnecessary loops.
            </p>
            <ul className="space-y-3 text-gray-300">
              <li className="flex items-start"><span className="text-primary mr-3">1.</span>Intro conversation to align on role expectations and your interests.</li>
              <li className="flex items-start"><span className="text-primary mr-3">2.</span>Technical discussion focused on architecture, trade-offs, and problem solving.</li>
              <li className="flex items-start"><span className="text-primary mr-3">3.</span>Practical review (portfolio, code samples, or a small scoped exercise if needed).</li>
              <li className="flex items-start"><span className="text-primary mr-3">4.</span>Final conversation about collaboration, ownership, and project fit.</li>
            </ul>
          </div>
        </div>
        
        <div className="text-center bg-white/5 border border-white/10 rounded-3xl p-12">
          <h2 className="text-3xl font-bold mb-6">Don&apos;t see a perfect fit?</h2>
          <p className="text-gray-400 max-w-2xl mx-auto mb-8">
            We are always interested in connecting with talented individuals. Send us your resume and tell us how you can contribute to our mission.
          </p>
          <a href="mailto:careers@ggitech.dev" className="inline-flex items-center justify-center px-8 py-3 text-base font-medium text-white border border-white/20 rounded-full hover:bg-white/10 transition-all duration-300">
            Contact Recruiting
          </a>
        </div>
      </div>
      
      <Footer />
    </main>
  );
}
