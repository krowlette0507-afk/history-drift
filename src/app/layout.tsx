import type { Metadata, Viewport } from "next";
import "./globals.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export const metadata: Metadata = {
  title: "History Drift — Capture Your Legacy",
  description:
    "History Drift helps you capture your own life story or the life story of a loved one through AI-powered verbal interviews.",
  openGraph: {
    title: "History Drift",
    description: "Every life has a story worth preserving.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-[#1a1208] text-[#f5ead8]">
        {children}
      </body>
    </html>
  );
}
