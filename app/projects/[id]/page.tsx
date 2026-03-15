import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Link from "next/link";
import { ArrowLeft, CheckCircle, ExternalLink } from "lucide-react";

// Mock data - in a real app this would come from a database or CMS
const projects = {
  "telemedicine-platform": {
    title: "Telemedicine Platform",
    subtitle: "Secure HIPAA-Compliant Healthcare System",
    description: "A comprehensive digital health platform connecting patients with healthcare providers through secure video consultations, digital prescriptions, and real-time health monitoring.",
    challenge: "The client needed a scalable, secure way to handle sensitive patient data while providing low-latency video calls for thousands of concurrent users.",
    solution: "We architected a microservices-based backend using Node.js and WebRTC for video. Data is encrypted at rest and in transit using industry-standard protocols.",
    technologies: ["React", "Node.js", "WebRTC", "MongoDB", "Redis", "Docker"],
    features: [
      "HD Video Consultations",
      "Digital Prescription Management",
      "Real-time Chat",
      "Appointment Scheduling",
      "Secure Payment Gateway",
      "Electronic Health Records (EHR) Integration"
    ],
    results: [
      "50,000+ Active Patients",
      "99.99% Uptime",
      "30% Reduction in Administrative Costs"
    ],
    image: "/project-telemed.jpg"
  },
  "university-payment-system": {
    title: "University Payment System",
    subtitle: "Integrated Financial Gateway for Higher Education",
    description: "A centralized payment portal for tuition, housing, and other university fees, integrating with existing student information systems.",
    challenge: "Handling peak traffic during registration periods and reconciling payments across multiple bank accounts in real-time.",
    solution: "We implemented a queue-based architecture to handle traffic spikes and a double-entry ledger system for accurate financial tracking.",
    technologies: ["Next.js", "PostgreSQL", "Stripe Connect", "Redis", "Kubernetes"],
    features: [
      "Multi-currency Support",
      "Automated Reconciliation",
      "Real-time Reporting Dashboard",
      "Student Wallet System",
      "Installment Plan Management"
    ],
    results: [
      "$10M+ Processed Annually",
      "0% Transaction Errors",
      "50% Faster Checkout Time"
    ],
    image: "/project-payment.jpg"
  },
  // Add more projects as needed
};

export default function ProjectDetail({ params }: { params: { id: string } }) {
  const project = projects[params.id as keyof typeof projects];

  if (!project) {
    return (
      <div className="min-h-screen bg-background text-white flex flex-col items-center justify-center">
        <h1 className="text-4xl font-bold mb-4">Project Not Found</h1>
        <Link href="/" className="text-primary hover:underline">Return Home</Link>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-background text-white">
      <Navbar />
      
      <div className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <Link href="/#projects" className="inline-flex items-center text-gray-400 hover:text-white mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Projects
        </Link>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 mb-16">
          <div>
            <h1 className="text-4xl md:text-6xl font-bold mb-4">{project.title}</h1>
            <p className="text-xl text-primary mb-8">{project.subtitle}</p>
            <p className="text-gray-300 text-lg leading-relaxed mb-8">
              {project.description}
            </p>
            
            <div className="flex flex-wrap gap-2 mb-8">
              {project.technologies.map((tech, i) => (
                <span key={i} className="px-3 py-1 text-sm font-medium rounded-full bg-white/5 border border-white/10 text-gray-300">
                  {tech}
                </span>
              ))}
            </div>
            
            <div className="flex gap-4">
              <button className="bg-primary hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-medium transition-colors inline-flex items-center">
                Launch Project <ExternalLink className="w-4 h-4 ml-2" />
              </button>
            </div>
          </div>
          
          <div className="bg-white/5 border border-white/10 rounded-2xl aspect-video flex items-center justify-center text-gray-500">
            {/* Placeholder for project image */}
            <span className="text-lg">Project Screenshot / Demo Video</span>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-20">
          <div className="md:col-span-2">
            <h3 className="text-2xl font-bold mb-6">The Challenge</h3>
            <p className="text-gray-400 mb-8 leading-relaxed">{project.challenge}</p>
            
            <h3 className="text-2xl font-bold mb-6">The Solution</h3>
            <p className="text-gray-400 mb-8 leading-relaxed">{project.solution}</p>
          </div>
          
          <div className="bg-white/5 border border-white/10 rounded-2xl p-8 h-fit">
            <h3 className="text-xl font-bold mb-6">Key Features</h3>
            <ul className="space-y-4">
              {project.features.map((feature, i) => (
                <li key={i} className="flex items-start text-gray-300">
                  <CheckCircle className="w-5 h-5 text-primary mr-3 flex-shrink-0 mt-0.5" />
                  {feature}
                </li>
              ))}
            </ul>
          </div>
        </div>
        
        <div className="border-t border-white/10 pt-16">
          <h3 className="text-2xl font-bold mb-8 text-center">Impact & Results</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {project.results.map((result, i) => (
              <div key={i} className="text-center p-6 bg-white/5 rounded-xl border border-white/10">
                <p className="text-3xl font-bold text-white mb-2">{result.split(" ")[0]}</p>
                <p className="text-gray-400">{result.split(" ").slice(1).join(" ")}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      <Footer />
    </main>
  );
}
