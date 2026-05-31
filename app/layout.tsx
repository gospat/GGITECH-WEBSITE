import type { Metadata } from "next";
import "./globals.css";
import CookieConsent from "@/components/CookieConsent";

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
    <html lang="en">
      <body className="bg-background text-text antialiased font-sans selection:bg-primary/30 selection:text-white">
        {children}
        <CookieConsent />
      </body>
    </html>
  );
}
