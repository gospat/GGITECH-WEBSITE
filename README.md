# GGI Tech Website

Official website for **GGI Tech**, the technology division of GOSPAT GLOBAL INNOVATIONS LTD.

Built with Next.js (App Router), React 19, TypeScript, Tailwind CSS, and Framer Motion.

## Requirements

- Node.js >= 20.9.0
- npm

## Getting Started

1. Install dependencies:

   ```bash
   npm install
   ```

2. Run the development server:

   ```bash
   npm run dev
   ```

3. Open [http://localhost:3213](http://localhost:3213) in your browser.

## Scripts

| Script                 | Purpose                                                       |
| ---------------------- | ------------------------------------------------------------- |
| `npm run dev`          | Development server on port `3213`                             |
| `npm run build`        | Production build                                              |
| `npm start`            | Serve the production build on port `3213`                     |
| `npm run lint`         | ESLint                                                        |
| `npm run typecheck`    | TypeScript, no emit                                           |
| `npm run test`         | Vitest, single run                                            |
| `npm run test:watch`   | Vitest, watch mode                                            |
| `npm run preview:email` | Render both email templates to `.email-preview/` (dev only)  |
| `npm run format`       | Prettier write                                                |
| `npm run format:check` | Prettier check                                                |
| `npm run validate`     | `format:check` + `lint` + `typecheck` + `test` + `build`      |

## Project Structure

- `app/`: routes (App Router)
  - `layout.tsx`: metadata, fonts, JSON-LD, skip link
  - `page.tsx`: homepage assembly
  - `about/`, `services/`, `projects/`, `technology-lab/`, `blog/`, `contact/`, `careers/`, `project-brief/`, `privacy/`, `terms/`
  - `api/contact/`, `api/project-brief/`: form endpoints (Resend email, rate limited)
  - `sitemap.ts`, `robots.ts`, `manifest.ts`, `blog/rss.xml/route.ts`
- `components/`: reusable UI (Navbar, Hero, Services, capabilities grid, Footer, CookieConsent, …)
- `lib/`:
  - `site.ts`: single source of truth for brand facts, navigation, and metadata helpers
  - `content/`: canonical service and capability content
  - `validation.ts`: shared input coercion used by every API route
  - `server/`: Resend email service and templates, request metadata, PDF generation, rate limiting
- `components/email/`: the branded email design system and the two enquiry templates
- `scripts/preview-emails.ts`: local preview renderer for the email templates
- `tests/`: Vitest suites for validation, rate limiting, the email service and the templates

## Configuration

Copy the values you need into `.env.local`:

- `NEXT_PUBLIC_SITE_URL` — canonical origin (defaults to `https://ggitech.dev`)
- `RESEND_API_KEY` — Resend API key. **Server-side only**, never `NEXT_PUBLIC_`.
- `RESEND_FROM_EMAIL` — verified sender, e.g. `GGITECH <notifications@ggitech.dev>`
- `CONTACT_NOTIFICATION_EMAIL` — where enquiry notifications are delivered
- `CONTACT_REPLY_TO_EMAIL` — reply-to on the customer acknowledgement (defaults to the line above)
- `CONTACT_AUTO_REPLY_ENABLED` — `true`/`false`; whether customers receive an acknowledgement
- `TRUSTED_PROXY_HOPS` — number of proxies in front of the app (defaults to `1`)

`.env.example` documents each of these, including why an `@ggitech.dev` address does not
receive mail just because Resend can send from the domain.

Brand facts (email, address, navigation) live in `lib/site.ts` — change them there, not in
individual pages.

Sending email is documented in [`docs/email.md`](docs/email.md): domain verification, DNS
records, template changes, and how to preview the templates locally.

## Email

Both enquiry forms (`/contact` and `/project-brief`) send through the Resend HTTPS API.
There is no SMTP transport. The internal notification is sent first and its failure is
fatal; the customer acknowledgement is best-effort and its failure is logged and tolerated.

A Resend message id means the provider **accepted** the message, not that it was delivered.
Nothing in the site claims confirmed delivery.

## Content Accuracy Policy

Marketing copy must stay verifiable. Do not add client names, usage statistics, uptime
percentages, or compliance certifications unless they can be evidenced. Capability pages
describe engineering method; they are not client case studies.

## CI

`.github/workflows/ci.yml` runs two jobs on pushes and pull requests to `main`/`master`:

- **quality** — `format:check` → `lint` → `typecheck` → `test` → `build`
- **audit** — `npm audit --omit=dev --audit-level=high`

Both use `npm ci`, so `package-lock.json` must be committed and in sync with `package.json`.
Tests mock the Resend SDK, so CI needs no email credentials and never sends a real message.

## Deployment

1. Ensure CI is green.
2. Build with `npm run build` and serve with `npm start` on your host, or deploy to a
   Next.js-compatible platform.
3. Set `NEXT_PUBLIC_SITE_URL` and the Resend variables in the production environment.
   The Resend values are read at runtime only, so a build with no credentials is still
   a valid build. See [`deploy/README.md`](deploy/README.md) for the production setup and
   [`docs/email.md`](docs/email.md) for domain verification.
