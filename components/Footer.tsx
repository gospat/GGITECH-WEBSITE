"use client";

import Link from "next/link";
import { Github, Linkedin, Facebook } from "lucide-react";

// X (formerly Twitter) Icon
const XIcon = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    aria-hidden="true"
    className={className}
    fill="currentColor"
  >
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

export default function Footer() {
  return (
    <footer className="bg-background border-t border-white/10 pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          <div className="col-span-1 md:col-span-2">
            <Link href="/" className="text-2xl font-bold tracking-tighter text-white mb-4 block">
              GGI <span className="text-primary">TECH</span>
            </Link>
            <p className="text-gray-400 mb-6 max-w-sm">
              A Division of GOSPAT GLOBAL INNOVATIONS LTD. Engineering secure platforms, institutional systems, and blockchain infrastructure for the future.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <Github className="w-6 h-6" />
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <XIcon className="w-5 h-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <Linkedin className="w-6 h-6" />
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <Facebook className="w-6 h-6" />
              </a>
            </div>
          </div>
          
          <div>
            <h3 className="text-white font-semibold mb-6">Services</h3>
            <ul className="space-y-4">
              <li><Link href="/services" className="text-gray-400 hover:text-primary transition-colors">Software Development</Link></li>
              <li><Link href="/services" className="text-gray-400 hover:text-primary transition-colors">System Architecture</Link></li>
              <li><Link href="/services" className="text-gray-400 hover:text-primary transition-colors">Web3 Development</Link></li>
              <li><Link href="/services" className="text-gray-400 hover:text-primary transition-colors">Cloud Infrastructure</Link></li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-white font-semibold mb-6">Company</h3>
            <ul className="space-y-4">
              <li><Link href="/about" className="text-gray-400 hover:text-primary transition-colors">About Us</Link></li>
              <li><Link href="/careers" className="text-gray-400 hover:text-primary transition-colors">Careers</Link></li>
              <li><Link href="/blog" className="text-gray-400 hover:text-primary transition-colors">Blog</Link></li>
              <li><Link href="/project-brief" className="text-gray-400 hover:text-primary transition-colors">Project Brief</Link></li>
              <li><Link href="/contact" className="text-gray-400 hover:text-primary transition-colors">Contact</Link></li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center text-sm text-gray-500">
          <p>© 2026 GOSPAT GLOBAL INNOVATIONS LTD. All rights reserved.</p>
          <div className="flex space-x-6 mt-4 md:mt-0 items-center">
            <Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link>
            <button
              onClick={() => window.dispatchEvent(new Event("openCookieSettings"))}
              className="hover:text-white transition-colors"
            >
              Cookie Settings
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
