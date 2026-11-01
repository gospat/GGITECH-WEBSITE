import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SpotlightCard from "@/components/SpotlightCard";
import { ArrowLeft, Calendar, User } from "lucide-react";
import Link from "next/link";
import { blogPostsMeta } from "@/lib/blog/metadata";
import Illustration from "@/components/Illustration";
import { createMetadata } from "@/lib/site";

export const metadata: Metadata = createMetadata({
  title: "Insights & Research",
  description:
    "Technical deep dives from GGI Tech engineers on scaling architecture, securing infrastructure, cloud-native systems, and validator operations.",
  path: "/blog",
  keywords: ["engineering blog", "system architecture", "cloud native", "web3 infrastructure"],
});

export default function Blog() {
  return (
    <main id="main" className="min-h-screen bg-background text-white">
      <Navbar />

      <div className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <Link
          href="/"
          className="inline-flex items-center text-gray-400 hover:text-white mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Home
        </Link>

        <div className="mb-16">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">Insights & Research</h1>
          <p className="text-xl text-gray-400 max-w-3xl">
            Deep dives into technology, infrastructure, and the future of digital systems. Written
            by the engineers and researchers at GGI Tech.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {blogPostsMeta.map((post) => (
            <div key={post.slug}>
              <Link href={`/blog/${post.slug}`} className="block h-full">
                <SpotlightCard className="p-8 h-full flex flex-col group cursor-pointer hover:border-primary/50 transition-colors">
                  <div className="mb-6">
                    <div className="mb-6 overflow-hidden rounded-2xl border border-white/10 bg-white/5">
                      <Illustration
                        src={post.coverImageSrc}
                        alt={post.coverAlt}
                        className="w-full h-auto object-cover group-hover:scale-[1.03] transition-transform duration-700"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      />
                    </div>
                    <span className="inline-block px-3 py-1 text-xs font-medium rounded-full bg-primary/10 text-primary border border-primary/20 mb-4">
                      {post.category}
                    </span>
                    <h4 className="text-2xl font-bold mb-4 group-hover:text-primary transition-colors">
                      {post.title}
                    </h4>
                    <p className="text-gray-400 text-sm leading-relaxed mb-6">{post.excerpt}</p>
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
              </Link>
            </div>
          ))}
        </div>
      </div>

      <Footer />
    </main>
  );
}
