"use client";

import clsx from "clsx";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Check,
  Clock,
  Loader2,
  Send,
  ShieldCheck,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from "react";
import type {
  ProjectBriefBusiness,
  ProjectBriefContact,
  ProjectBriefContent,
  ProjectBriefDesign,
  ProjectBriefDomainHosting,
  ProjectBriefFeatures,
  ProjectBriefGoals,
  ProjectBriefSubmission,
  YesNo,
} from "@/lib/projectBrief";
import { isEmail } from "@/lib/validation";

type ApiError = { ok: false; error?: string; errors?: string[] };

/**
 * The client keeps one extra field (`referenceWebsitesText`) that is split into
 * the array the API expects at submit time. Everything else mirrors
 * `ProjectBriefSubmission` exactly, so the payload contract is unchanged.
 */
type FormState = ProjectBriefSubmission & { referenceWebsitesText: string };

type FieldErrors = Record<string, string>;

/** Feature flags that are plain booleans, so toggling them stays type-safe. */
type BooleanFeatureKey = {
  [K in keyof ProjectBriefFeatures]: ProjectBriefFeatures[K] extends boolean ? K : never;
}[keyof ProjectBriefFeatures];

const DRAFT_KEY = "ggitech.projectBrief.draft";
const TOTAL_STEPS = 3;

/** How many answers the API actually requires. Used for honest progress copy. */
const REQUIRED_FIELDS = 7;

const FEATURE_OPTIONS: { key: BooleanFeatureKey; label: string }[] = [
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
];

const STEPS = [
  {
    title: "Your business",
    blurb: "Start with the easy part — three quick answers about what you do.",
  },
  {
    title: "Your project",
    blurb: "Now the shape of the build. Tick everything that applies — nothing here is binding.",
  },
  {
    title: "Delivery & contact",
    blurb: "Last step. Tell us how to reach you and when you need this live.",
  },
] as const;

const NEXT_STEPS = [
  "We review your brief and reply within one business day.",
  "You receive a copy of your answers as a structured PDF by email.",
  "If it looks like a fit, we book a short scoping call.",
];

const inputBase =
  "w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-gray-600 focus:border-primary transition-colors";
const labelBase = "block text-sm font-medium text-gray-300 mb-2";
const optionalTag = "ml-2 font-normal text-gray-500";
const errorText = "mt-2 text-xs text-red-300";

const inputClass = (invalid?: string) =>
  clsx(inputBase, invalid && "border-red-500/60 focus:border-red-400");

/** Wires a field's error message to its control for screen readers. */
const errorProps = (id: string, error?: string) =>
  error ? { "aria-invalid": true as const, "aria-describedby": `${id}-error` } : {};

function initialState(): FormState {
  return {
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
    goals: { mainPurpose: "", desiredUserActions: "" },
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
    content: { provideText: "no", provideMedia: "no", needContentHelp: "no" },
    domainHosting: { hasDomain: "no", domainDetails: "", needHostingHelp: "no" },
    timeline: "",
    budget: "",
    additionalNotes: "",
    consent: false,
    referenceWebsitesText: "",
  };
}

/**
 * Validates only the step on screen, so the visitor is never bounced back to a
 * section they already completed. Mirrors the server rules in
 * `lib/projectBrief.ts`; the server remains the authority.
 */
function validateStep(index: number, form: FormState): FieldErrors {
  const errors: FieldErrors = {};

  if (index === 0) {
    if (!form.business.businessName.trim()) errors.businessName = "Please add your business name.";
    if (!form.business.businessDescription.trim())
      errors.businessDescription = "Tell us what your business does.";
    if (!form.goals.mainPurpose.trim())
      errors.mainPurpose = "Let us know the main purpose of the site.";
  }

  if (index === 1) {
    if (!form.pagesRequired.trim()) errors.pagesRequired = "List the pages you have in mind.";
  }

  if (index === 2) {
    if (!form.contact.clientName.trim()) errors.clientName = "Please add your name.";
    if (!isEmail(form.contact.email)) errors.clientEmail = "Enter a valid email address.";
    if (!form.consent) errors.consent = "Please confirm the details are accurate.";
  }

  return errors;
}

/**
 * Rebuilds a saved draft section by section so a stale or partial payload can
 * never produce a malformed form. Consent is deliberately never restored.
 */
