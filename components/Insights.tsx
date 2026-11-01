"use client";

import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Calendar, User } from "lucide-react";
import Link from "next/link";
import SpotlightCard from "./SpotlightCard";
import { blogPostsMeta } from "@/lib/blog/metadata";
import Illustration from "@/components/Illustration";

export default function Insights() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <section id="insights" className="py-24 bg-background relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="flex flex-col md:flex-row justify-between items-end mb-12">
          <div>
            <p className="text-sm font-semibold text-primary tracking-widest uppercase mb-4">
              Latest Insights
            </p>
            <h2 className="text-4xl md:text-5xl font-bold text-balance">Thoughts & Research</h2>
          </div>
          <Link
            href="/blog"
            className="hidden md:inline-flex items-center text-white hover:text-primary transition-colors mt-4 md:mt-0 group"
          >
            View All Articles
            <ArrowRight
              className="ml-2 w-4 h-4 transition-transform group-hover:translate-x-1"
              aria-hidden="true"
            />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {blogPostsMeta.slice(0, 3).map((post, index) => (
            <motion.div
              key={post.slug}
              initial={shouldReduceMotion ? false : { opacity: 0, y: 20 }}
              whileInView={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ delay: index * 0.1 }}
            >
              <Link href={`/blog/${post.slug}`} className="block h-full">
                <SpotlightCard className="p-8 h-full flex flex-col group">
                  <div className="mb-6">
                    <div className="mb-6 overflow-hidden rounded-2xl border border-white/10 bg-white/5">
                      <Illustration
                        src={post.coverImageSrc}
                        alt={post.coverAlt}
                        className="w-full h-auto object-cover group-hover:scale-[1.03] transition-transform duration-700"
                        sizes="(max-width: 768px) 100vw, 33vw"
                      />
                    </div>
                    <span className="inline-block px-3 py-1 text-xs font-medium rounded-full bg-primary/10 text-primary border border-primary/20 mb-4">
                      {post.category}
                    </span>
                    <h3 className="text-xl font-bold mb-3 group-hover:text-primary transition-colors line-clamp-2">
                      {post.title}
                    </h3>
                    <p className="text-gray-400 text-sm leading-relaxed mb-6 line-clamp-3">
                      {post.excerpt}
                    </p>
                  </div>

                  <div className="mt-auto flex items-center justify-between text-xs text-gray-500 border-t border-white/10 pt-4">
                    <div className="flex items-center">
                      <Calendar className="w-3 h-3 mr-1" aria-hidden="true" />
                      {post.date}
                    </div>
                    <div className="flex items-center">
                      <User className="w-3 h-3 mr-1" aria-hidden="true" />
                      {post.author}
                    </div>
                  </div>
                </SpotlightCard>
              </Link>
            </motion.div>
          ))}
        </div>

        <div className="mt-8 text-center md:hidden">
          <Link
            href="/blog"
            className="inline-flex items-center text-white hover:text-primary transition-colors"
          >
            View All Articles
            <ArrowRight className="ml-2 w-4 h-4" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </section>
  );
}
