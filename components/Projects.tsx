"use client";

import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import Illustration from "@/components/Illustration";
import { capabilities } from "@/lib/content/capabilities";

export default function Projects() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <section id="projects" className="py-24 bg-background relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-16">
          <p className="text-sm font-semibold text-primary tracking-widest uppercase mb-4">
            Capability Areas
          </p>
          <h2 className="text-4xl md:text-5xl font-bold mb-4 text-balance">What We Build</h2>
          <p className="text-gray-400 max-w-2xl mx-auto">
            The systems we engineer, and how we approach them. Every description below is a
            statement of our engineering method, not a client case study.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {capabilities.map((capability, index) => (
            <motion.div
              key={capability.slug}
              initial={shouldReduceMotion ? false : { opacity: 0, y: 20 }}
              whileInView={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ delay: index * 0.1 }}
              className="group relative overflow-hidden rounded-2xl bg-white/5 border border-white/10 hover:border-primary/50 transition-all duration-500 flex flex-col"
            >
              <div className="aspect-video bg-gray-800 relative overflow-hidden">
                <div className="absolute inset-0 transition-transform duration-600 group-hover:scale-[1.04]">
                  <Illustration
                    src={capability.image}
                    alt={capability.imageAlt}
                    className="h-full w-full object-cover opacity-95"
                    sizes="(max-width: 768px) 100vw, 50vw"
                  />
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent opacity-60 z-10" />
                <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-emerald-400/10 opacity-60 z-10" />
              </div>

              <div className="p-8 relative z-20 flex flex-col flex-1">
                <h3 className="text-2xl font-bold mb-3 group-hover:text-primary transition-colors">
                  {capability.title}
                </h3>
                <p className="text-gray-400 mb-6 leading-relaxed">{capability.summary}</p>

                <div className="flex flex-wrap gap-2 mb-6">
                  {capability.stack.map((tech) => (
                    <span
                      key={tech}
                      className="px-3 py-1 text-xs font-medium rounded-full bg-primary/10 text-primary border border-primary/20"
                    >
                      {tech}
                    </span>
                  ))}
                </div>

                <div className="mt-auto">
                  <Link
                    href={`/projects/${capability.slug}`}
                    className="inline-flex items-center text-sm font-medium text-white hover:text-primary transition-colors"
                  >
                    Explore this capability
                    <ArrowRight
                      className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1"
                      aria-hidden="true"
                    />
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
