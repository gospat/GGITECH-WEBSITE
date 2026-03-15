import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import CookieConsent from "@/components/CookieConsent";

const inter = Inter({ subsets: ["latin"] });

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
      <body className={`${inter.className} bg-background text-text antialiased`}>
        {children}
        <CookieConsent />
      </body>
    </html>
  );
}
