"use client";

import { Moon, Sun, Monitor, Languages } from "lucide-react";
import { useSettingsStore } from "@/stores/settings-store";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { useTranslations } from "next-intl";
import type { ThemeMode, Locale } from "@/types";
import { cn } from "@/lib/utils";

export function ThemeToggle() {
  const theme = useSettingsStore((s) => s.theme);
  const setTheme = useSettingsStore((s) => s.setTheme);
  const t = useTranslations();

  const options: Array<{ value: ThemeMode; icon: typeof Sun; label: string }> = [
    { value: "light", icon: Sun, label: t("common.lightMode") },
    { value: "dark", icon: Moon, label: t("common.darkMode") },
    { value: "system", icon: Monitor, label: t("common.systemMode") },
  ];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-9 w-9" aria-label="Toggle theme">
          <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        <DropdownMenuLabel className="text-xs">{t("common.theme")}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {options.map((opt) => (
          <DropdownMenuItem
            key={opt.value}
            onClick={() => setTheme(opt.value)}
            className={cn("cursor-pointer", theme === opt.value && "bg-muted")}
          >
            <opt.icon className="mr-2 h-4 w-4" />
            {opt.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function LanguageToggle() {
  const locale = useSettingsStore((s) => s.locale);
  const setLocale = useSettingsStore((s) => s.setLocale);
  const t = useTranslations();

  const options: Array<{ value: Locale; label: string; flag: string }> = [
    { value: "en", label: t("common.english"), flag: "🇬🇧" },
    { value: "ar", label: t("common.arabic"), flag: "🇸🇦" },
  ];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-9 w-9" aria-label="Change language">
          <Languages className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        <DropdownMenuLabel className="text-xs">{t("common.language")}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {options.map((opt) => (
          <DropdownMenuItem
            key={opt.value}
            onClick={() => setLocale(opt.value)}
            className={cn("cursor-pointer", locale === opt.value && "bg-muted")}
          >
            <span className="mr-2 text-base leading-none">{opt.flag}</span>
            {opt.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
