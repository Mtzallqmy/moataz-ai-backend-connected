"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Search, Command } from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { useSettingsStore } from "@/stores/settings-store";
import { navSections } from "@/config/nav";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export function CommandSearch() {
  const router = useRouter();
  const t = useTranslations();
  const commandOpen = useSettingsStore((s) => s.commandOpen);
  const setCommandOpen = useSettingsStore((s) => s.setCommandOpen);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setCommandOpen(!commandOpen);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [commandOpen, setCommandOpen]);

  const handleSelect = (href: string) => {
    router.push(href);
    setCommandOpen(false);
  };

  return (
    <>
      <Button
        variant="outline"
        onClick={() => setCommandOpen(true)}
        className="hidden h-9 w-64 justify-start gap-2 px-3 text-sm text-muted-foreground md:flex lg:w-72"
      >
        <Search className="h-4 w-4" />
        <span className="flex-1 text-left">{t("common.searchAll")}</span>
        <kbd className="flex h-5 items-center gap-0.5 rounded border bg-muted px-1 text-[10px] font-mono">
          <Command className="h-2.5 w-2.5" />K
        </kbd>
      </Button>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setCommandOpen(true)}
        className="h-9 w-9 md:hidden"
        aria-label="Search"
      >
        <Search className="h-4 w-4" />
      </Button>

      <CommandDialog open={commandOpen} onOpenChange={setCommandOpen}>
        <CommandInput placeholder={t("common.searchAll")} />
        <CommandList className="max-h-[400px]">
          <CommandEmpty>{t("common.noResults")}</CommandEmpty>
          {navSections.map((section) => (
            <CommandGroup key={section.titleKey} heading={t(section.titleKey)}>
              {section.items.map((item) => {
                const Icon = item.icon;
                return (
                  <CommandItem
                    key={item.href}
                    value={`${t(item.titleKey)} ${item.href}`}
                    onSelect={() => handleSelect(item.href)}
                    className="cursor-pointer"
                  >
                    <Icon className="mr-2 h-4 w-4 text-muted-foreground" />
                    <span>{t(item.titleKey)}</span>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          ))}
          <CommandSeparator />
          <CommandGroup heading="Quick actions">
            <CommandItem onSelect={() => handleSelect("/playground")} className="cursor-pointer">
              <Search className="mr-2 h-4 w-4" />
              Open Playground
            </CommandItem>
            <CommandItem onSelect={() => handleSelect("/api-keys")} className="cursor-pointer">
              <Search className="mr-2 h-4 w-4" />
              Create API Key
            </CommandItem>
            <CommandItem onSelect={() => handleSelect("/providers")} className="cursor-pointer">
              <Search className="mr-2 h-4 w-4" />
              Add Provider
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
}