function hydrateDraft(raw: string | null): { form: FormState; step: number } | null {
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as { form?: Partial<FormState>; step?: unknown };
    if (!parsed || typeof parsed !== "object" || !parsed.form) return null;

    const base = initialState();
    const saved = parsed.form;
    const step =
      typeof parsed.step === "number" && parsed.step >= 0 && parsed.step < TOTAL_STEPS
        ? parsed.step
        : 0;

    return {
      step,
      form: {
        ...base,
        ...saved,
        business: { ...base.business, ...(saved.business ?? {}) },
        goals: { ...base.goals, ...(saved.goals ?? {}) },
        features: { ...base.features, ...(saved.features ?? {}) },
        design: { ...base.design, ...(saved.design ?? {}) },
        content: { ...base.content, ...(saved.content ?? {}) },
        domainHosting: { ...base.domainHosting, ...(saved.domainHosting ?? {}) },
        contact: { ...base.contact, ...(saved.contact ?? {}) },
        consent: false,
      },
    };
  } catch {
    return null;
  }
}

function Field({
  id,
  label,
  optional,
  error,
  children,
}: {
  id: string;
  label: string;
  optional?: boolean;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div>
      <label className={labelBase} htmlFor={id}>
        {label}
        {optional ? <span className={optionalTag}>Optional</span> : null}
      </label>
      {children}
      {error ? (
        <p id={`${id}-error`} className={errorText}>
          {error}
        </p>
      ) : null}
    </div>
  );
}

function YesNoSelect({
  id,
  value,
  onChange,
  invalid,
}: {
  id: string;
  value: YesNo;
  onChange: (value: YesNo) => void;
  invalid?: string;
}) {
  return (
    <select
      id={id}
      className={inputClass(invalid)}
      value={value}
      onChange={(e) => onChange(e.target.value as YesNo)}
      {...errorProps(id, invalid)}
    >
      <option value="yes" className="bg-background">
        Yes
      </option>
      <option value="no" className="bg-background">
        No
      </option>
    </select>
  );
}

