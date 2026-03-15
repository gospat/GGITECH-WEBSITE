"use client";

import { motion } from "framer-motion";
import { ArrowRight, Calendar, User } from "lucide-react";
import Link from "next/link";
import SpotlightCard from "./SpotlightCard";

const insights = [
  {
    title: "The Future of Blockchain in Institutional Banking",
    excerpt: "How decentralized ledgers are revolutionizing settlement layers for major financial institutions.",
    date: "March 15, 2026",
    author: "GGI Research",
    category: "Blockchain",
    link: "#",
  },
  {
    title: "Scaling Node.js Architecture for Millions of Users",
    excerpt: "Best practices for building resilient, high-throughput backend systems using Node.js and Microservices.",
    date: "March 10, 2026",
    author: "Engineering Team",
    category: "Engineering",
    link: "#",
  },
  {
    title: "Securing Digital Infrastructure in the Age of AI",
    excerpt: "New cybersecurity paradigms required to protect enterprise data from AI-driven threats.",
    date: "March 05, 2026",
    author: "Security Ops",
    category: "Security",
    link: "#",
  },
];

export default function Insights() {
  return (
    <section id="insights" className="py-24 bg-background relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="flex flex-col md:flex-row justify-between items-end mb-12">
          <div>
            <h2 className="text-sm font-semibold text-primary tracking-widest uppercase mb-4">
              Latest Insights
            </h2>
            <h3 className="text-4xl md:text-5xl font-bold">
              Thoughts & Research
            </h3>
          </div>
          <Link
            href="/blog"
            className="hidden md:inline-flex items-center text-white hover:text-primary transition-colors mt-4 md:mt-0 group"
          >
            View All Articles
            <ArrowRight className="ml-2 w-4 h-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {insights.map((post, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ delay: index * 0.1 }}
            >
              <SpotlightCard className="p-8 h-full flex flex-col group">
                <div className="mb-6">
                  <span className="inline-block px-3 py-1 text-xs font-medium rounded-full bg-primary/10 text-primary border border-primary/20 mb-4">
                    {post.category}
                  </span>
                  <h4 className="text-xl font-bold mb-3 group-hover:text-primary transition-colors line-clamp-2">
                    {post.title}
                  </h4>
                  <p className="text-gray-400 text-sm leading-relaxed mb-6 line-clamp-3">
                    {post.excerpt}
                  </p>
                </div>
                
                <div className="mt-auto flex items-center justify-between text-xs text-gray-500 border-t border-white/10 pt-4">
                  <div className="flex items-center">
                    <Calendar className="w-3 h-3 mr-1" />
                    {post.date}
                  </div>
                  <div className="flex items-center">
                    <User className="w-3 h-3 mr-1" />
                    {post.author}
                  </div>
                </div>
              </SpotlightCard>
            </motion.div>
          ))}
        </div>

        <div className="mt-8 text-center md:hidden">
          <Link
            href="/blog"
            className="inline-flex items-center text-white hover:text-primary transition-colors"
          >
            View All Articles
            <ArrowRight className="ml-2 w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
