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

| Script                 | Purpose                                                  |
| ---------------------- | -------------------------------------------------------- |
| `npm run dev`          | Development server on port `3213`                        |
| `npm run build`        | Production build                                         |
| `npm start`            | Serve the production build on port `3213`                |
| `npm run lint`         | ESLint                                                   |
| `npm run typecheck`    | TypeScript, no emit                                      |
| `npm run format`       | Prettier write                                           |
| `npm run format:check` | Prettier check                                           |
| `npm run validate`     | `format:check` + `lint` + `typecheck` + `build`           |

## Project Structure

- `app/`: routes (App Router)
  - `layout.tsx`: metadata, fonts, JSON-LD, skip link
  - `page.tsx`: homepage assembly
  - `about/`, `services/`, `projects/`, `technology-lab/`, `blog/`, `contact/`, `careers/`, `project-brief/`, `privacy/`, `terms/`
  - `api/contact/`, `api/project-brief/`: form endpoints (mail transport, rate limited)
  - `sitemap.ts`, `robots.ts`, `manifest.ts`, `blog/rss.xml/route.ts`
- `components/`: reusable UI (Navbar, Hero, Services, capabilities grid, Footer, CookieConsent, …)
- `lib/`:
  - `site.ts`: single source of truth for brand facts, navigation, and metadata helpers
  - `content/`: canonical service and capability content
  - `validation.ts`: shared input coercion used by every API route
  - `server/`: mail transport, environment, PDF generation, rate limiting

## Configuration

Copy the values you need into `.env.local`:

- `NEXT_PUBLIC_SITE_URL` — canonical origin (defaults to `https://ggitech.dev`)
- Mail transport variables read by `lib/server/env.ts` (see that file for the exact names)

Brand facts (email, address, navigation) live in `lib/site.ts` — change them there, not in
individual pages.

## Content Accuracy Policy

Marketing copy must stay verifiable. Do not add client names, usage statistics, uptime
percentages, or compliance certifications unless they can be evidenced. Capability pages
describe engineering method; they are not client case studies.

## CI

`.github/workflows/ci.yml` runs two jobs on pushes and pull requests to `main`/`master`:

- **quality** — `format:check` → `lint` → `typecheck` → `build`
- **audit** — `npm audit --omit=dev --audit-level=high`

Both use `npm ci`, so `package-lock.json` must be committed and in sync with `package.json`.

## Deployment

1. Ensure CI is green.
2. Build with `npm run build` and serve with `npm start` on your host, or deploy to a
   Next.js-compatible platform.
3. Set `NEXT_PUBLIC_SITE_URL` and the mail transport variables in the production environment.
