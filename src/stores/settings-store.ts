import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { Locale, ThemeMode } from "@/types";

type Density = "compact" | "comfortable" | "spacious";
type AccentColor = "violet" | "emerald" | "amber" | "rose" | "cyan";

interface SettingsState {
  locale: Locale;
  theme: ThemeMode;
  density: Density;
  accentColor: AccentColor;
  sidebarCollapsed: boolean;
  commandOpen: boolean;
  notificationsOpen: boolean;
  emailNotifications: boolean;
  pushNotifications: boolean;
  weeklyDigest: boolean;
  twoFactor: boolean;
  setLocale: (locale: Locale) => void;
  setTheme: (theme: ThemeMode) => void;
  setDensity: (density: Density) => void;
  setAccentColor: (color: AccentColor) => void;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setCommandOpen: (open: boolean) => void;
  setNotificationsOpen: (open: boolean) => void;
  setEmailNotifications: (v: boolean) => void;
  setPushNotifications: (v: boolean) => void;
  setWeeklyDigest: (v: boolean) => void;
  setTwoFactor: (v: boolean) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      locale: "en",
      theme: "system",
      density: "comfortable",
      accentColor: "violet",
      sidebarCollapsed: false,
      commandOpen: false,
      notificationsOpen: false,
      emailNotifications: true,
      pushNotifications: true,
      weeklyDigest: false,
      twoFactor: false,

      setLocale: (locale) => set({ locale }),
      setTheme: (theme) => set({ theme }),
      setDensity: (density) => set({ density }),
      setAccentColor: (accentColor) => set({ accentColor }),
      toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
      setSidebarCollapsed: (sidebarCollapsed) => set({ sidebarCollapsed }),
      setCommandOpen: (commandOpen) => set({ commandOpen }),
      setNotificationsOpen: (notificationsOpen) => set({ notificationsOpen }),
      setEmailNotifications: (emailNotifications) => set({ emailNotifications }),
      setPushNotifications: (pushNotifications) => set({ pushNotifications }),
      setWeeklyDigest: (weeklyDigest) => set({ weeklyDigest }),
      setTwoFactor: (twoFactor) => set({ twoFactor }),
    }),
    {
      name: "moataz-settings",
      storage: createJSONStorage(() => (typeof window !== "undefined" ? localStorage : (undefined as unknown as Storage))),
    }
  )
);
