"use client";

import { useState, type ReactNode } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { motion } from "framer-motion";
import { usePathname } from "next/navigation";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar isMobileOpen={mobileOpen} onCloseMobile={() => setMobileOpen(false)} />

      <div className="flex flex-1 flex-col min-w-0">
        <Header onOpenMobileSidebar={() => setMobileOpen(true)} />
        <main className="flex-1 overflow-y-auto">
          <motion.div
            key={pathname}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="mx-auto w-full max-w-[1600px] p-4 md:p-6 lg:p-8"
          >
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  );
}
