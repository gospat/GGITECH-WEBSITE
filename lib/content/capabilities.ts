export type Capability = {
  slug: string;
  title: string;
  summary: string;
  problem: string;
  approach: string[];
  stack: string[];
  image: string;
  imageAlt: string;
};

/**
 * Capability areas describing how we build, not client-attributed case studies.
 * Every claim here is a description of our engineering approach, which keeps the
 * site credible without publishing unverifiable metrics or client names.
 */
export const capabilities: ReadonlyArray<Capability> = [
  {
    slug: "institutional-platforms",
    title: "Institutional Platforms",
    summary: "Portals and operational systems for universities, colleges, and large organisations.",
    problem:
      "Institutions run on fragmented spreadsheets, disconnected record systems, and manual approvals that break down at scale and leave no audit trail.",
    approach: [
      "Model records, academic structure, and approval workflows before any interface is built.",
      "Implement role-based access so students, staff, bursary, and administrators each see only what they should.",
      "Add audit logging to every state change so financial and academic records are traceable.",
      "Design for intermittent connectivity and shared devices, which institutional users often rely on.",
    ],
    stack: ["Next.js", "Node.js", "PostgreSQL", "Redis", "Docker"],
    image: "/images/projects/curriculum.jpg",
    imageAlt:
      "Illustration of an institutional records platform with structured data and workflow nodes",
  },
  {
    slug: "payment-infrastructure",
    title: "Payment Infrastructure",
    summary:
      "Payment flows, gateway integrations, and reconciliation for institutions and businesses.",
    problem:
      "Payment systems fail when retries create duplicate charges, when gateway callbacks are untrusted, and when reconciliation is manual.",
    approach: [
      "Treat every transaction as idempotent so retries and duplicate callbacks cannot double-charge.",
      "Verify gateway webhooks cryptographically before any ledger entry is written.",
      "Record a complete audit trail for each payment, refund, and reversal.",
      "Automate reconciliation reporting so finance teams are not rebuilding figures by hand.",
    ],
    stack: ["Next.js", "Node.js", "PostgreSQL", "Redis", "Kubernetes"],
    image: "/images/projects/university-payment.jpg",
    imageAlt: "Illustration of a secure payment flow with gateway and reconciliation stages",
  },
  {
    slug: "healthcare-platforms",
    title: "Healthcare Platforms",
    summary:
      "Telemedicine and clinical data platforms built around privacy, auditability, and uptime.",
    problem:
      "Clinical systems hold sensitive data and cannot tolerate downtime or ambiguous access rules, yet are often built without those constraints in mind.",
    approach: [
      "Encrypt sensitive data at rest and in transit, and minimise what is retained at all.",
      "Restrict record access by role and log every access to patient data.",
      "Design real-time consultation channels with graceful degradation when bandwidth drops.",
      "Provision redundant infrastructure with health checks and automated failover.",
    ],
    stack: ["React", "Node.js", "WebRTC", "PostgreSQL", "Docker"],
    image: "/images/projects/telemedicine.jpg",
    imageAlt: "Illustration of a telemedicine consultation platform with secure data channels",
  },
  {
    slug: "blockchain-infrastructure",
    title: "Blockchain Infrastructure",
    summary:
      "Validator node operation, blockchain integrations, and monitoring for decentralised networks.",
    problem:
      "Validator and node infrastructure demands high uptime, disciplined key management, and monitoring that catches degradation before it causes missed rewards.",
    approach: [
      "Harden host systems and isolate signing keys from the public-facing node.",
      "Configure alerting on slot performance, peer count, and resource pressure.",
      "Automate provisioning so a node can be rebuilt predictably after failure.",
      "Review contract and integration code for common exploit patterns before deployment.",
    ],
    stack: ["Rust", "Solana", "Linux", "Prometheus", "Grafana"],
    image: "/images/projects/web3-validator.jpg",
    imageAlt: "Illustration of blockchain validator nodes with monitoring dashboards",
  },
];

export function getCapabilityBySlug(slug: string): Capability | undefined {
  return capabilities.find((capability) => capability.slug === slug);
}
