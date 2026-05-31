import type { BlogPostMeta } from "@/lib/blog/types";

export const blogPostsMeta: BlogPostMeta[] = [
  {
    slug: "scaling-nodejs-architecture-for-millions",
    title: "Scaling Node.js Architecture for Millions of Users",
    excerpt:
      "A practical blueprint for designing Node.js platforms that stay fast under load: throughput modeling, caching layers, queues, database strategy, observability, and safe deployment patterns.",
    date: "March 10, 2026",
    author: "GGI Engineering",
    category: "Systems",
    readingTimeMinutes: 16,
  },
  {
    slug: "web3-validator-infrastructure-technical-playbook",
    title: "Web3 Validator Infrastructure: A Technical Playbook",
    excerpt:
      "From hardware selection to monitoring and incident response—how we think about running validator infrastructure as a real production system with measurable SLOs.",
    date: "February 28, 2026",
    author: "GGI DevOps",
    category: "Web3",
    readingTimeMinutes: 15,
  },
  {
    slug: "cloud-native-beyond-lift-and-shift",
    title: "Cloud Native: Moving Beyond Lift-and-Shift",
    excerpt:
      "Cloud modernization isn’t just hosting VMs. Explore event-driven designs, managed services, CI/CD, zero-downtime releases, and cost controls that keep systems reliable and scalable.",
    date: "February 15, 2026",
    author: "GGI Cloud",
    category: "Cloud",
    readingTimeMinutes: 15,
  },
  {
    slug: "securing-digital-infrastructure-in-the-age-of-ai",
    title: "Securing Digital Infrastructure in the Age of AI",
    excerpt:
      "Modern security is about reducing blast radius and shortening detection time. We cover threat modeling, secure defaults, logging, and AI-era attack patterns that teams must plan for.",
    date: "March 05, 2026",
    author: "GGI Security",
    category: "Security",
    readingTimeMinutes: 16,
  },
];

