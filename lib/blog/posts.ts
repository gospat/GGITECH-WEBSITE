import "server-only";

import type { BlogPost, BlogPostMeta } from "@/lib/blog/types";
import { blogPostsMeta } from "@/lib/blog/metadata";
import { postCloudNative } from "@/lib/blog/posts/cloud-native-beyond-lift-and-shift";
import { postNodeScaling } from "@/lib/blog/posts/scaling-nodejs-architecture-for-millions";
import { postSecurityAI } from "@/lib/blog/posts/securing-digital-infrastructure-in-the-age-of-ai";
import { postValidatorPlaybook } from "@/lib/blog/posts/web3-validator-infrastructure-technical-playbook";

const posts: BlogPost[] = [postNodeScaling, postSecurityAI, postValidatorPlaybook, postCloudNative];

export function getAllBlogPostMeta(): BlogPostMeta[] {
  return blogPostsMeta;
}

export function getAllBlogPosts(): BlogPost[] {
  return posts;
}

export function getBlogPostBySlug(slug: string): BlogPost | undefined {
  return posts.find((p) => p.slug === slug);
}

