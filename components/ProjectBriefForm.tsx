"use client";

import { useMemo, useState, type FormEvent } from "react";
import { Loader2, CheckCircle, AlertTriangle, Send } from "lucide-react";
import type { ProjectBriefSubmission, YesNo } from "@/lib/projectBrief";

type ApiError = { ok: false; error?: string; errors?: string[] };

const inputBase =
  "w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-primary transition-colors";
const labelBase = "block text-sm font-medium text-gray-400 mb-2";

function yesNoOptions(): { label: string; value: YesNo }[] {
  return [
    { label: "Yes", value: "yes" },
    { label: "No", value: "no" },
  ];
}

export default function ProjectBriefForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errors, setErrors] = useState<string[]>([]);

  const [form, setForm] = useState(() => {
    const initial: ProjectBriefSubmission & { referenceWebsitesText: string } = {
      contact: {
        clientName: "",
        email: "",
        phone: "",
        preferredContactMethod: "email",
        companyWebsite: "",
      },
      business: {
        businessName: "",
        businessDescription: "",
        targetAudience: "",
        location: "",
      },
      goals: {
        mainPurpose: "",
        desiredUserActions: "",
      },
      features: {
        contactForm: true,
        userAuth: false,
        adminDashboard: false,
        paymentIntegration: false,
        blogNews: false,
        bookingSystem: false,
        chatSystem: false,
        analyticsTracking: true,
        seoSetup: true,
        multilingual: false,
        other: "",
      },
      pagesRequired: "",
      design: {
        colorScheme: "",
        hasLogo: "no",
        referenceWebsites: [],
        preferredStyle: "",
        accessibilityPriority: "yes",
      },
      content: {
        provideText: "no",
        provideMedia: "no",
        needContentHelp: "no",
      },
      domainHosting: {
        hasDomain: "no",
        domainDetails: "",
        needHostingHelp: "no",
      },
      timeline: "",
      budget: "",
      additionalNotes: "",
      consent: false,
      referenceWebsitesText: "",
    };
    return initial;
  });

  const referenceWebsites = useMemo(() => {
    return form.referenceWebsitesText
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, 10);
  }, [form.referenceWebsitesText]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setErrors([]);
    setIsSubmitting(true);

    try {
      const payload: ProjectBriefSubmission = {
        contact: form.contact,
        business: form.business,
        goals: form.goals,
        features: form.features,
        pagesRequired: form.pagesRequired,
        design: { ...form.design, referenceWebsites },
        content: form.content,
        domainHosting: form.domainHosting,
        timeline: form.timeline,
        budget: form.budget,
        additionalNotes: form.additionalNotes,
        consent: form.consent,
      };

      const res = await fetch("/api/project-brief", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as ApiError | null;
        if (data?.errors?.length) setErrors(data.errors);
        setError(data?.error || "Submission failed. Please check the form and try again.");
        setIsSubmitting(false);
        return;
      }

      setIsSubmitting(false);
      setIsSuccess(true);
    } catch {
      setIsSubmitting(false);
      setError("Submission failed. Please try again.");
    }
  };

  if (isSuccess) {
    return (
      <div className="bg-white/5 border border-white/10 p-8 rounded-2xl backdrop-blur-sm">
        <div className="flex flex-col items-center justify-center text-center py-10">
          <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Brief Submitted</h2>
          <p className="text-gray-400 max-w-xl">
            Thank you. A confirmation has been sent to your email, and our team has received your
            project brief.
          </p>
          <button
            onClick={() => {
              setIsSuccess(false);
              setForm((prev) => ({ ...prev, consent: false }));
            }}
            className="mt-6 text-primary hover:text-white transition-colors"
          >
            Submit another brief
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/5 border border-white/10 p-8 rounded-2xl backdrop-blur-sm">
      <form onSubmit={handleSubmit} className="space-y-10">
        {(error || errors.length > 0) && (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-400 mt-0.5" />
              <div className="text-sm">
                <div className="text-red-200 font-medium">
                  {error || "Please fix the issues below:"}
                </div>
                {errors.length > 0 && (
                  <ul className="mt-2 text-red-200/80 list-disc pl-5 space-y-1">
                    {errors.map((m) => (
                      <li key={m}>{m}</li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        )}

        <div>
          <h2 className="text-xl font-semibold text-white mb-2">1. Business Information</h2>
          <p className="text-gray-400 text-sm mb-6">
            Provide accurate information so we can understand your business context and audience.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className={labelBase} htmlFor="businessName">
                Business Name
              </label>
              <input
                id="businessName"
                required
                className={inputBase}
                value={form.business.businessName}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    business: { ...p.business, businessName: e.target.value },
                  }))
                }
              />
            </div>
            <div>
              <label className={labelBase} htmlFor="location">
                Location (City/Country)
              </label>
              <input
                id="location"
                className={inputBase}
                value={form.business.location}
                onChange={(e) =>
                  setForm((p) => ({ ...p, business: { ...p.business, location: e.target.value } }))
                }
              />
            </div>
          </div>

          <div className="mt-6">
            <label className={labelBase} htmlFor="businessDescription">
              Business Description (What do you do?)
            </label>
            <textarea
              id="businessDescription"
              required
              rows={4}
              className={`${inputBase} resize-none`}
              value={form.business.businessDescription}
              onChange={(e) =>
                setForm((p) => ({
                  ...p,
                  business: { ...p.business, businessDescription: e.target.value },
                }))
              }
            />
          </div>

          <div className="mt-6">
            <label className={labelBase} htmlFor="targetAudience">
              Target Audience (Who are your customers?)
            </label>
            <textarea
              id="targetAudience"
              rows={3}
              className={`${inputBase} resize-none`}
              value={form.business.targetAudience}
              onChange={(e) =>
                setForm((p) => ({
                  ...p,
                  business: { ...p.business, targetAudience: e.target.value },
                }))
              }
            />
          </div>
        </div>

        <div>
          <h2 className="text-xl font-semibold text-white mb-2">2. Project Goal</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className={labelBase} htmlFor="mainPurpose">
                What is the main purpose of the website?
              </label>
              <input
                id="mainPurpose"
                required
                placeholder="Informational, E-commerce, Booking, Portfolio, Blog..."
                className={inputBase}
                value={form.goals.mainPurpose}
                onChange={(e) =>
                  setForm((p) => ({ ...p, goals: { ...p.goals, mainPurpose: e.target.value } }))
                }
              />
            </div>
            <div>
              <label className={labelBase} htmlFor="desiredActions">
                What do you want users to do on the website?
              </label>
              <input
                id="desiredActions"
                placeholder="Contact you, buy products, register, book..."
                className={inputBase}
                value={form.goals.desiredUserActions}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    goals: { ...p.goals, desiredUserActions: e.target.value },
                  }))
                }
              />
            </div>
          </div>
        </div>

        <div>
          <h2 className="text-xl font-semibold text-white mb-2">3. Website Features</h2>
          <p className="text-gray-400 text-sm mb-6">
            Select the features you need (we’ll confirm scope during discovery).
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { key: "contactForm", label: "Contact Form" },
              { key: "userAuth", label: "User Registration/Login" },
              { key: "adminDashboard", label: "Admin Dashboard" },
              { key: "paymentIntegration", label: "Payment Integration" },
              { key: "blogNews", label: "Blog/News Section" },
              { key: "bookingSystem", label: "Booking System" },
              { key: "chatSystem", label: "Chat System" },
              { key: "analyticsTracking", label: "Analytics/Tracking" },
              { key: "seoSetup", label: "SEO Setup" },
              { key: "multilingual", label: "Multilingual" },
            ].map((item) => (
              <label
                key={item.key}
                className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/5 px-4 py-3 hover:border-white/20 transition-colors"
              >
                <input
                  type="checkbox"
                  className="h-4 w-4 accent-primary"
                  checked={
                    form.features[item.key as keyof ProjectBriefSubmission["features"]] as boolean
                  }
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      features: { ...p.features, [item.key]: e.target.checked },
                    }))
                  }
                />
                <span className="text-sm text-gray-200">{item.label}</span>
              </label>
            ))}
          </div>

          <div className="mt-6">
            <label className={labelBase} htmlFor="featureOther">
              Other (please specify)
            </label>
            <input
              id="featureOther"
              className={inputBase}
              value={form.features.other}
              onChange={(e) =>
                setForm((p) => ({ ...p, features: { ...p.features, other: e.target.value } }))
              }
              placeholder="Examples: API integrations, CRM, inventory, role permissions..."
            />
          </div>
        </div>

        <div>
          <h2 className="text-xl font-semibold text-white mb-2">4. Pages Required</h2>
          <textarea
            required
            rows={3}
            className={`${inputBase} resize-none`}
            value={form.pagesRequired}
            onChange={(e) => setForm((p) => ({ ...p, pagesRequired: e.target.value }))}
            placeholder="Home, About, Services, Contact, FAQ..."
          />
        </div>

        <div>
          <h2 className="text-xl font-semibold text-white mb-2">5. Design Preferences</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className={labelBase} htmlFor="colorScheme">
                Do you have a color scheme?
              </label>
              <input
                id="colorScheme"
                className={inputBase}
                value={form.design.colorScheme}
                onChange={(e) =>
                  setForm((p) => ({ ...p, design: { ...p.design, colorScheme: e.target.value } }))
                }
                placeholder="Example: Dark theme + blue accent"
              />
            </div>
            <div>
              <label className={labelBase} htmlFor="hasLogo">
                Do you have a logo?
              </label>
              <select
                id="hasLogo"
                className={inputBase}
                value={form.design.hasLogo}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    design: { ...p.design, hasLogo: e.target.value as YesNo },
                  }))
                }
              >
                {yesNoOptions().map((o) => (
                  <option key={o.value} value={o.value} className="bg-background">
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-6">
            <label className={labelBase} htmlFor="referenceWebsites">
              Any websites you like? (comma-separated links)
            </label>
            <input
              id="referenceWebsites"
              className={inputBase}
              value={form.referenceWebsitesText}
              onChange={(e) => setForm((p) => ({ ...p, referenceWebsitesText: e.target.value }))}
              placeholder="https://stripe.com, https://vercel.com"
            />
          </div>

          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className={labelBase} htmlFor="preferredStyle">
                Preferred style
              </label>
              <input
                id="preferredStyle"
                className={inputBase}
                value={form.design.preferredStyle}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    design: { ...p.design, preferredStyle: e.target.value },
                  }))
                }
                placeholder="Modern, Minimal, Corporate, Creative..."
              />
            </div>
            <div>
              <label className={labelBase} htmlFor="accessibilityPriority">
                Accessibility priority
              </label>
              <select
                id="accessibilityPriority"
                className={inputBase}
                value={form.design.accessibilityPriority}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    design: { ...p.design, accessibilityPriority: e.target.value as YesNo },
                  }))
                }
              >
                {yesNoOptions().map((o) => (
                  <option key={o.value} value={o.value} className="bg-background">
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div>
          <h2 className="text-xl font-semibold text-white mb-2">6. Content</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className={labelBase} htmlFor="provideText">
                Will you provide text content?
              </label>
              <select
                id="provideText"
                className={inputBase}
                value={form.content.provideText}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    content: { ...p.content, provideText: e.target.value as YesNo },
                  }))
                }
              >
                {yesNoOptions().map((o) => (
                  <option key={o.value} value={o.value} className="bg-background">
                    {o.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className={labelBase} htmlFor="provideMedia">
                Will you provide images/videos?
              </label>
              <select
                id="provideMedia"
                className={inputBase}
                value={form.content.provideMedia}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    content: { ...p.content, provideMedia: e.target.value as YesNo },
                  }))
                }
              >
                {yesNoOptions().map((o) => (
                  <option key={o.value} value={o.value} className="bg-background">
                    {o.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className={labelBase} htmlFor="needContentHelp">
                Do you need help creating content?
              </label>
              <select
                id="needContentHelp"
                className={inputBase}
                value={form.content.needContentHelp}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    content: { ...p.content, needContentHelp: e.target.value as YesNo },
                  }))
                }
              >
                {yesNoOptions().map((o) => (
                  <option key={o.value} value={o.value} className="bg-background">
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div>
          <h2 className="text-xl font-semibold text-white mb-2">7. Domain & Hosting</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className={labelBase} htmlFor="hasDomain">
                Do you already have a domain name?
              </label>
              <select
                id="hasDomain"
                className={inputBase}
                value={form.domainHosting.hasDomain}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    domainHosting: { ...p.domainHosting, hasDomain: e.target.value as YesNo },
                  }))
                }
              >
                {yesNoOptions().map((o) => (
                  <option key={o.value} value={o.value} className="bg-background">
                    {o.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <label className={labelBase} htmlFor="domainDetails">
                If yes, provide details
              </label>
              <input
                id="domainDetails"
                className={inputBase}
                value={form.domainHosting.domainDetails}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    domainHosting: { ...p.domainHosting, domainDetails: e.target.value },
                  }))
                }
                placeholder="example.com"
              />
            </div>
          </div>

          <div className="mt-6">
            <label className={labelBase} htmlFor="needHostingHelp">
              Do you need help purchasing hosting?
            </label>
            <select
              id="needHostingHelp"
              className={inputBase}
              value={form.domainHosting.needHostingHelp}
              onChange={(e) =>
                setForm((p) => ({
                  ...p,
                  domainHosting: { ...p.domainHosting, needHostingHelp: e.target.value as YesNo },
                }))
              }
            >
              {yesNoOptions().map((o) => (
                <option key={o.value} value={o.value} className="bg-background">
                  {o.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <h2 className="text-xl font-semibold text-white mb-2">8–10. Timeline, Budget & Notes</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className={labelBase} htmlFor="timeline">
                When do you need the project completed?
              </label>
              <input
                id="timeline"
                className={inputBase}
                value={form.timeline}
                onChange={(e) => setForm((p) => ({ ...p, timeline: e.target.value }))}
                placeholder="Example: 4 weeks"
              />
            </div>
            <div>
              <label className={labelBase} htmlFor="budget">
                Estimated budget
              </label>
              <input
                id="budget"
                className={inputBase}
                value={form.budget}
                onChange={(e) => setForm((p) => ({ ...p, budget: e.target.value }))}
                placeholder="Example: $1,000 – $3,000"
              />
            </div>
          </div>

          <div className="mt-6">
            <label className={labelBase} htmlFor="additionalNotes">
              Additional notes / requirements
            </label>
            <textarea
              id="additionalNotes"
              rows={4}
              className={`${inputBase} resize-none`}
              value={form.additionalNotes}
              onChange={(e) => setForm((p) => ({ ...p, additionalNotes: e.target.value }))}
              placeholder="Any special requirements, integrations, examples, constraints..."
            />
          </div>
        </div>

        <div>
          <h2 className="text-xl font-semibold text-white mb-2">Your Contact</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className={labelBase} htmlFor="clientName">
                Client name
              </label>
              <input
                id="clientName"
                required
                className={inputBase}
                value={form.contact.clientName}
                onChange={(e) =>
                  setForm((p) => ({ ...p, contact: { ...p.contact, clientName: e.target.value } }))
                }
              />
            </div>
            <div>
              <label className={labelBase} htmlFor="clientEmail">
                Email
              </label>
              <input
                id="clientEmail"
                required
                type="email"
                className={inputBase}
                value={form.contact.email}
                onChange={(e) =>
                  setForm((p) => ({ ...p, contact: { ...p.contact, email: e.target.value } }))
                }
              />
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className={labelBase} htmlFor="phone">
                Phone (optional)
              </label>
              <input
                id="phone"
                className={inputBase}
                value={form.contact.phone}
                onChange={(e) =>
                  setForm((p) => ({ ...p, contact: { ...p.contact, phone: e.target.value } }))
                }
                placeholder="+234..."
              />
            </div>
            <div>
              <label className={labelBase} htmlFor="preferredContactMethod">
                Preferred contact method
              </label>
              <select
                id="preferredContactMethod"
                className={inputBase}
                value={form.contact.preferredContactMethod}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    contact: {
                      ...p.contact,
                      preferredContactMethod: e.target
                        .value as ProjectBriefSubmission["contact"]["preferredContactMethod"],
                    },
                  }))
                }
              >
                <option value="email" className="bg-background">
                  Email
                </option>
                <option value="phone" className="bg-background">
                  Phone
                </option>
                <option value="whatsapp" className="bg-background">
                  WhatsApp
                </option>
              </select>
            </div>
          </div>

          <div className="hidden">
            <label htmlFor="companyWebsite">Company Website</label>
            <input
              id="companyWebsite"
              tabIndex={-1}
              autoComplete="off"
              value={form.contact.companyWebsite}
              onChange={(e) =>
                setForm((p) => ({
                  ...p,
                  contact: { ...p.contact, companyWebsite: e.target.value },
                }))
              }
            />
          </div>

          <label className="mt-6 flex items-start gap-3">
            <input
              type="checkbox"
              className="mt-1 h-4 w-4 accent-primary"
              checked={form.consent}
              onChange={(e) => setForm((p) => ({ ...p, consent: e.target.checked }))}
              required
            />
            <span className="text-sm text-gray-300">
              I confirm the information provided is accurate and I consent to being contacted by GGI
              Tech regarding this request.
            </span>
          </label>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full inline-flex items-center justify-center px-8 py-3 text-base font-medium text-white bg-primary rounded-lg hover:bg-blue-600 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <>
              Submitting...
              <Loader2 className="w-4 h-4 ml-2 animate-spin" />
            </>
          ) : (
            <>
              Submit Project Brief
              <Send className="w-4 h-4 ml-2" />
            </>
          )}
        </button>
      </form>
    </div>
  );
}
