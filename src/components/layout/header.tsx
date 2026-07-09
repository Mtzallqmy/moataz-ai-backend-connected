"use client";

import { useState } from "react";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Breadcrumbs } from "./breadcrumbs";
import { CommandSearch } from "@/components/search/command-search";
import { NotificationsDropdown } from "@/components/notifications/notifications-dropdown";
import { UserMenu } from "./user-menu";
import { ThemeToggle, LanguageToggle } from "./toggles";
import { useSettingsStore } from "@/stores/settings-store";

interface HeaderProps {
  onOpenMobileSidebar: () => void;
}

export function Header({ onOpenMobileSidebar }: HeaderProps) {
  const toggleSidebar = useSettingsStore((s) => s.toggleSidebar);
  const [_, setMobileOpen] = useState(false);
  void _;
  void setMobileOpen;

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60 md:px-6">
      {/* Mobile menu button */}
      <Button
        variant="ghost"
        size="icon"
        className="h-9 w-9 lg:hidden"
        onClick={onOpenMobileSidebar}
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5" />
      </Button>

      {/* Desktop collapse button */}
      <Button
        variant="ghost"
        size="icon"
        className="hidden h-9 w-9 lg:flex"
        onClick={toggleSidebar}
        aria-label="Toggle sidebar"
      >
        <Menu className="h-5 w-5" />
      </Button>

      {/* Breadcrumbs */}
      <div className="hidden flex-1 md:block">
        <Breadcrumbs />
      </div>

      {/* Search */}
      <div className="ml-auto flex items-center gap-1.5 md:gap-2">
        <CommandSearch />
        <LanguageToggle />
        <ThemeToggle />
        <NotificationsDropdown />
        <div className="mx-1 h-6 w-px bg-border" />
        <UserMenu />
      </div>
    </header>
  );
}
