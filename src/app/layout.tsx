import type { Metadata } from "next";
import { Cinzel, Inter } from "next/font/google";
import "./globals.css";

const cinzel = Cinzel({
  variable: "--font-cinzel",
  subsets: ["latin"],
  weight: ["400", "600", "700", "800"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://p99-scrying-pool.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Naberial's Scrying Pool - P99 EverQuest Character Viewer",
    template: "%s | Naberial's Scrying Pool",
  },
  description:
    "View and share your Project 1999 EverQuest character equipment, stats, and upgrade recommendations. Upload your inventory file and get a shareable profile with gear scoring.",
  keywords: [
    "p99", "project 1999", "everquest", "classic eq", "p99 gear",
    "p99 character", "p99 equipment", "p99 upgrades", "p99 items",
    "everquest character viewer", "p99 item comparison", "velious",
  ],
  openGraph: {
    title: "Naberial's Scrying Pool - P99 EverQuest Character Viewer",
    description:
      "Upload your Project 1999 inventory file to view equipment, stats, and upgrade recommendations. Share your character with the community.",
    siteName: "Naberial's Scrying Pool",
    type: "website",
    locale: "en_US",
    url: SITE_URL,
  },
  twitter: {
    card: "summary",
    title: "Naberial's Scrying Pool - P99 Character Viewer",
    description:
      "Upload your P99 inventory file to view equipment, stats, and upgrade recommendations.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${cinzel.variable} ${inter.variable} font-sans antialiased bg-zinc-950 text-zinc-100`}
      >
        {children}
      </body>
    </html>
  );
}
