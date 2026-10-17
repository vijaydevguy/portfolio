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
    icon: logo,
    shortcut: logo,
    apple: logo,
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${outfit.variable} h-full`}>
      <body className="min-h-full flex flex-col font-sans bg-white text-zinc-900 antialiased">
        {children}
      </body>
    </html>
  );
}
