import type { MetadataRoute } from "next";
import { blogPostsMeta } from "@/lib/blog/metadata";
import { capabilities } from "@/lib/content/capabilities";
import { absoluteUrl } from "@/lib/site";

type Entry = {
  path: string;
  changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
  priority: number;
  lastModified?: Date;
};

const staticEntries: Entry[] = [
  { path: "/", changeFrequency: "weekly", priority: 1 },
  { path: "/services", changeFrequency: "monthly", priority: 0.9 },
  { path: "/project-brief", changeFrequency: "monthly", priority: 0.9 },
  { path: "/about", changeFrequency: "monthly", priority: 0.8 },
  { path: "/projects", changeFrequency: "monthly", priority: 0.8 },
  { path: "/technology-lab", changeFrequency: "monthly", priority: 0.7 },
  { path: "/contact", changeFrequency: "monthly", priority: 0.7 },
  { path: "/blog", changeFrequency: "weekly", priority: 0.7 },
  { path: "/careers", changeFrequency: "monthly", priority: 0.6 },
  { path: "/privacy", changeFrequency: "yearly", priority: 0.3 },
  { path: "/terms", changeFrequency: "yearly", priority: 0.3 },
];

function parseDate(value: string): Date | undefined {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
}

export default function sitemap(): MetadataRoute.Sitemap {
  const capabilityEntries: Entry[] = capabilities.map((capability) => ({
    path: `/projects/${capability.slug}`,
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  const blogEntries: Entry[] = blogPostsMeta.map((post) => ({
    path: `/blog/${post.slug}`,
    changeFrequency: "monthly",
    priority: 0.6,
    lastModified: parseDate(post.date),
  }));

  return [...staticEntries, ...capabilityEntries, ...blogEntries].map((entry) => ({
    url: absoluteUrl(entry.path),
    // Only emit lastModified where a real date is known (blog posts). Stamping
    // every build's date onto static pages makes the value meaningless to
    // crawlers, so those entries omit it.
    ...(entry.lastModified ? { lastModified: entry.lastModified } : {}),
    changeFrequency: entry.changeFrequency,
    priority: entry.priority,
  }));
}