export default function ProjectBriefForm() {
  const reduceMotion = useReducedMotion();

  const [form, setForm] = useState<FormState>(initialState);
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [restored, setRestored] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  const headingRef = useRef<HTMLHeadingElement>(null);
  const isFirstRender = useRef(true);

  // Restore a saved draft after mount. Doing this in an effect keeps the
  // server-rendered markup and the first client render identical, which avoids
  // a hydration mismatch. The synchronous setState is intentional: deferring it
  // (as the lint rule suggests) would flash an empty form before the draft
  // populates, and reading localStorage during render would break hydration.
  useEffect(() => {
    const draft = hydrateDraft(
      typeof window === "undefined" ? null : window.localStorage.getItem(DRAFT_KEY)
    );
    if (draft) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- see comment above
      setForm(draft.form);
      setStep(draft.step);
      setRestored(true);
    }
    setHydrated(true);
  }, []);

  // Persist the draft as they type, debounced so a fast typist does not write
  // on every keystroke.
  useEffect(() => {
    if (!hydrated || isSuccess) return;

    const timer = window.setTimeout(() => {
      try {
        // Consent is never stored, so a resumed session must re-confirm it.
        window.localStorage.setItem(
          DRAFT_KEY,
          JSON.stringify({ form: { ...form, consent: false }, step })
        );
      } catch {
        // Storage can be unavailable (private mode, quota); losing the draft is
        // not worth interrupting the visitor for.
      }
    }, 400);

    return () => window.clearTimeout(timer);
  }, [form, step, hydrated, isSuccess]);

  // Move focus to the step heading so keyboard and screen-reader users land in
  // the new content instead of staying on the "Continue" button.
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    headingRef.current?.focus();
  }, [step]);

  // The success view replaces the whole form, so without this a screen-reader
  // user is left on a submit button that no longer exists in the DOM.
  useEffect(() => {
    if (isSuccess) headingRef.current?.focus();
  }, [isSuccess]);

  const referenceWebsites = useMemo(
    () =>
      form.referenceWebsitesText
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
        .slice(0, 10),
    [form.referenceWebsitesText]
  );

  const completedRequired = useMemo(() => {
    const checks = [
      form.business.businessName,
      form.business.businessDescription,
      form.goals.mainPurpose,
      form.pagesRequired,
      form.contact.clientName,
      isEmail(form.contact.email) ? "ok" : "",
      form.consent ? "ok" : "",
    ];
    return checks.filter((value) => value.trim().length > 0).length;
  }, [form]);

  const setBusiness = (patch: Partial<ProjectBriefBusiness>) =>
    setForm((p) => ({ ...p, business: { ...p.business, ...patch } }));
  const setGoals = (patch: Partial<ProjectBriefGoals>) =>
    setForm((p) => ({ ...p, goals: { ...p.goals, ...patch } }));
  const setDesign = (patch: Partial<ProjectBriefDesign>) =>
    setForm((p) => ({ ...p, design: { ...p.design, ...patch } }));
  const setContent = (patch: Partial<ProjectBriefContent>) =>
    setForm((p) => ({ ...p, content: { ...p.content, ...patch } }));
  const setDomainHosting = (patch: Partial<ProjectBriefDomainHosting>) =>
    setForm((p) => ({ ...p, domainHosting: { ...p.domainHosting, ...patch } }));
  const setContact = (patch: Partial<ProjectBriefContact>) =>
    setForm((p) => ({ ...p, contact: { ...p.contact, ...patch } }));
  const setFeatures = (patch: Partial<ProjectBriefFeatures>) =>
    setForm((p) => ({ ...p, features: { ...p.features, ...patch } }));

  const focusField = (key: string) => {
    const el = document.getElementById(key);
    if (el instanceof HTMLElement) el.focus();
  };

  const goToStep = (next: number) => {
    setDirection(next > step ? 1 : -1);
    setStep(next);
  };

  const advance = () => {
    const found = validateStep(step, form);
    setFieldErrors(found);

    const firstInvalid = Object.keys(found)[0];
    if (firstInvalid) {
      focusField(firstInvalid);
      return;
    }

    goToStep(Math.min(step + 1, TOTAL_STEPS - 1));
  };

  const goBack = () => {
    setFieldErrors({});
    goToStep(Math.max(step - 1, 0));
  };

  const submitBrief = async () => {
    // Re-check every step so a restored draft cannot skip a requirement.
    for (let index = 0; index < TOTAL_STEPS; index += 1) {
      const found = validateStep(index, form);
      if (Object.keys(found).length === 0) continue;

      setFieldErrors(found);
      const firstInvalid = Object.keys(found)[0];

      if (index !== step) {
        goToStep(index);
        // Wait for the new step to mount before reaching for the field.
        window.setTimeout(() => focusField(firstInvalid), reduceMotion ? 0 : 320);
      } else {
        focusField(firstInvalid);
      }
      return;
    }

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
      try {
        window.localStorage.removeItem(DRAFT_KEY);
      } catch {
        // Nothing to recover from; the brief itself was submitted successfully.
      }
    } catch {
      setIsSubmitting(false);
      setError("Submission failed. Please try again.");
    }
  };

  const handleFormSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (step < TOTAL_STEPS - 1) {
      advance();
      return;
    }
    void submitBrief();
  };

  const startOver = () => {
    try {
      window.localStorage.removeItem(DRAFT_KEY);
    } catch {
      // Ignore storage failures; resetting in-memory state is enough.
    }
    setForm(initialState());
    setFieldErrors({});
    setRestored(false);
    setDirection(1);
    setStep(0);
  };

  const stepVariants = {
    enter: (dir: number) => ({ opacity: 0, x: reduceMotion ? 0 : dir * 40 }),
    center: { opacity: 1, x: 0 },
    exit: (dir: number) => ({ opacity: 0, x: reduceMotion ? 0 : dir * -40 }),
  };

  const fieldErrorCount = Object.keys(fieldErrors).length;

  if (isSuccess) {
    return (
      <div className="bg-white/5 border border-white/10 p-8 rounded-2xl backdrop-blur-sm">
        <div className="flex flex-col items-center justify-center text-center py-10">
          <motion.div
            initial={reduceMotion ? false : { scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 220, damping: 18 }}
            className="relative mb-6 flex h-20 w-20 items-center justify-center"
          >
            <span className="absolute inset-0 rounded-full bg-green-500/20" aria-hidden="true" />
            {reduceMotion ? null : (
              <motion.span
                className="absolute inset-0 rounded-full border border-green-400/40"
                initial={{ scale: 0.7, opacity: 0.6 }}
                animate={{ scale: 1.4, opacity: 0 }}
                transition={{ duration: 1.4, repeat: Infinity, repeatDelay: 0.6 }}
                aria-hidden="true"
              />
            )}
            <Check className="relative h-10 w-10 text-green-400" aria-hidden="true" />
          </motion.div>

          <h2
            ref={headingRef}
            tabIndex={-1}
            className="text-2xl font-bold text-white mb-2 focus:outline-none"
          >
            Brief Submitted
          </h2>
          <p className="text-gray-400 max-w-xl">
            Thank you. A confirmation has been sent to your email, and our team has received your
            project brief.
          </p>

          <div className="mt-8 w-full max-w-md rounded-2xl border border-white/10 bg-white/5 p-6 text-left">
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white">
              What happens next
            </h3>
            <ul className="space-y-3">
              {NEXT_STEPS.map((item) => (
                <li key={item} className="flex gap-3 text-sm text-gray-400">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <button
            onClick={() => {
              setIsSuccess(false);
              setFieldErrors({});
              setDirection(1);
              setStep(0);
            }}
            className="mt-8 text-primary hover:text-white transition-colors"
          >
            Submit another brief
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/5 border border-white/10 p-6 sm:p-8 rounded-2xl backdrop-blur-sm">
      {/* Reassurance before they commit any effort. */}
      <div className="mb-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-gray-400">
        <span className="inline-flex items-center gap-2">
          <Clock className="h-4 w-4 text-primary" aria-hidden="true" />
          About 3 minutes
        </span>
        <span className="inline-flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-primary" aria-hidden="true" />
          No obligation
        </span>
        <span className="inline-flex items-center gap-2">
          <Check className="h-4 w-4 text-primary" aria-hidden="true" />
          <span>
            <span className="text-white">{completedRequired}</span> of {REQUIRED_FIELDS} essential
            answers done
          </span>
        </span>
      </div>

      <div
        role="progressbar"
        aria-valuemin={1}
        aria-valuemax={TOTAL_STEPS}
        aria-valuenow={step + 1}
        aria-valuetext={`Step ${step + 1} of ${TOTAL_STEPS}: ${STEPS[step].title}`}
        className="mb-8"
      >
        <div className="flex gap-2" aria-hidden="true">
          {STEPS.map((item, index) => (
            <div key={item.title} className="flex-1">
              <div className="h-1 overflow-hidden rounded-full bg-white/10">
                <motion.div
                  className="h-full rounded-full bg-primary"
                  initial={false}
                  animate={{ width: index <= step ? "100%" : "0%" }}
                  transition={{ duration: reduceMotion ? 0 : 0.4, ease: "easeOut" }}
                />
              </div>
              <span
                className={clsx(
                  "mt-2 block text-xs",
                  index === step ? "text-primary" : index < step ? "text-gray-300" : "text-gray-600"
                )}
              >
                {index + 1}. {item.title}
              </span>
            </div>
          ))}
        </div>
      </div>

      <form onSubmit={handleFormSubmit} noValidate className="space-y-8">
        {restored ? (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-primary/30 bg-primary/10 p-4">
            <p className="text-sm text-blue-100">
              We saved your earlier answers, so you can pick up where you left off.
            </p>
            <button
              type="button"
              onClick={startOver}
              className="text-sm font-medium text-primary transition-colors hover:text-white"
            >
              Start over
            </button>
          </div>
        ) : null}

        {error || errors.length > 0 ? (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-400 mt-0.5" aria-hidden="true" />
              <div className="text-sm">
                <div className="text-red-200 font-medium">
                  {error || "Please fix the issues below:"}
                </div>
                {errors.length > 0 ? (
                  <ul className="mt-2 text-red-200/80 list-disc pl-5 space-y-1">
                    {errors.map((m) => (
                      <li key={m}>{m}</li>
                    ))}
                  </ul>
                ) : null}
              </div>
            </div>
          </div>
        ) : null}

        <p className="sr-only" aria-live="polite">
          {fieldErrorCount > 0
            ? `${fieldErrorCount} ${fieldErrorCount === 1 ? "field needs" : "fields need"} attention before you can continue`
            : ""}
        </p>

        <AnimatePresence mode="wait" custom={direction} initial={false}>
          <motion.div
            key={step}
            custom={direction}
            variants={stepVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: reduceMotion ? 0 : 0.28, ease: "easeOut" }}
          >
            <div role="group" aria-labelledby="step-heading">
              <h2
                id="step-heading"
                ref={headingRef}
                tabIndex={-1}
                className="text-xl font-semibold text-white mb-2 focus:outline-none"
              >
                {step + 1}. {STEPS[step].title}
              </h2>
              <p className="text-gray-400 text-sm mb-6">{STEPS[step].blurb}</p>

              {step === 0 ? (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Field id="businessName" label="Business Name" error={fieldErrors.businessName}>
                      <input
                        id="businessName"
                        className={inputClass(fieldErrors.businessName)}
                        value={form.business.businessName}
                        onChange={(e) => setBusiness({ businessName: e.target.value })}
                        {...errorProps("businessName", fieldErrors.businessName)}
                      />
                    </Field>

                    <Field id="location" label="Location (City/Country)" optional>
                      <input
                        id="location"
                        className={inputBase}
                        value={form.business.location}
                        onChange={(e) => setBusiness({ location: e.target.value })}
                      />
                    </Field>
                  </div>

                  <Field
                    id="businessDescription"
                    label="Business Description (What do you do?)"
                    error={fieldErrors.businessDescription}
                  >
                    <textarea
                      id="businessDescription"
                      rows={4}
                      className={clsx(inputClass(fieldErrors.businessDescription), "resize-none")}
                      value={form.business.businessDescription}
                      onChange={(e) => setBusiness({ businessDescription: e.target.value })}
                      {...errorProps("businessDescription", fieldErrors.businessDescription)}
                    />
                  </Field>

                  <Field
                    id="targetAudience"
                    label="Target Audience (Who are your customers?)"
                    optional
                  >
                    <textarea
                      id="targetAudience"
                      rows={3}
                      className={`${inputBase} resize-none`}
                      value={form.business.targetAudience}
                      onChange={(e) => setBusiness({ targetAudience: e.target.value })}
                    />
                  </Field>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Field
                      id="mainPurpose"
                      label="What is the main purpose of the website?"
                      error={fieldErrors.mainPurpose}
                    >
                      <input
                        id="mainPurpose"
                        placeholder="Informational, E-commerce, Booking, Portfolio, Blog..."
                        className={inputClass(fieldErrors.mainPurpose)}
                        value={form.goals.mainPurpose}
                        onChange={(e) => setGoals({ mainPurpose: e.target.value })}
                        {...errorProps("mainPurpose", fieldErrors.mainPurpose)}
                      />
                    </Field>

                    <Field
                      id="desiredActions"
                      label="What do you want users to do on the website?"
                      optional
                    >
                      <input
                        id="desiredActions"
                        placeholder="Contact you, buy products, register, book..."
                        className={inputBase}
                        value={form.goals.desiredUserActions}
                        onChange={(e) => setGoals({ desiredUserActions: e.target.value })}
                      />
                    </Field>
                  </div>
                </div>
              ) : null}

              {step === 1 ? (
                <div className="space-y-8">
                  <Field
                    id="pagesRequired"
                    label="Pages required"
                    error={fieldErrors.pagesRequired}
                  >
                    <textarea
                      id="pagesRequired"
                      rows={3}
                      className={clsx(inputClass(fieldErrors.pagesRequired), "resize-none")}
                      value={form.pagesRequired}
                      onChange={(e) => setForm((p) => ({ ...p, pagesRequired: e.target.value }))}
                      placeholder="Home, About, Services, Contact, FAQ..."
                      {...errorProps("pagesRequired", fieldErrors.pagesRequired)}
                    />
                  </Field>

                  <div>
                    <p className={labelBase}>
                      Website features
                      <span className={optionalTag}>Optional</span>
                    </p>
                    <p className="mb-4 text-xs text-gray-500">
                      We will confirm the exact scope during discovery.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {FEATURE_OPTIONS.map((item) => (
                        <label
                          key={item.key}
                          className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/5 px-4 py-3 hover:border-white/20 transition-colors"
                        >
                          <input
                            type="checkbox"
                            className="h-4 w-4 accent-primary"
                            checked={form.features[item.key]}
                            onChange={(e) => setFeatures({ [item.key]: e.target.checked })}
                          />
                          <span className="text-sm text-gray-200">{item.label}</span>
                        </label>
                      ))}
                    </div>

                    <div className="mt-6">
                      <Field id="featureOther" label="Other (please specify)" optional>
                        <input
                          id="featureOther"
                          className={inputBase}
                          value={form.features.other}
                          onChange={(e) => setFeatures({ other: e.target.value })}
                          placeholder="Examples: API integrations, CRM, inventory, role permissions..."
                        />
                      </Field>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Field id="colorScheme" label="Do you have a colour scheme?" optional>
                      <input
                        id="colorScheme"
                        className={inputBase}
                        value={form.design.colorScheme}
                        onChange={(e) => setDesign({ colorScheme: e.target.value })}
                        placeholder="Example: Dark theme + blue accent"
                      />
                    </Field>

                    <Field id="hasLogo" label="Do you have a logo?" optional>
                      <YesNoSelect
                        id="hasLogo"
                        value={form.design.hasLogo}
                        onChange={(value) => setDesign({ hasLogo: value })}
                      />
                    </Field>
                  </div>

                  <Field
                    id="referenceWebsites"
                    label="Any websites you like? (comma-separated links)"
                    optional
                  >
                    <input
                      id="referenceWebsites"
                      className={inputBase}
                      value={form.referenceWebsitesText}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, referenceWebsitesText: e.target.value }))
                      }
                      placeholder="https://stripe.com, https://vercel.com"
                    />
                  </Field>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Field id="preferredStyle" label="Preferred style" optional>
                      <input
                        id="preferredStyle"
                        className={inputBase}
                        value={form.design.preferredStyle}
                        onChange={(e) => setDesign({ preferredStyle: e.target.value })}
                        placeholder="Modern, Minimal, Corporate, Creative..."
                      />
                    </Field>

                    <Field id="accessibilityPriority" label="Accessibility priority" optional>
                      <YesNoSelect
                        id="accessibilityPriority"
                        value={form.design.accessibilityPriority}
                        onChange={(value) => setDesign({ accessibilityPriority: value })}
                      />
                    </Field>
                  </div>
                </div>
              ) : null}

              {step === 2 ? (
                <div className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Field id="provideText" label="Will you provide text content?" optional>
                      <YesNoSelect
                        id="provideText"
                        value={form.content.provideText}
                        onChange={(value) => setContent({ provideText: value })}
                      />
                    </Field>

                    <Field id="provideMedia" label="Will you provide images/videos?" optional>
                      <YesNoSelect
                        id="provideMedia"
                        value={form.content.provideMedia}
                        onChange={(value) => setContent({ provideMedia: value })}
                      />
                    </Field>

                    <Field id="needContentHelp" label="Need help creating content?" optional>
                      <YesNoSelect
                        id="needContentHelp"
                        value={form.content.needContentHelp}
                        onChange={(value) => setContent({ needContentHelp: value })}
                      />
                    </Field>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Field id="hasDomain" label="Do you already have a domain name?" optional>
                      <YesNoSelect
                        id="hasDomain"
                        value={form.domainHosting.hasDomain}
                        onChange={(value) => setDomainHosting({ hasDomain: value })}
                      />
                    </Field>

                    <div className="md:col-span-2">
                      <Field id="domainDetails" label="If yes, provide details" optional>
                        <input
                          id="domainDetails"
                          className={inputBase}
                          value={form.domainHosting.domainDetails}
                          onChange={(e) => setDomainHosting({ domainDetails: e.target.value })}
                          placeholder="example.com"
                        />
                      </Field>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Field id="needHostingHelp" label="Need help purchasing hosting?" optional>
                      <YesNoSelect
                        id="needHostingHelp"
                        value={form.domainHosting.needHostingHelp}
                        onChange={(value) => setDomainHosting({ needHostingHelp: value })}
                      />
                    </Field>

                    <Field id="timeline" label="When do you need it completed?" optional>
                      <input
                        id="timeline"
                        className={inputBase}
                        value={form.timeline}
                        onChange={(e) => setForm((p) => ({ ...p, timeline: e.target.value }))}
                        placeholder="Example: 4 weeks"
                      />
                    </Field>

                    <Field id="budget" label="Estimated budget" optional>
                      <input
                        id="budget"
                        className={inputBase}
                        value={form.budget}
                        onChange={(e) => setForm((p) => ({ ...p, budget: e.target.value }))}
                        placeholder="Example: $1,000 – $3,000"
                      />
                    </Field>
                  </div>

                  <Field id="additionalNotes" label="Additional notes / requirements" optional>
                    <textarea
                      id="additionalNotes"
                      rows={4}
                      className={`${inputBase} resize-none`}
                      value={form.additionalNotes}
                      onChange={(e) => setForm((p) => ({ ...p, additionalNotes: e.target.value }))}
                      placeholder="Any special requirements, integrations, examples, constraints..."
                    />
                  </Field>

                  <div className="border-t border-white/10 pt-8">
                    <h3 className="mb-2 text-lg font-semibold text-white">Your contact details</h3>
                    <p className="mb-6 text-sm text-gray-400">
                      So we can send you a copy of this brief and follow up.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <Field id="clientName" label="Your name" error={fieldErrors.clientName}>
                        <input
                          id="clientName"
                          className={inputClass(fieldErrors.clientName)}
                          value={form.contact.clientName}
                          onChange={(e) => setContact({ clientName: e.target.value })}
                          {...errorProps("clientName", fieldErrors.clientName)}
                        />
                      </Field>

                      <Field id="clientEmail" label="Email" error={fieldErrors.clientEmail}>
                        <input
                          id="clientEmail"
                          type="email"
                          className={inputClass(fieldErrors.clientEmail)}
                          value={form.contact.email}
                          onChange={(e) => setContact({ email: e.target.value })}
                          {...errorProps("clientEmail", fieldErrors.clientEmail)}
                        />
                      </Field>
                    </div>

                    <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                      <Field id="phone" label="Phone" optional>
                        <input
                          id="phone"
                          className={inputBase}
                          value={form.contact.phone}
                          onChange={(e) => setContact({ phone: e.target.value })}
                          placeholder="+234..."
                        />
                      </Field>

                      <Field id="preferredContactMethod" label="Preferred contact method" optional>
                        <select
                          id="preferredContactMethod"
                          className={inputBase}
                          value={form.contact.preferredContactMethod}
                          onChange={(e) =>
                            setContact({
                              preferredContactMethod: e.target
                                .value as ProjectBriefContact["preferredContactMethod"],
                            })
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
                      </Field>
                    </div>

                    <div className="hidden">
                      <label htmlFor="companyWebsite">Company Website</label>
                      <input
                        id="companyWebsite"
                        tabIndex={-1}
                        autoComplete="off"
                        value={form.contact.companyWebsite}
                        onChange={(e) => setContact({ companyWebsite: e.target.value })}
                      />
                    </div>

                    <div className="mt-6">
                      <label className="flex items-start gap-3">
                        <input
                          id="consent"
                          type="checkbox"
                          className={clsx(
                            "mt-1 h-4 w-4 accent-primary",
                            fieldErrors.consent && "outline outline-1 outline-red-500/60"
                          )}
                          checked={form.consent}
                          onChange={(e) => setForm((p) => ({ ...p, consent: e.target.checked }))}
                          {...errorProps("consent", fieldErrors.consent)}
                        />
                        <span className="text-sm text-gray-300">
                          I confirm the information provided is accurate and I consent to being
                          contacted by GGI Tech regarding this request.
                        </span>
                      </label>
                      {fieldErrors.consent ? (
                        <p id="consent-error" className={errorText}>
                          {fieldErrors.consent}
                        </p>
                      ) : null}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
                    <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white">
                      What happens next
                    </h3>
                    <ul className="space-y-3">
                      {NEXT_STEPS.map((item) => (
                        <li key={item} className="flex gap-3 text-sm text-gray-400">
                          <Check
                            className="mt-0.5 h-4 w-4 shrink-0 text-primary"
                            aria-hidden="true"
                          />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ) : null}
            </div>
          </motion.div>
        </AnimatePresence>

        <div className="flex flex-col-reverse gap-3 border-t border-white/10 pt-6 sm:flex-row sm:items-center sm:justify-between">
          {step > 0 ? (
            <button
              type="button"
              onClick={goBack}
              className="inline-flex items-center justify-center gap-2 px-5 py-3 text-sm font-medium text-gray-300 transition-colors hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              Back
            </button>
          ) : (
            <span className="hidden sm:block" aria-hidden="true" />
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full inline-flex items-center justify-center px-8 py-3.5 text-base font-medium text-white bg-primary rounded-full hover:bg-blue-600 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed sm:w-auto"
          >
            {step < TOTAL_STEPS - 1 ? (
              <>
                Continue
                <ArrowRight className="w-4 h-4 ml-2" aria-hidden="true" />
              </>
            ) : isSubmitting ? (
              <>
                Submitting...
                <Loader2 className="w-4 h-4 ml-2 animate-spin" aria-hidden="true" />
              </>
            ) : (
              <>
                Submit Project Brief
                <Send className="w-4 h-4 ml-2" aria-hidden="true" />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
