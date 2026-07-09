import { getRequestConfig } from "next-intl/server";
import { notFound } from "next/navigation";
import { locales, type Locale } from "./config";

export default getRequestConfig(async ({ locale }) => {
  const currentLocale = (locale as Locale) || "en";

  if (!locales.includes(currentLocale as Locale)) {
    notFound();
  }

  return {
    messages: (await import(`../messages/${currentLocale}.json`)).default,
    locale: currentLocale,
  };
});
