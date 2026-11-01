"use client";

import { motion, useReducedMotion } from "framer-motion";
import { ShieldCheck, TrendingUp, Layers, Zap } from "lucide-react";

const reasons = [
  {
    icon: ShieldCheck,
    accent: "text-primary",
    title: "Security by Default",
    description:
      "Authentication, access control, and audit logging are designed in from the start rather than bolted on.",
  },
  {
    icon: TrendingUp,
    accent: "text-emerald-400",
    title: "Built to Scale",
    description:
      "Data models and interfaces are designed so growth in users and data does not force a rewrite.",
  },
  {
    icon: Layers,
    accent: "text-purple-400",
    title: "Performance Focused",
    description:
      "Caching, query design, and load testing are part of delivery, not an afterthought once traffic arrives.",
  },
  {
    icon: Zap,
    accent: "text-yellow-400",
    title: "Modern, Maintainable Stack",
    description:
      "We use established tools — Next.js, Node.js, PostgreSQL, Docker, Kubernetes — and document the decisions behind them.",
  },
];

export default function WhyUs() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <section className="py-24 bg-background relative overflow-hidden">
      <div
        className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-primary/5 to-transparent pointer-events-none"
        aria-hidden="true"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-16">
          <p className="text-sm font-semibold text-primary tracking-widest uppercase mb-4">
            Our Approach
          </p>
          <h2 className="text-4xl md:text-5xl font-bold mb-4 text-balance">
            How We Engineer Systems
          </h2>
          <p className="text-gray-400 max-w-2xl mx-auto mb-12">
            Our aim is to build digital infrastructure that organisations can depend on: systems
            that stay correct, observable, and secure as they grow.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {reasons.map((reason, index) => {
            const Icon = reason.icon;

            return (
              <motion.div
                key={reason.title}
                initial={shouldReduceMotion ? false : { opacity: 0, y: 20 }}
                whileInView={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ delay: index * 0.1 }}
                className="text-center p-8 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors duration-300"
              >
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-white/5 mb-6">
                  <Icon className={`w-12 h-12 ${reason.accent}`} aria-hidden="true" />
                </div>
                <h3 className="text-xl font-bold mb-4">{reason.title}</h3>
                <p className="text-gray-400 leading-relaxed">{reason.description}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
