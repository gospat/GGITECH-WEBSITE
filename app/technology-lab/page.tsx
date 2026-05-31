import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SpotlightCard from "@/components/SpotlightCard";
import { Brain, Cpu, Database, Activity } from "lucide-react";

export default function TechLabPage() {
  return (
    <main className="min-h-screen bg-background text-white">
      <Navbar />
      
      <div className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center mb-20">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">The GGI Technology Lab</h1>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto">
            Our commitment to continuous innovation. We research, prototype, and experiment with systems that shape the future.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-32">
          <SpotlightCard className="p-10 bg-white/5 border border-white/10 group h-full">
            <Brain className="w-16 h-16 text-primary mb-8 group-hover:scale-110 transition-transform" />
            <h2 className="text-3xl font-bold mb-4">Artificial Intelligence Systems</h2>
            <p className="text-gray-400 text-lg leading-relaxed mb-6">
              Exploring intelligent automation and data-driven decision-making platforms. We are building models that optimize institutional workflows and detect anomalies in real-time.
            </p>
            <div className="flex flex-wrap gap-2">
              <span className="px-3 py-1 bg-white/5 rounded-full text-xs text-primary border border-primary/20">Predictive Analytics</span>
              <span className="px-3 py-1 bg-white/5 rounded-full text-xs text-primary border border-primary/20">NLP</span>
            </div>
          </SpotlightCard>
          
          <SpotlightCard className="p-10 bg-white/5 border border-white/10 group h-full">
            <Cpu className="w-16 h-16 text-purple-400 mb-8 group-hover:scale-110 transition-transform" />
            <h2 className="text-3xl font-bold mb-4">Blockchain & Decentralized Networks</h2>
            <p className="text-gray-400 text-lg leading-relaxed mb-6">
              Developing infrastructure and applications that support decentralized ecosystems. Our focus is on scalable consensus mechanisms and interoperability protocols.
            </p>
            <div className="flex flex-wrap gap-2">
              <span className="px-3 py-1 bg-white/5 rounded-full text-xs text-purple-400 border border-purple-400/20">Zero-Knowledge Proofs</span>
              <span className="px-3 py-1 bg-white/5 rounded-full text-xs text-purple-400 border border-purple-400/20">Cross-chain Bridges</span>
            </div>
          </SpotlightCard>
          
          <SpotlightCard className="p-10 bg-white/5 border border-white/10 group h-full">
            <Database className="w-16 h-16 text-emerald-400 mb-8 group-hover:scale-110 transition-transform" />
            <h2 className="text-3xl font-bold mb-4">Institutional Data Platforms</h2>
            <p className="text-gray-400 text-lg leading-relaxed mb-6">
              Designing secure digital systems that enable organizations to manage and analyze critical information with military-grade encryption and access controls.
            </p>
          </SpotlightCard>
          
          <SpotlightCard className="p-10 bg-white/5 border border-white/10 group h-full">
            <Activity className="w-16 h-16 text-red-400 mb-8 group-hover:scale-110 transition-transform" />
            <h2 className="text-3xl font-bold mb-4">Digital Health Platforms</h2>
            <p className="text-gray-400 text-lg leading-relaxed mb-6">
              Building systems that enhance healthcare accessibility and efficiency through technology, focusing on telemedicine and remote patient monitoring.
            </p>
          </SpotlightCard>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-10">
            <h2 className="text-3xl font-bold mb-4">How the Lab Operates</h2>
            <p className="text-gray-400 text-lg leading-relaxed mb-6">
              The Technology Lab is where we pressure-test ideas before they become production systems. We prototype quickly, measure
              performance and reliability, and document the outcomes. The goal is not novelty for its own sake—it&apos;s practical advantage:
              reducing risk, building better primitives, and identifying architectures that hold up under real constraints.
            </p>
            <ul className="space-y-3 text-gray-300">
              <li className="flex items-start"><span className="text-primary mr-3">•</span>Problem framing: define the system goal, constraints, and failure modes.</li>
              <li className="flex items-start"><span className="text-primary mr-3">•</span>Prototype: build minimal systems to validate assumptions and integration paths.</li>
              <li className="flex items-start"><span className="text-primary mr-3">•</span>Measure: baseline latency, throughput, cost, and operational complexity.</li>
              <li className="flex items-start"><span className="text-primary mr-3">•</span>Productionize: turn learnings into patterns, runbooks, and repeatable delivery.</li>
            </ul>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-10">
            <h2 className="text-3xl font-bold mb-4">Responsible Innovation</h2>
            <p className="text-gray-400 text-lg leading-relaxed mb-6">
              We treat security and privacy as core research constraints. Experimental work is evaluated for data minimization, access
              control boundaries, and operational safety. When we explore AI-driven workflows, we focus on transparency, auditability,
              and human oversight—especially in contexts where systems impact people and institutions.
            </p>
            <p className="text-gray-400 text-lg leading-relaxed">
              If you are interested in collaboration, research partnerships, or deploying production-grade versions of these systems,
              reach out through the contact page or submit a detailed project brief.
            </p>
          </div>
        </div>
      </div>
      
      <Footer />
    </main>
  );
}
