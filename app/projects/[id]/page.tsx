import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ArrowRight, CheckCircle } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Illustration from "@/components/Illustration";
import { capabilities, getCapabilityBySlug } from "@/lib/content/capabilities";
import { createMetadata } from "@/lib/site";

type CapabilityRouteProps = { params: Promise<{ id: string }> };

export function generateStaticParams() {
  return capabilities.map((capability) => ({ id: capability.slug }));
}

export async function generateMetadata({ params }: CapabilityRouteProps): Promise<Metadata> {
  const { id } = await params;
  const capability = getCapabilityBySlug(id);

  if (!capability) {
    return createMetadata({
      title: "Capability Not Found",
      description: "The requested capability area could not be found.",
      path: `/projects/${id}`,
      noIndex: true,
    });
  }

  return createMetadata({
    title: capability.title,
    description: capability.summary,
    path: `/projects/${capability.slug}`,
    image: capability.image,
    keywords: [capability.title, ...capability.stack],
  });
}

export default async function CapabilityDetail({ params }: CapabilityRouteProps) {
  const { id } = await params;
  const capability = getCapabilityBySlug(id);

  if (!capability) {
    notFound();
  }

  const related = capabilities.filter((item) => item.slug !== capability.slug);

  return (
    <main id="main" className="min-h-screen bg-background text-white">
      <Navbar />

      <article className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <Link
          href="/projects"
          className="inline-flex items-center text-gray-400 hover:text-white mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" aria-hidden="true" />
          Back to Capabilities
        </Link>

        <header className="mb-16">
          <p className="text-sm font-semibold text-primary tracking-widest uppercase mb-4">
            Capability
          </p>
          <h1 className="text-4xl md:text-6xl font-bold mb-6 text-balance">{capability.title}</h1>
          <p className="text-xl text-gray-400 max-w-3xl leading-relaxed">{capability.summary}</p>
        </header>

        <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 mb-16">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-emerald-400/10 opacity-70" />
          <Illustration
            src={capability.image}
            alt={capability.imageAlt}
            className="w-full h-auto object-cover"
            priority
            sizes="(max-width: 1024px) 100vw, 1120px"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 mb-20">
          <div className="lg:col-span-2 space-y-12">
            <section>
              <h2 className="text-2xl font-bold mb-4">The Problem</h2>
              <p className="text-gray-400 leading-relaxed">{capability.problem}</p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">Our Approach</h2>
              <p className="text-gray-400 leading-relaxed mb-6">
                These are the engineering principles we apply to this class of system. They describe
                how we build, not results attributed to a specific client.
              </p>
              <ul className="space-y-4">
                {capability.approach.map((item) => (
                  <li key={item} className="flex items-start text-gray-300 leading-relaxed">
                    <CheckCircle
                      className="w-5 h-5 text-primary mr-3 flex-shrink-0 mt-0.5"
                      aria-hidden="true"
                    />
                    {item}
                  </li>
                ))}
              </ul>
            </section>
          </div>

          <aside className="bg-white/5 border border-white/10 rounded-2xl p-8 h-fit">
            <h2 className="text-xl font-bold mb-6">Typical Stack</h2>
            <div className="flex flex-wrap gap-2">
              {capability.stack.map((tech) => (
                <span
                  key={tech}
                  className="px-3 py-1 text-sm font-medium rounded-full bg-white/5 border border-white/10 text-gray-300"
                >
                  {tech}
                </span>
              ))}
            </div>
          </aside>
        </div>

        <section className="border-t border-white/10 pt-16">
          <h2 className="text-2xl font-bold mb-8">Related Capabilities</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {related.map((item) => (
              <Link
                key={item.slug}
                href={`/projects/${item.slug}`}
                className="group rounded-2xl bg-white/5 border border-white/10 hover:border-primary/50 transition-colors p-6"
              >
                <h3 className="text-lg font-semibold mb-2 group-hover:text-primary transition-colors">
                  {item.title}
                </h3>
                <p className="text-sm text-gray-400 leading-relaxed mb-4">{item.summary}</p>
                <span className="inline-flex items-center text-sm font-medium text-white group-hover:text-primary transition-colors">
                  Learn more
                  <ArrowRight
                    className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1"
                    aria-hidden="true"
                  />
                </span>
              </Link>
            ))}
          </div>
        </section>

        <div className="mt-20 text-center bg-white/5 border border-white/10 rounded-3xl p-12">
          <h2 className="text-3xl font-bold mb-6">Have a System Like This in Mind?</h2>
          <p className="text-gray-400 max-w-2xl mx-auto mb-8">
            Tell us about the platform you need. We will come back with a clear plan for
            architecture, delivery, and support.
          </p>
          <Link
            href="/project-brief"
            className="inline-flex items-center justify-center px-8 py-3.5 text-base font-medium text-white bg-primary rounded-full hover:bg-blue-600 transition-all duration-300"
          >
            Submit a Project Brief
            <ArrowRight className="w-4 h-4 ml-2" aria-hidden="true" />
          </Link>
        </div>
      </article>

      <Footer />
    </main>
  );
}
