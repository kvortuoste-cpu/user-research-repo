"use client";

import Link from "next/link";
import { Menu } from "lucide-react";
import { useNav } from "@/components/NavContext";

export function Header() {
  const { toggle } = useNav();

  return (
    <header style={{ borderBottom: "1px solid #e2e3e5", backgroundColor: "#fff" }}>
      <div className="px-12 py-3 flex items-center gap-3">
        <button
          onClick={toggle}
          aria-label="Toggle projects navigation"
          className="p-1.5 rounded text-[#6d6d6f] hover:text-black hover:bg-[#f0f0f0] transition-colors"
        >
          <Menu className="h-5 w-5" />
        </button>
        <Link
          href="/"
          className="font-semibold tracking-tight text-base transition-colors"
          style={{ fontFamily: "var(--ac-font-family-display)", color: "#1460aa" }}
        >
          Research Repo
        </Link>
        <span className="text-xs ml-auto" style={{ color: "#6d6d6f" }}>POC</span>
      </div>
    </header>
  );
}
