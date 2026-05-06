import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Research Repo",
  description: "Internal user research repository POC",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-neutral-50 text-neutral-900">
        <header className="border-b bg-white">
          <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
            <Link
              href="/"
              className="font-semibold tracking-tight text-base hover:text-blue-600 transition-colors"
            >
              Research Repo
            </Link>
            <span className="text-xs text-neutral-500">POC</span>
          </div>
        </header>
        <main className="flex-1">{children}</main>
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
