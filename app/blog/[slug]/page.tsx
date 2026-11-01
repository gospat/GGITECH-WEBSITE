import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { getBlogPostBySlug } from "@/lib/blog/posts";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import Illustration from "@/components/Illustration";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = getBlogPostBySlug(slug);
  if (!post) return {};
  return {
    title: `${post.title} | GGI Tech`,
    description: post.excerpt,
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = getBlogPostBySlug(slug);
  if (!post) notFound();

  return (
    <main className="min-h-screen bg-background text-white">
      <Navbar />

      <div className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
        <Link
          href="/blog"
          className="inline-flex items-center text-gray-400 hover:text-white mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Blog
        </Link>

        <header className="mb-10">
          <div className="inline-flex items-center gap-2 text-xs font-medium rounded-full bg-primary/10 text-primary border border-primary/20 px-3 py-1 mb-4">
            <span>{post.category}</span>
            <span className="text-primary/60">•</span>
            <span>{post.readingTimeMinutes} min read</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">{post.title}</h1>
          <div className="text-sm text-gray-400">
            <span className="text-gray-200">{post.author}</span>
            <span className="mx-2">•</span>
            <span>{post.date}</span>
          </div>
        </header>

        <div className="mb-10 overflow-hidden rounded-2xl border border-white/10 bg-white/5">
          <Illustration
            src={post.coverImageSrc}
            alt={post.coverAlt}
            className="w-full h-auto object-cover"
            priority
            sizes="(max-width: 1024px) 100vw, 768px"
          />
        </div>

        <article className="prose prose-invert max-w-none">
          {post.blocks.map((b, i) => {
            if (b.type === "h2") return <h2 key={i}>{b.text}</h2>;
            if (b.type === "h3") return <h3 key={i}>{b.text}</h3>;
            if (b.type === "ul")
              return (
                <ul key={i}>
                  {b.items.map((it) => (
                    <li key={it}>{it}</li>
                  ))}
                </ul>
              );
            return <p key={i}>{b.text}</p>;
          })}
        </article>
      </div>

      <Footer />
    </main>
  );
}
