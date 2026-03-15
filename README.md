# GGI Tech Website

This is the official website for GGI Tech, a division of GOSPAT GLOBAL INNOVATIONS LTD.
Built with Next.js, Tailwind CSS, Framer Motion, and Three.js.

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Run the development server:
   ```bash
   npm run dev
   ```

3. Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Project Structure

- `app/`: Main application code (Next.js App Router)
  - `page.tsx`: Homepage assembly
  - `layout.tsx`: Root layout with global styles
  - `globals.css`: Global styles and Tailwind directives
- `components/`: Reusable UI components
  - `Hero.tsx`: 3D background and hero section
  - `About.tsx`: About section with scroll animations
  - `Services.tsx`: Services grid
  - `Projects.tsx`: Project showcase
  - `TechStack.tsx`: Technology stack display
  - `Innovation.tsx`: Innovation lab section
  - `WhyUs.tsx`: Why choose us section
  - `Contact.tsx`: Contact form
  - `Footer.tsx`: Footer with links
  - `Navbar.tsx`: Responsive navigation bar

## Features

- **Dark Futuristic UI**: Custom Tailwind theme with glowing effects.
- **Smooth Animations**: Powered by Framer Motion.
- **3D Elements**: React Three Fiber integration in the Hero section.
- **Responsive Design**: Fully optimized for mobile and desktop.
- **Fast Loading**: Optimized with Next.js static generation.

## Deployment

To deploy to Vercel (recommended):

1. Push this repository to GitHub.
2. Import the project in Vercel.
3. Vercel will automatically detect Next.js and deploy.

## Customization

- Edit `tailwind.config.ts` to change colors.
- Update `components/` to modify content.
