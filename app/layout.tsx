import type { Metadata } from "next";
import { Space_Grotesk, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import CookieConsent from "@/components/CookieConsent";

const spaceGrotesk = Space_Grotesk({ 
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
  weight: ["300", "400", "500", "600", "700"],
});

const jetBrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
  weight: ["400", "500", "700"],
});

export const metadata: Metadata = {
  title: "GGI Tech | Engineering Digital Infrastructure",
  description: "GGI Tech - A Division of GOSPAT GLOBAL INNOVATIONS LTD. Building powerful digital systems for institutions and businesses.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${spaceGrotesk.variable} ${jetBrainsMono.variable}`}>
      <body className="bg-background text-text antialiased font-sans selection:bg-primary/30 selection:text-white">
        {children}
        <CookieConsent />
      </body>
    </html>
  );
}
