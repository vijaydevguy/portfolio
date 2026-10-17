import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";

import { CLOUDINARY_URLS } from "./assets";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
});

const logo = CLOUDINARY_URLS.logo;

export const metadata: Metadata = {
  title: "Vijaya kumar | software developer",
  description: "Software Developer",
  icons: {
    icon: CLOUDINARY_URLS.logo,
    shortcut: CLOUDINARY_URLS.logo,
    apple: CLOUDINARY_URLS.logo,
  },
  openGraph: {
    title: "Vijaya kumar | software developer",
    description: "Software Developer Portfolio",
    type: "website",
    images: [
      {
        url: CLOUDINARY_URLS.logo_black,
        width: 1200,
        height: 630,
        alt: "Vijaya kumar - Software Developer",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Vijaya kumar | software developer",
    description: "Software Developer Portfolio",
    images: [CLOUDINARY_URLS.logo_black],
  },
};

import { Suspense } from "react";
import GoogleAnalytics from "./components/GoogleAnalytics";

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${outfit.variable} h-full`}>
      <body className="min-h-full flex flex-col font-sans bg-white text-zinc-900 antialiased">
        <Suspense fallback={null}>
          <GoogleAnalytics />
        </Suspense>
        {children}
      </body>
    </html>
  );
}
