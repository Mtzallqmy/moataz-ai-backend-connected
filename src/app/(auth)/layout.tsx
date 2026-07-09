"use client";

import { type ReactNode } from "react";
import Link from "next/link";
import { Sparkles } from "lucide-react";
import { LanguageToggle, ThemeToggle } from "@/components/layout/toggles";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative flex min-h-screen flex-col bg-gradient-to-br from-background via-background to-muted/40">
      {/* Top bar */}
      <div className="absolute right-4 top-4 z-10 flex items-center gap-1.5">
        <LanguageToggle />
        <ThemeToggle />
      </div>

      {/* Brand */}
      <div className="absolute left-6 top-6 z-10">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-chart-4 text-primary-foreground">
            <Sparkles className="h-4 w-4" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-bold leading-none">Moataz</span>
            <span className="text-[10px] text-muted-foreground">AI Gateway</span>
          </div>
        </Link>
      </div>

      {/* Decorative background */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-40 -top-40 h-96 w-96 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-chart-4/10 blur-3xl" />
      </div>

      {/* Content */}
      <div className="relative z-[1] flex flex-1 items-center justify-center p-4">
        <div className="w-full max-w-md">{children}</div>
      </div>

      {/* Footer */}
      <footer className="relative z-[1] px-6 py-4 text-center text-xs text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} Moataz AI Gateway. All rights reserved.</p>
      </footer>
    </div>
  );
}
