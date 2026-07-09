"use client";

import { NextIntlClientProvider } from "next-intl";
import { type ReactNode, useMemo } from "react";
import { useSettingsStore } from "@/stores/settings-store";
import enMessages from "@/messages/en.json";
import arMessages from "@/messages/ar.json";

const messageMap = {
  en: enMessages,
  ar: arMessages,
} as const;

export function IntlProvider({ children }: { children: ReactNode }) {
  const locale = useSettingsStore((s) => s.locale);
  const messages = useMemo(() => messageMap[locale], [locale]);

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      {children}
    </NextIntlClientProvider>
  );
}
