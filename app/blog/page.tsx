import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SpotlightCard from "@/components/SpotlightCard";
import { ArrowLeft, Calendar, User } from "lucide-react";
import Link from "next/link";

const insights = [
  {
    title: "The Future of Blockchain in Institutional Banking",
    excerpt: "How decentralized ledgers are revolutionizing settlement layers for major financial institutions. We explore the shift from SWIFT to on-chain settlements and what it means for the future of global finance.",
    date: "March 15, 2026",
    author: "GGI Research",
    category: "Blockchain",
    link: "#",
  },
  {
    title: "Scaling Node.js Architecture for Millions of Users",
    excerpt: "Best practices for building resilient, high-throughput backend systems using Node.js and Microservices. A deep dive into clustering, caching strategies, and database sharding.",
    date: "March 10, 2026",
    author: "Engineering Team",
    category: "Engineering",
    link: "#",
  },
  {
    title: "Securing Digital Infrastructure in the Age of AI",
    excerpt: "New cybersecurity paradigms required to protect enterprise data from AI-driven threats. Understanding adversarial machine learning and how to defend against automated attack vectors.",
    date: "March 05, 2026",
    author: "Security Ops",
    category: "Security",
    link: "#",
  },
  {
    title: "Web3 Validator Infrastructure: A Technical Overview",
    excerpt: "Setting up high-performance validator nodes for Solana and Ethereum. Optimizing hardware, networking, and monitoring for 99.999% uptime.",
    date: "February 28, 2026",
    author: "DevOps Team",
    category: "Web3",
    link: "#",
  },
  {
    title: "The Rise of Digital Health Ecosystems",
    excerpt: "Connecting disparate healthcare systems through interoperable APIs. How FHIR standards are enabling a new generation of patient-centric applications.",
    date: "February 20, 2026",
    author: "Health Tech",
    category: "Healthcare",
    link: "#",
  },
  {
    title: "Cloud Native: Moving Beyond Lift and Shift",
    excerpt: "True modernization requires re-architecting for the cloud, not just hosting VMs. We discuss serverless patterns, event-driven architectures, and the benefits of managed services.",
    date: "February 15, 2026",
    author: "Cloud Architect",
    category: "Cloud",
    link: "#",
  },
];

export default function Blog() {
  return (
    <main className="min-h-screen bg-background text-white">
      <Navbar />
      
      <div className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <Link href="/" className="inline-flex items-center text-gray-400 hover:text-white mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Home
        </Link>
        
        <div className="mb-16">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">Insights & Research</h1>
          <p className="text-xl text-gray-400 max-w-3xl">
            Deep dives into technology, infrastructure, and the future of digital systems.
            Written by the engineers and researchers at GGI Tech.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {insights.map((post, index) => (
            <div key={index}>
              <SpotlightCard className="p-8 h-full flex flex-col group cursor-pointer hover:border-primary/50 transition-colors">
                <div className="mb-6">
                  <span className="inline-block px-3 py-1 text-xs font-medium rounded-full bg-primary/10 text-primary border border-primary/20 mb-4">
                    {post.category}
                  </span>
                  <h4 className="text-2xl font-bold mb-4 group-hover:text-primary transition-colors">
                    {post.title}
                  </h4>
                  <p className="text-gray-400 text-sm leading-relaxed mb-6">
                    {post.excerpt}
                  </p>
                </div>
                
                <div className="mt-auto flex items-center justify-between text-xs text-gray-500 border-t border-white/10 pt-4">
                  <div className="flex items-center">
                    <Calendar className="w-3 h-3 mr-1" />
                    {post.date}
                  </div>
                  <div className="flex items-center">
                    <User className="w-3 h-3 mr-1" />
                    {post.author}
                  </div>
                </div>
              </SpotlightCard>
            </div>
          ))}
        </div>
      </div>
      
      <Footer />
    </main>
  );
}
