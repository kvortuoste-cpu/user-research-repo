import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "sonner";
import { PrimerProvider } from "@/components/PrimerProvider";
import { NavProvider } from "@/components/NavContext";
import { Header } from "@/components/Header";

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
    <html lang="en" className="h-full">
      <body className="min-h-full flex flex-col" style={{ backgroundColor: "#f6f6f6", color: "#000", fontFamily: "var(--ac-font-family-text)" }}>
        <PrimerProvider>
          <NavProvider>
            <Header />
            <main className="flex-1">{children}</main>
            <Toaster richColors position="top-right" />
          </NavProvider>
        </PrimerProvider>
      </body>
    </html>
  );
}
