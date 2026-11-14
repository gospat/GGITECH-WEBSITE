"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Zap, Activity, BarChart, Cpu, ShieldCheck, GitBranch } from "lucide-react";

const pillars = [
  {
    icon: Zap,
    accent: "text-yellow-400",
    title: "Payment Infrastructure",
    desc: "Idempotent flows, verified webhooks",
  },
  {
    icon: Activity,
    accent: "text-red-400",
    title: "System Health",
    desc: "Monitoring, alerting, runbooks",
  },
  {
    icon: BarChart,
    accent: "text-blue-400",
    title: "Data Analytics",
    desc: "Reporting and reconciliation",
  },
  {
    icon: Cpu,
    accent: "text-purple-400",
    title: "Applied AI",
    desc: "Automation under human oversight",
  },
  {
    icon: ShieldCheck,
    accent: "text-emerald-400",
    title: "Security Engineering",
    desc: "Assessment, hardening, response",
  },
  {
    icon: GitBranch,
    accent: "text-sky-400",
    title: "Delivery Automation",
    desc: "CI/CD, staging, safe rollback",
  },
];

export default function Innovation() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <section className="py-24 bg-background relative overflow-hidden">
      <div
        className="absolute inset-0 bg-gradient-to-r from-primary/5 to-accent/5 pointer-events-none"
        aria-hidden="true"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div className="order-2 lg:order-1">
            <div className="grid grid-cols-2 gap-4">
              {pillars.map((item, index) => {
                const Icon = item.icon;

                return (
                  <motion.div
                    key={item.title}
                    initial={shouldReduceMotion ? false : { opacity: 0, scale: 0.9 }}
                    whileInView={shouldReduceMotion ? undefined : { opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 }}
                    className="p-6 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-sm hover:border-primary/50 transition-colors"
                  >
                    <div className="mb-4">
                      <Icon className={`w-8 h-8 ${item.accent}`} aria-hidden="true" />
                    </div>
                    <h3 className="text-lg font-bold text-white mb-2">{item.title}</h3>
                    <p className="text-sm text-gray-400">{item.desc}</p>
                  </motion.div>
                );
              })}
            </div>
          </div>

          <div className="order-1 lg:order-2">
            <p className="text-sm font-semibold text-primary tracking-widest uppercase mb-4">
              Driving Innovation
            </p>
            <h2 className="text-4xl md:text-5xl font-bold mb-6 leading-tight text-balance">
              Driving Innovation Through <span className="text-gradient">Engineering</span>
            </h2>
            <p className="text-gray-400 text-lg mb-8 leading-relaxed">
              At GGI Tech, innovation means solving operational problems properly: strong
              architecture, modern infrastructure, and emerging technologies applied where they
              genuinely help.
            </p>

            <div className="flex items-start space-x-4">
              <div className="h-12 w-1 bg-primary rounded-full shrink-0" aria-hidden="true" />
              <div>
                <h3 className="text-lg font-bold text-white">Key Innovation Areas</h3>
                <p className="text-gray-500">
                  Institutional platforms, payment infrastructure, health technology, blockchain
                  infrastructure, and cloud-based systems.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
