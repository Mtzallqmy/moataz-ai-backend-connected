"use client";

import { useTranslations } from "next-intl";
import { useAuthStore } from "@/stores/auth-store";
import {
  User,
  Settings,
  LogOut,
  CreditCard,
  ChevronDown,
  CircleUser,
  Bell,
  BookOpen,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuShortcut,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useRouter } from "next/navigation";

export function UserMenu() {
  const t = useTranslations();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  const initials =
    user?.name
      ?.split(" ")
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() ?? "U";

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-2 rounded-lg px-2 py-1.5 transition-colors hover:bg-muted">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="hidden text-left md:block">
            <p className="text-xs font-medium leading-none">{user?.name ?? "User"}</p>
            <p className="mt-0.5 text-[10px] text-muted-foreground">{user?.role ?? "Owner"}</p>
          </div>
          <ChevronDown className="hidden h-3.5 w-3.5 text-muted-foreground md:block" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60" sideOffset={8}>
        <DropdownMenuLabel>
          <div className="flex flex-col">
            <span className="text-sm font-medium">{user?.name ?? "User"}</span>
            <span className="text-xs text-muted-foreground">{user?.email ?? "not signed in"}</span>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => router.push("/profile")}>
          <User className="mr-2 h-4 w-4" />
          {t("nav.profile")}
          <DropdownMenuShortcut>⌘P</DropdownMenuShortcut>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => router.push("/account")}>
          <CircleUser className="mr-2 h-4 w-4" />
          {t("nav.account")}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => router.push("/billing")}>
          <CreditCard className="mr-2 h-4 w-4" />
          {t("nav.billing")}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => router.push("/settings")}>
          <Settings className="mr-2 h-4 w-4" />
          {t("nav.settings")}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => router.push("/notifications")}>
          <Bell className="mr-2 h-4 w-4" />
          {t("nav.notifications")}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => router.push("/documentation")}>
          <BookOpen className="mr-2 h-4 w-4" />
          {t("nav.documentation")}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
          <LogOut className="mr-2 h-4 w-4" />
          {t("common.logout")}
          <DropdownMenuShortcut>⌘Q</DropdownMenuShortcut>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
