"use client";

import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, ChevronRight } from "lucide-react";
import Link from "next/link";

const highlights = [
  "Institutional Platforms",
  "Payment Infrastructure",
  "Cloud & DevOps",
  "Blockchain Systems",
];

export default function Hero() {
  const reduceMotion = useReducedMotion();

  return (
    <section className="relative flex min-h-[100svh] items-center justify-center overflow-hidden bg-background px-4 pb-20 pt-32 sm:px-6 lg:px-8">
      <div aria-hidden="true" className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(59,130,246,0.25),transparent_50%),radial-gradient(circle_at_70%_60%,rgba(34,197,94,0.18),transparent_55%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.06)_1px,transparent_1px)] bg-[size:48px_48px] opacity-20" />
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-background to-transparent" />
      </div>

      <div className="relative z-10 mx-auto max-w-5xl text-center">
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: reduceMotion ? 0 : 0.8 }}
        >
          <h1 className="text-balance text-4xl font-bold leading-[1.1] tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
            <span className="bg-gradient-to-r from-white via-gray-200 to-gray-400 bg-clip-text text-transparent">
              Engineering the
            </span>
            <br /> <span className="text-gradient glow-text">Digital Infrastructure</span>
            <span className="bg-gradient-to-r from-white via-gray-200 to-gray-400 bg-clip-text text-transparent">
              {" "}
              of Tomorrow
            </span>
          </h1>

          <p className="mx-auto mt-8 max-w-2xl text-base leading-relaxed text-gray-400 sm:text-lg">
            We design and build secure, scalable platforms for institutions, businesses, and
            emerging technologies — from university portals and payment systems to cloud
            infrastructure and blockchain networks.
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/project-brief"
              className="group inline-flex w-full items-center justify-center rounded-full bg-primary px-8 py-3.5 text-base font-medium text-white transition-all duration-300 hover:bg-blue-600 hover:shadow-[0_0_30px_rgba(59,130,246,0.45)] sm:w-auto"
            >
              Start a Project
              <ArrowRight
                aria-hidden="true"
                className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1"
              />
            </Link>

            <Link
              href="/services"
              className="group inline-flex w-full items-center justify-center rounded-full border border-white/20 px-8 py-3.5 text-base font-medium text-white transition-all duration-300 hover:border-white/40 hover:bg-white/5 sm:w-auto"
            >
              Explore Our Services
              <ChevronRight
                aria-hidden="true"
                className="ml-2 h-4 w-4 opacity-60 transition-transform group-hover:translate-x-1 group-hover:opacity-100"
              />
            </Link>
          </div>

          <ul className="mx-auto mt-12 flex max-w-3xl flex-wrap items-center justify-center gap-x-6 gap-y-3">
            {highlights.map((item) => (
              <li
                key={item}
                className="text-xs font-medium uppercase tracking-wider text-gray-500 sm:text-sm"
              >
                {item}
              </li>
            ))}
          </ul>
        </motion.div>
      </div>

      <div
        aria-hidden="true"
        className={`absolute bottom-8 left-1/2 hidden -translate-x-1/2 sm:block ${
          reduceMotion ? "" : "animate-bounce"
        }`}
      >
        <div className="flex h-10 w-6 justify-center rounded-full border-2 border-white/20">
          <div className="mt-2 h-2 w-1 rounded-full bg-primary" />
        </div>
      </div>
    </section>
  );
}
