"use client";

import { motion, useReducedMotion } from "framer-motion";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import SpotlightCard from "./SpotlightCard";
import Illustration from "@/components/Illustration";
import { services } from "@/lib/content/services";

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
  const shouldReduceMotion = useReducedMotion();

  return (
    <section id="services" className="py-24 bg-background relative">
      <div
        className="absolute inset-0 bg-grid-white/[0.02] bg-[length:40px_40px]"
        aria-hidden="true"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-16">
          <p className="text-sm font-semibold text-primary tracking-widest uppercase mb-4">
            Our Expertise
          </p>
          <h2 className="text-4xl md:text-5xl font-bold mb-4 text-balance">Services We Provide</h2>
          <p className="text-gray-400 max-w-2xl mx-auto">
            We design and build custom web applications, enterprise platforms, and institutional
            systems on modern, maintainable architecture.
          </p>
        </div>

        <motion.div
          initial={shouldReduceMotion ? false : { opacity: 0, y: 16 }}
          whileInView={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="max-w-5xl mx-auto mb-14"
        >
          <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/5">
            <div
              className="absolute inset-0 bg-gradient-to-r from-primary/10 to-emerald-400/10 opacity-70"
              aria-hidden="true"
            />
            <Illustration
              src="/images/illustrations/services-banner.jpg"
              alt="Illustration of cloud infrastructure, APIs, and secure systems"
              className="w-full h-auto object-cover opacity-90"
              sizes="(max-width: 1024px) 100vw, 960px"
            />
          </div>
        </motion.div>

        <motion.div
          variants={container}
          initial={shouldReduceMotion ? false : "hidden"}
          whileInView={shouldReduceMotion ? undefined : "show"}
          viewport={{ once: true, margin: "-100px" }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
        >
          {services.map((service) => {
            const Icon = service.icon;

            return (
              <motion.div key={service.slug} variants={item} className="h-full">
                <SpotlightCard className="p-8 h-full group">
                  <div className="mb-6 p-3 bg-white/5 rounded-lg w-fit group-hover:scale-110 transition-transform duration-300">
                    <Icon className={`w-8 h-8 ${service.accent}`} aria-hidden="true" />
                  </div>
                  <h3 className="text-xl font-bold mb-3 group-hover:text-primary transition-colors">
                    {service.title}
                  </h3>
                  <p className="text-gray-400 leading-relaxed">{service.summary}</p>
                </SpotlightCard>
              </motion.div>
            );
          })}
        </motion.div>

        <div className="mt-14 text-center">
          <Link
            href="/services"
            className="inline-flex items-center text-white hover:text-primary transition-colors group"
          >
            See all services in detail
            <ArrowRight
              className="ml-2 w-4 h-4 transition-transform group-hover:translate-x-1"
              aria-hidden="true"
            />
          </Link>
        </div>
      </div>
    </section>
  );
}
