"use client";

import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";

export default function About() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <section id="about" className="py-24 bg-background relative overflow-hidden">
      <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-primary/5 to-transparent pointer-events-none" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.div
          ref={ref}
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center"
        >
          <div>
            <motion.h2 variants={itemVariants} className="text-sm font-semibold text-primary tracking-widest uppercase mb-4">
              About GGITECH
            </motion.h2>
            <motion.h3 variants={itemVariants} className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
              Engineering the <span className="text-gradient">Digital Infrastructure</span> of Tomorrow
            </motion.h3>
            <motion.div variants={itemVariants} className="space-y-6 text-gray-400 text-lg leading-relaxed">
              <p>
                GOSPAT GLOBAL INNOVATIONS LTD is a technology company focused on developing secure, scalable digital systems for modern organizations.
              </p>
              <p>
                Through its technology division <strong className="text-white">GGI Tech</strong>, the company develops secure web platforms, institutional systems, and blockchain-based technologies designed to solve real-world problems.
              </p>
              <p>
                Our vision is to build intelligent digital infrastructure that powers institutions, businesses, and emerging technologies across Africa and beyond.
              </p>
            </motion.div>
            
            <motion.div variants={itemVariants} className="mt-10 grid grid-cols-2 gap-8">
              {[
                { label: "Institutional Platforms", value: "Secure" },
                { label: "FinTech Infrastructure", value: "Scalable" },
                { label: "Telemedicine Systems", value: "Reliable" },
                { label: "Blockchain Applications", value: "Innovative" },
              ].map((item, index) => (
                <div key={index} className="border-l-2 border-primary/30 pl-4">
                  <div className="text-white font-bold text-xl">{item.value}</div>
                  <div className="text-sm text-gray-500">{item.label}</div>
                </div>
              ))}
            </motion.div>
          </div>
          
          <div className="relative">
            <div className="aspect-square rounded-2xl overflow-hidden bg-gradient-to-br from-white/5 to-white/0 border border-white/10 p-8 backdrop-blur-sm relative group hover:border-primary/50 transition-colors duration-500">
              <div className="absolute inset-0 bg-grid-white/[0.02] bg-[length:20px_20px]" />
              <div className="relative z-10 h-full flex flex-col justify-center items-center text-center">
                 <div className="w-24 h-24 rounded-full bg-primary/20 flex items-center justify-center mb-6 animate-pulse">
                    <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center">
                        <span className="text-2xl font-bold text-white">GGI</span>
                    </div>
                 </div>
                 <h4 className="text-2xl font-bold mb-2">GOSPAT GLOBAL</h4>
                 <p className="text-gray-400">INNOVATIONS LTD</p>
              </div>
            </div>
            
            {/* Decorative elements */}
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-primary/20 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-accent/20 rounded-full blur-3xl pointer-events-none" />
          </div>
        </motion.div>
      </div>
    </section>
  );
}
