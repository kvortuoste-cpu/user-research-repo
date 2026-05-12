"use client";

import { ThemeProvider } from "@primer/react";

export function PrimerProvider({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider colorMode="light">
      {children}
    </ThemeProvider>
  );
}
