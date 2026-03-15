"use client";

import { motion } from "framer-motion";
import { Code, Server, Database, Cloud, Shield, Globe } from "lucide-react";
import SpotlightCard from "./SpotlightCard";

const services = [
  {
    icon: <Code className="w-8 h-8 text-primary" />,
    title: "Software Development",
    description: "Custom web applications, enterprise platforms, and institutional systems using modern technologies and robust architecture.",
  },
  {
    icon: <Server className="w-8 h-8 text-emerald-400" />,
    title: "System Architecture",
    description: "Designing scalable backend systems and infrastructure that can handle millions of requests.",
  },
  {
    icon: <Globe className="w-8 h-8 text-purple-400" />,
    title: "Web3 Development",
    description: "Validator nodes, blockchain integrations, and smart contracts for the decentralized web.",
  },
  {
    icon: <Database className="w-8 h-8 text-orange-400" />,
    title: "Institutional Systems",
    description: "University portals, hospital systems, and secure payment platforms for large organizations.",
  },
  {
    icon: <Cloud className="w-8 h-8 text-sky-400" />,
    title: "Cloud Infrastructure",
    description: "Server architecture, deployment, security, and scaling on AWS, Azure, and GCP.",
  },
  {
    icon: <Shield className="w-8 h-8 text-red-400" />,
    title: "Cybersecurity",
    description: "Protecting your digital assets with advanced security protocols and monitoring.",
  },
];

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

export default function Services() {
  return (
    <section id="services" className="py-24 bg-background relative">
      <div className="absolute inset-0 bg-grid-white/[0.02] bg-[length:40px_40px]" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-sm font-semibold text-primary tracking-widest uppercase mb-4">
            Our Expertise
          </h2>
          <h3 className="text-4xl md:text-5xl font-bold mb-4">
            Services We Provide
          </h3>
          <p className="text-gray-400 max-w-2xl mx-auto">
            We specialize in developing custom web applications, enterprise platforms, and institutional systems using modern technologies and robust architecture.
          </p>
        </div>
        
        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-100px" }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
        >
          {services.map((service, index) => (
            <motion.div
              key={index}
              variants={item}
              className="h-full"
            >
              <SpotlightCard className="p-8 h-full group">
                <div className="mb-6 p-3 bg-white/5 rounded-lg w-fit group-hover:scale-110 transition-transform duration-300">
                  {service.icon}
                </div>
                <h4 className="text-xl font-bold mb-3 group-hover:text-primary transition-colors">
                  {service.title}
                </h4>
                <p className="text-gray-400 leading-relaxed">
                  {service.description}
                </p>
              </SpotlightCard>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
