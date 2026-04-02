import type { Metadata } from "next";
import { Inter, Playfair_Display, DM_Sans } from "next/font/google";
import "./globals.css";
import TopNav from "@/components/TopNav";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["700", "900"],
  style: ["normal", "italic"],
});

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
});

export const metadata: Metadata = {
  metadataBase: new URL('https://dnadiscipleship.com'),
  title: "DNA — Discipleship Naturally Activated",
  description: "DNA isn't accidental discipleship — it's loving people with a plan. A complete system for multiplication discipleship.",
  openGraph: {
    title: "DNA — Discipleship Naturally Activated",
    description: "DNA isn't accidental discipleship — it's loving people with a plan. A complete system for multiplication discipleship.",
    url: 'https://dnadiscipleship.com',
    siteName: 'DNA Discipleship',
    images: [{ url: '/opengraph-image', width: 1200, height: 630, alt: 'DNA Discipleship' }],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: "DNA — Discipleship Naturally Activated",
    description: "DNA isn't accidental discipleship — it's loving people with a plan. A complete system for multiplication discipleship.",
    images: ['/opengraph-image'],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${playfair.variable} ${dmSans.variable} antialiased`}>
        <TopNav />
        {children}
      </body>
    </html>
  );
}
