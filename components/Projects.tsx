"use client";

import { motion } from "framer-motion";
import { ExternalLink } from "lucide-react";
import Link from "next/link";

const projects = [
  {
    title: "Telemedicine Platform",
    description: "A secure, HIPAA-compliant platform connecting patients with healthcare providers through video consultations and digital prescriptions.",
    tags: ["React", "Node.js", "WebRTC", "MongoDB"],
    image: "/project-telemed.jpg", // Placeholder
    link: "/projects/telemedicine-platform",
  },
  {
    title: "University Payment System",
    description: "An integrated payment gateway for tuition and fees, processing thousands of transactions securely with real-time reporting.",
    tags: ["Next.js", "PostgreSQL", "Stripe", "Redis"],
    image: "/project-payment.jpg", // Placeholder
    link: "/projects/university-payment-system",
  },
  {
    title: "Curriculum Management System",
    description: "A comprehensive tool for academic institutions to design, approve, and manage course curriculums and learning outcomes.",
    tags: ["Vue.js", "Django", "Docker", "AWS"],
    image: "/project-curriculum.jpg", // Placeholder
    link: "#",
  },
  {
    title: "Web3 Validator Infrastructure",
    description: "High-performance validator nodes for proof-of-stake blockchains, ensuring network security and uptime.",
    tags: ["Rust", "Solana", "Linux", "Prometheus"],
    image: "/project-web3.jpg", // Placeholder
    link: "#",
  },
];

export default function Projects() {
  return (
    <section id="projects" className="py-24 bg-background relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-sm font-semibold text-primary tracking-widest uppercase mb-4">
            Our Portfolio
          </h2>
          <h3 className="text-4xl md:text-5xl font-bold mb-4">
            Featured Projects
          </h3>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Showcasing our capabilities in building robust digital solutions.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {projects.map((project, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ delay: index * 0.1 }}
              className="group relative overflow-hidden rounded-2xl bg-white/5 border border-white/10 hover:border-primary/50 transition-all duration-500"
            >
              <div className="aspect-video bg-gray-800 relative overflow-hidden">
                {/* Placeholder for image */}
                <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent opacity-60 z-10" />
                <div className="absolute inset-0 flex items-center justify-center text-gray-600 font-bold text-2xl">
                    {project.title} Preview
                </div>
              </div>
              
              <div className="p-8 relative z-20">
                <h4 className="text-2xl font-bold mb-3 group-hover:text-primary transition-colors">
                  {project.title}
                </h4>
                <p className="text-gray-400 mb-6 leading-relaxed">
                  {project.description}
                </p>
                
                <div className="flex flex-wrap gap-2 mb-6">
                  {project.tags.map((tag, i) => (
                    <span
                      key={i}
                      className="px-3 py-1 text-xs font-medium rounded-full bg-primary/10 text-primary border border-primary/20"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                
                <div className="flex items-center space-x-4">
                  <Link
                    href={project.link}
                    className="inline-flex items-center text-sm font-medium text-white hover:text-primary transition-colors"
                  >
                    View Case Study <ExternalLink className="w-4 h-4 ml-2" />
                  </Link>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
