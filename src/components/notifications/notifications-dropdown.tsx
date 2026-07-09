"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Bell, CheckCircle2, AlertTriangle, Info, XCircle, Check } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useNotifications, useMarkAllNotificationsRead } from "@/lib/hooks/queries";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

const typeIcons = {
  info: { icon: Info, className: "text-info bg-info/10" },
  success: { icon: CheckCircle2, className: "text-success bg-success/10" },
  warning: { icon: AlertTriangle, className: "text-warning bg-warning/10" },
  error: { icon: XCircle, className: "text-destructive bg-destructive/10" },
};

export function NotificationsDropdown() {
  const router = useRouter();
  const t = useTranslations();
  const { data: notifications, isLoading } = useNotifications();
  const markAllRead = useMarkAllNotificationsRead();

  const unreadCount = notifications?.filter((n) => !n.read).length ?? 0;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-9 w-9" aria-label="Notifications">
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-96 p-0" sideOffset={8}>
        <div className="flex items-center justify-between border-b px-4 py-3">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold">{t("notifications.title")}</h3>
            {unreadCount > 0 && (
              <Badge variant="secondary" className="h-5 text-[10px]">
                {unreadCount} new
              </Badge>
            )}
          </div>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              onClick={() => markAllRead.mutate()}
              disabled={markAllRead.isPending}
            >
              <Check className="mr-1 h-3 w-3" />
              {t("notifications.markAllRead")}
            </Button>
          )}
        </div>
        <ScrollArea className="max-h-96">
          <div className="divide-y">
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex gap-3 p-4">
                  <div className="h-8 w-8 shimmer rounded-full" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 w-3/4 shimmer rounded" />
                    <div className="h-3 w-full shimmer rounded" />
                  </div>
                </div>
              ))
            ) : notifications && notifications.length > 0 ? (
              notifications.map((n) => {
                const cfg = typeIcons[n.type];
                const Icon = cfg.icon;
                return (
                  <DropdownMenuItem
                    key={n.id}
                    className="flex cursor-pointer items-start gap-3 p-4 focus:bg-muted"
                    onClick={() => n.actionUrl && router.push(n.actionUrl)}
                  >
                    <div className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-full", cfg.className)}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 space-y-0.5">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium leading-tight">{n.title}</p>
                        {!n.read && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />}
                      </div>
                      <p className="text-xs text-muted-foreground">{n.message}</p>
                      <p className="text-[10px] text-muted-foreground/70">
                        {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                      </p>
                    </div>
                  </DropdownMenuItem>
                );
              })
            ) : (
              <div className="p-8 text-center">
                <Bell className="mx-auto h-8 w-8 text-muted-foreground/40" />
                <p className="mt-2 text-sm font-medium">{t("notifications.noNotifications")}</p>
                <p className="mt-1 text-xs text-muted-foreground">{t("notifications.noNotificationsDescription")}</p>
              </div>
            )}
          </div>
        </ScrollArea>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="cursor-pointer justify-center p-3 text-sm font-medium text-primary focus:text-primary"
          onClick={() => router.push("/notifications")}
        >
          {t("common.viewAll")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
