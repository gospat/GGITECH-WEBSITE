import type { LucideIcon } from "lucide-react";
import { Code, Server, Globe, Database, Cloud, Shield } from "lucide-react";

export type Service = {
  slug: string;
  title: string;
  summary: string;
  deliverables: string[];
  icon: LucideIcon;
  accent: string;
};

/**
 * Canonical list of services. Consumed by the home page section, the services
 * page, the footer navigation and structured data so the offering is described
 * identically everywhere.
 */
export const services: ReadonlyArray<Service> = [
  {
    slug: "software-engineering",
    title: "Software Engineering",
    summary:
      "Custom web applications, enterprise platforms, and API-driven systems built on modern, maintainable architecture.",
    deliverables: [
      "Custom Web Applications",
      "Enterprise Platforms",
      "Institutional Systems",
      "API Design & Development",
      "Database-Driven Applications",
      "Payment Integrations",
    ],
    icon: Code,
    accent: "text-primary",
  },
  {
    slug: "system-architecture",
    title: "System & Data Architecture",
    summary:
      "Architecture and data modelling for platforms that must stay correct, observable, and fast as usage grows.",
    deliverables: [
      "Backend System Design",
      "Database Architecture & Modelling",
      "API Infrastructure",
      "Scalable Platform Design",
      "Secure Data Handling",
      "Performance Optimisation",
    ],
    icon: Server,
    accent: "text-emerald-400",
  },
  {
    slug: "blockchain-web3",
    title: "Blockchain & Web3",
    summary:
      "Validator infrastructure, smart contracts, and blockchain integrations for decentralised products.",
    deliverables: [
      "Validator Node Infrastructure",
      "Smart Contract Development",
      "Blockchain Integrations",
      "Decentralised Applications",
      "Node Monitoring & Security",
      "Protocol Security Reviews",
    ],
    icon: Globe,
    accent: "text-purple-400",
  },
  {
    slug: "institutional-systems",
    title: "Institutional Systems",
    summary:
      "Portals and operational systems for universities, hospitals, and large organisations with complex workflows.",
    deliverables: [
      "University & Student Portals",
      "Bursary & Payment Workflows",
      "Records & Data Management",
      "Role-Based Access Control",
      "Reporting & Audit Trails",
      "System Integration",
    ],
    icon: Database,
    accent: "text-orange-400",
  },
  {
    slug: "cloud-devops",
    title: "Cloud & DevOps",
    summary:
      "Deployment, automation, and monitoring for Linux and cloud environments across AWS, Azure, and GCP.",
    deliverables: [
      "Server Provisioning & Hardening",
      "Linux Administration",
      "AWS, Azure & GCP Deployment",
      "CI/CD Pipelines",
      "Monitoring & Alerting",
      "Backup & Recovery",
    ],
    icon: Cloud,
    accent: "text-sky-400",
  },
  {
    slug: "security-engineering",
    title: "Security Engineering",
    summary:
      "Hardening, monitoring, and review services that treat security as a default rather than an afterthought.",
    deliverables: [
      "Security Assessments",
      "Application Hardening",
      "Authentication & Access Control",
      "Logging & Monitoring",
      "Vulnerability Remediation",
      "Incident Response Planning",
    ],
    icon: Shield,
    accent: "text-red-400",
  },
];

export type ProcessStep = { step: string; detail: string };

export const deliveryProcess: ReadonlyArray<ProcessStep> = [
  {
    step: "Discovery",
    detail:
      "We clarify the goal, the users, the constraints, and the definition of done before writing code.",
  },
  {
    step: "Architecture",
    detail:
      "Data models, interfaces, and infrastructure are designed so the system can scale without rework.",
  },
  {
    step: "Build",
    detail:
      "Delivery happens in reviewable increments with automated tests and staged environments.",
  },
  {
    step: "Launch",
    detail: "Deployment is automated, monitored, and reversible, with a documented rollback path.",
  },
  {
    step: "Support",
    detail:
      "We monitor performance, patch security issues, and extend the platform as requirements evolve.",
  },
];
