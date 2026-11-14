"use client";

import { motion, useReducedMotion } from "framer-motion";
import { AlertCircle, CheckCircle, Loader2, Mail, MapPin, Send } from "lucide-react";
import Link from "next/link";
import { useState, type FormEvent } from "react";
import { MIN_MESSAGE_LENGTH } from "@/lib/contactMessage";
import { site } from "@/lib/site";

type FormState = {
  name: string;
  email: string;
  company: string;
  message: string;
  companyWebsite: string;
};

const emptyForm: FormState = {
  name: "",
  email: "",
  company: "",
  message: "",
  companyWebsite: "",
};

const inputClass =
  "w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-gray-500 transition-colors focus:border-primary";

type Props = {
  /**
   * Heading level for the section title. The home page already renders an h1 in
   * the hero, so it uses the default h2. The dedicated contact page has no other
   * heading and passes "h1".
   */
  headingLevel?: "h1" | "h2";
};

export default function Contact({ headingLevel = "h2" }: Props) {
  const Heading = headingLevel;
  const reduceMotion = useReducedMotion();
  const [form, setForm] = useState<FormState>(emptyForm);
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((previous) => ({ ...previous, [key]: value }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus("submitting");
    setErrorMessage(null);

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const result: { ok?: boolean; error?: string; errors?: string[] } = await response
        .json()
        .catch(() => ({}));

      if (!response.ok || !result.ok) {
        setStatus("error");
        setErrorMessage(
          result.error ??
            result.errors?.[0] ??
            `Something went wrong. Please email ${site.email} directly.`
        );
        return;
      }

      setForm(emptyForm);
      setStatus("success");
    } catch {
      setStatus("error");
      setErrorMessage(
        `We could not reach the server. Please check your connection or email ${site.email} directly.`
      );
    }
  };

  return (
    <section id="contact" className="relative overflow-hidden bg-background py-24">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-gradient-to-t from-primary/10 to-transparent opacity-20"
      />

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 items-start gap-12 lg:grid-cols-2 lg:gap-16">
          <div>
            <p className="mb-4 text-sm font-semibold uppercase tracking-widest text-primary">
              Let&apos;s Build the Future Together
            </p>
            <Heading className="mb-6 text-4xl font-bold leading-tight md:text-5xl">
              Start Your <span className="text-gradient">Project</span>
            </Heading>
            <p className="mb-8 text-base leading-relaxed text-gray-400 sm:text-lg">
              Tell us what you are building and we will respond with a clear path forward. If you
              already have detailed requirements, use the project brief form so we can scope your
              request properly.
            </p>

            <div className="mb-10 rounded-2xl border border-white/10 bg-white/5 p-6">
              <p className="mb-4 leading-relaxed text-gray-300">
                To get the most useful response, include:
              </p>
              <ul className="space-y-2 text-gray-300">
                <li className="flex items-start">
                  <span className="mr-3 text-primary" aria-hidden="true">
                    •
                  </span>
                  The problem the system solves and who it is for.
                </li>
                <li className="flex items-start">
                  <span className="mr-3 text-primary" aria-hidden="true">
                    •
                  </span>
                  Any must-have integrations (payments, auth, data sources).
                </li>
                <li className="flex items-start">
                  <span className="mr-3 text-primary" aria-hidden="true">
                    •
                  </span>
                  Security or compliance needs (PII, finance, healthcare, audit logs).
                </li>
              </ul>
              <Link
                href="/project-brief"
                className="mt-5 inline-flex items-center font-medium text-primary transition-colors hover:text-white"
              >
                Open the full project brief
                <span aria-hidden="true" className="ml-2">
                  →
                </span>
              </Link>
            </div>

            <address className="space-y-6 not-italic">
              <div className="flex items-start gap-4">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/20 text-primary">
                  <Mail className="h-6 w-6" aria-hidden="true" />
                </span>
                <div>
                  <h3 className="font-semibold text-white">Email Us</h3>
                  <a
                    href={`mailto:${site.email}`}
                    className="text-gray-400 transition-colors hover:text-primary"
                  >
                    {site.email}
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/20 text-primary">
                  <MapPin className="h-6 w-6" aria-hidden="true" />
                </span>
                <div>
                  <h3 className="font-semibold text-white">Where We Work</h3>
                  <p className="text-gray-400">{site.location}</p>
                </div>
              </div>
            </address>
          </div>

          <motion.div
            initial={reduceMotion ? false : { opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: reduceMotion ? 0 : 0.5 }}
            className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm sm:p-8"
          >
            {status === "success" ? (
              <div
                role="status"
                aria-live="polite"
                className="flex min-h-[320px] flex-col items-center justify-center text-center"
              >
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-500/20">
                  <CheckCircle className="h-8 w-8 text-green-500" aria-hidden="true" />
                </div>
                <h3 className="mb-2 text-2xl font-bold text-white">Message Sent</h3>
                <p className="text-gray-400">
                  Thank you for reaching out. A confirmation has been sent to your inbox and our
                  team will respond shortly.
                </p>
                <button
                  type="button"
                  onClick={() => setStatus("idle")}
                  className="mt-6 font-medium text-primary transition-colors hover:text-white"
                >
                  Send another message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5" noValidate>
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="contact-name"
                      className="mb-2 block text-sm font-medium text-gray-300"
                    >
                      Name <span className="text-primary">*</span>
                    </label>
                    <input
                      id="contact-name"
                      name="name"
                      type="text"
                      required
                      autoComplete="name"
                      value={form.name}
                      onChange={(event) => update("name", event.target.value)}
                      className={inputClass}
                      placeholder="Your name"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="contact-email"
                      className="mb-2 block text-sm font-medium text-gray-300"
                    >
                      Email <span className="text-primary">*</span>
                    </label>
                    <input
                      id="contact-email"
                      name="email"
                      type="email"
                      required
                      autoComplete="email"
                      value={form.email}
                      onChange={(event) => update("email", event.target.value)}
                      className={inputClass}
                      placeholder="you@company.com"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="contact-company"
                    className="mb-2 block text-sm font-medium text-gray-300"
                  >
                    Organisation <span className="text-gray-500">(optional)</span>
                  </label>
                  <input
                    id="contact-company"
                    name="company"
                    type="text"
                    autoComplete="organization"
                    value={form.company}
                    onChange={(event) => update("company", event.target.value)}
                    className={inputClass}
                    placeholder="Company or institution"
                  />
                </div>

                <div>
                  <label
                    htmlFor="contact-message"
                    className="mb-2 block text-sm font-medium text-gray-300"
                  >
                    Message <span className="text-primary">*</span>
                  </label>
                  <textarea
                    id="contact-message"
                    name="message"
                    rows={5}
                    required
                    minLength={MIN_MESSAGE_LENGTH}
                    value={form.message}
                    onChange={(event) => update("message", event.target.value)}
                    className={`${inputClass} resize-y`}
                    placeholder="Tell us about the system you want to build..."
                  />
                </div>

                {/* Honeypot — hidden from users and assistive technology. */}
                <div className="hidden" aria-hidden="true">
                  <label htmlFor="contact-company-website">Company website</label>
                  <input
                    id="contact-company-website"
                    name="companyWebsite"
                    type="text"
                    tabIndex={-1}
                    autoComplete="off"
                    value={form.companyWebsite}
                    onChange={(event) => update("companyWebsite", event.target.value)}
                  />
                </div>

                {status === "error" && errorMessage ? (
                  <div
                    role="alert"
                    className="flex items-start gap-3 rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200"
                  >
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                    <span>{errorMessage}</span>
                  </div>
                ) : null}

                <button
                  type="submit"
                  disabled={status === "submitting"}
                  aria-busy={status === "submitting"}
                  className="inline-flex w-full items-center justify-center rounded-full bg-primary px-8 py-3.5 text-base font-medium text-white transition-all duration-300 hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {status === "submitting" ? (
                    <>
                      Sending
                      <Loader2 className="ml-2 h-4 w-4 animate-spin" aria-hidden="true" />
                    </>
                  ) : (
                    <>
                      Send Message
                      <Send className="ml-2 h-4 w-4" aria-hidden="true" />
                    </>
                  )}
                </button>

                <p className="text-xs leading-relaxed text-gray-500">
                  We use your details only to respond to your enquiry. See our{" "}
                  <Link href="/privacy" className="text-primary hover:text-white">
                    privacy policy
                  </Link>
                  .
                </p>
              </form>
            )}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
