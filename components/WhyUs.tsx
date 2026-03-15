"use client";

import { motion } from "framer-motion";
import { ShieldCheck, TrendingUp, Layers, Zap } from "lucide-react";

const reasons = [
  {
    icon: <ShieldCheck className="w-12 h-12 text-primary" />,
    title: "Secure Systems",
    description: "Enterprise-grade security protocols ensuring data integrity and user protection.",
  },
  {
    icon: <TrendingUp className="w-12 h-12 text-emerald-400" />,
    title: "Scalable Architecture",
    description: "Systems designed to grow with your organization, handling millions of requests effortlessly.",
  },
  {
    icon: <Layers className="w-12 h-12 text-purple-400" />,
    title: "Performance Driven",
    description: "Optimized for speed and efficiency, delivering seamless user experiences.",
  },
  {
    icon: <Zap className="w-12 h-12 text-yellow-400" />,
    title: "Advanced Tech Stack",
    description: "Leveraging the latest technologies like Next.js, Web3, and Cloud Infrastructure.",
  },
];

export default function WhyUs() {
  return (
    <section className="py-24 bg-background relative overflow-hidden">
      <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-primary/5 to-transparent pointer-events-none" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-sm font-semibold text-primary tracking-widest uppercase mb-4">
            Our Vision
          </h2>
          <h3 className="text-4xl md:text-5xl font-bold mb-4">
            Building Systems That Power Real Organizations
          </h3>
          <p className="text-gray-400 max-w-2xl mx-auto mb-12">
            Our vision is to become a global leader in the development of advanced digital infrastructure and intelligent technology systems. We aim to empower organizations with innovative solutions that enhance efficiency, strengthen digital security, and unlock new possibilities.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {reasons.map((reason, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ delay: index * 0.1 }}
              className="text-center p-8 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors duration-300"
            >
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-white/5 mb-6">
                {reason.icon}
              </div>
              <h4 className="text-xl font-bold mb-4">{reason.title}</h4>
              <p className="text-gray-400 leading-relaxed">{reason.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
