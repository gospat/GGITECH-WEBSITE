"use client";

import { motion } from "framer-motion";
import SpotlightCard from "./SpotlightCard";

const technologies = [
  { category: "Frontend", items: ["HTML5", "CSS3", "JavaScript", "React", "Next.js", "Tailwind CSS"] },
  { category: "Backend", items: ["Node.js", "Express", "MySQL", "PostgreSQL", "Python", "Go"] },
  { category: "Infrastructure", items: ["Linux Servers", "Cloud Hosting", "API Architecture", "Docker", "Kubernetes"] },
  { category: "Blockchain", items: ["Solana", "Validator Nodes", "Smart Contracts", "Web3.js", "Rust"] },
];

export default function TechStack() {
  return (
    <section id="tech" className="py-24 bg-background relative overflow-hidden">
      <div className="absolute inset-0 bg-grid-white/[0.02] bg-[length:40px_40px]" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-sm font-semibold text-primary tracking-widest uppercase mb-4">
            Our Technology Stack
          </h2>
          <h3 className="text-4xl md:text-5xl font-bold mb-4">
            Built with Modern Tools
          </h3>
          <p className="text-gray-400 max-w-2xl mx-auto">
            We leverage the latest technologies to build scalable and secure systems.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {technologies.map((tech, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ delay: index * 0.1 }}
            >
              <SpotlightCard className="p-8 h-full">
                <h4 className="text-xl font-bold mb-6 text-primary border-b border-white/10 pb-4">
                  {tech.category}
                </h4>
                <ul className="space-y-3">
                  {tech.items.map((item, i) => (
                    <li key={i} className="flex items-center text-gray-300">
                      <span className="w-2 h-2 rounded-full bg-accent mr-3"></span>
                      {item}
                    </li>
                  ))}
                </ul>
              </SpotlightCard>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
