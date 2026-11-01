"use client";

import { motion, useReducedMotion } from "framer-motion";
import SpotlightCard from "./SpotlightCard";

const technologies = [
  {
    category: "Frontend",
    items: ["HTML5", "CSS3", "JavaScript", "TypeScript", "React", "Next.js", "Tailwind CSS"],
  },
  {
    category: "Backend",
    items: ["Node.js", "Express", "REST APIs", "MySQL", "PostgreSQL", "Redis", "Python", "Go"],
  },
  {
    category: "Infrastructure",
    items: ["Linux", "Docker", "Kubernetes", "AWS", "Azure", "GCP", "CI/CD Pipelines"],
  },
  {
    category: "Blockchain",
    items: ["Solana", "Validator Nodes", "Smart Contracts", "Rust", "Prometheus", "Grafana"],
  },
];

export default function TechStack() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <section id="tech" className="py-24 bg-background relative overflow-hidden">
      <div
        className="absolute inset-0 bg-grid-white/[0.02] bg-[length:40px_40px]"
        aria-hidden="true"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-16">
          <p className="text-sm font-semibold text-primary tracking-widest uppercase mb-4">
            Our Technology Stack
          </p>
          <h2 className="text-4xl md:text-5xl font-bold mb-4 text-balance">
            Built with Proven Tools
          </h2>
          <p className="text-gray-400 max-w-2xl mx-auto">
            We choose established, well-supported technologies and document why — so the systems we
            hand over stay maintainable by others.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {technologies.map((tech, index) => (
            <motion.div
              key={tech.category}
              initial={shouldReduceMotion ? false : { opacity: 0, y: 20 }}
              whileInView={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ delay: index * 0.1 }}
            >
              <SpotlightCard className="p-8 h-full">
                <h3 className="text-xl font-bold mb-6 text-primary border-b border-white/10 pb-4">
                  {tech.category}
                </h3>
                <ul className="space-y-3">
                  {tech.items.map((item) => (
                    <li key={item} className="flex items-center text-gray-300">
                      <span className="w-2 h-2 rounded-full bg-accent mr-3" aria-hidden="true" />
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
