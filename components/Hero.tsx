"use client";

import { motion } from "framer-motion";
import { ArrowRight, ChevronRight } from "lucide-react";
import Link from "next/link";
import dynamic from "next/dynamic";

const Background3D = dynamic(() => import("./HeroBackground3D"), { ssr: false });

export default function Hero() {
  const enable3D = process.env.NEXT_PUBLIC_ENABLE_3D === "true";

  return (
    <section className="relative h-screen flex items-center justify-center overflow-hidden bg-background">
      {enable3D ? (
        <Background3D />
      ) : (
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(59,130,246,0.25),transparent_50%),radial-gradient(circle_at_70%_60%,rgba(34,197,94,0.18),transparent_55%)]" />
          <div className="absolute inset-0 opacity-20 bg-[linear-gradient(to_right,rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.06)_1px,transparent_1px)] bg-[size:48px_48px]" />
        </div>
      )}
      
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 bg-clip-text text-transparent bg-gradient-to-r from-white via-gray-200 to-gray-400">
            Engineering the <br />
            <span className="text-primary glow-text">Digital Infrastructure</span> of Tomorrow
          </h1>
          
          <p className="mt-6 text-xl text-gray-400 max-w-3xl mx-auto leading-relaxed">
            GGI Tech, a technology division of GOSPAT GLOBAL INNOVATIONS LTD, builds secure, scalable, and intelligent digital systems for institutions, businesses, and emerging technologies.
          </p>
          
          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              href="/technology-lab"
              className="group relative inline-flex items-center justify-center px-8 py-3 text-base font-medium text-white bg-primary rounded-full overflow-hidden transition-all duration-300 hover:bg-blue-600 hover:scale-105 glow"
            >
              <span className="mr-2">Explore Our Technology</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </Link>
            
            <Link
              href="/project-brief"
              className="group inline-flex items-center justify-center px-8 py-3 text-base font-medium text-white border border-white/20 rounded-full hover:bg-white/5 transition-all duration-300"
            >
              Submit a Project Brief
              <ChevronRight className="w-4 h-4 ml-2 opacity-0 group-hover:opacity-100 transition-all transform translate-x-[-10px] group-hover:translate-x-0" />
            </Link>
          </div>
        </motion.div>
      </div>

      <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 animate-bounce">
        <div className="w-6 h-10 border-2 border-white/20 rounded-full flex justify-center">
          <div className="w-1 h-2 bg-primary rounded-full mt-2"></div>
        </div>
      </div>
    </section>
  );
}
