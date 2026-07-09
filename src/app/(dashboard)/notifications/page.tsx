"use client";

import { useTranslations } from "next-intl";
import { Bell, CheckCircle2, AlertTriangle, Info, XCircle, Check, Trash2, Settings as SettingsIcon } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { EmptyState } from "@/components/dashboard/empty-state";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useNotifications, useMarkNotificationRead, useMarkAllNotificationsRead } from "@/lib/hooks/queries";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import type { AppNotification } from "@/types";

const typeConfig: Record<AppNotification["type"], { icon: typeof Info; color: string }> = {
  info: { icon: Info, color: "text-info bg-info/10" },
  success: { icon: CheckCircle2, color: "text-success bg-success/10" },
  warning: { icon: AlertTriangle, color: "text-warning bg-warning/10" },
  error: { icon: XCircle, color: "text-destructive bg-destructive/10" },
};

export default function NotificationsPage() {
  const t = useTranslations();
  const tNotif = useTranslations("notifications");
  const { data: notifications, isLoading } = useNotifications();
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();

  const unread = notifications?.filter((n) => !n.read) ?? [];
  const all = notifications ?? [];

  const handleMarkAll = () => {
    markAllRead.mutate(undefined, {
      onSuccess: () => toast.success(tNotif("markAllRead")),
    });
  };

  const renderList = (items: AppNotification[]) => {
    if (items.length === 0 && !isLoading) {
      return (
        <EmptyState
          icon={Bell}
          title={tNotif("noNotifications")}
          description={tNotif("noNotificationsDescription")}
        />
      );
    }
    return (
      <div className="space-y-2">
        {isLoading
          ? Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-20" />)
          : items.map((n) => {
              const cfg = typeConfig[n.type];
              const Icon = cfg.icon;
              return (
                <Card
                  key={n.id}
                  className={cn("transition-all hover:shadow-sm", !n.read && "border-primary/40 bg-primary/[0.02]")}
                >
                  <CardContent className="flex items-start gap-3 p-4">
                    <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-full", cfg.color)}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-medium leading-tight">{n.title}</p>
                        <span className="shrink-0 text-[10px] text-muted-foreground">
                          {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">{n.message}</p>
                      <div className="flex items-center gap-2 pt-1">
                        <Badge variant="outline" className="text-[10px]">{n.category}</Badge>
                        {!n.read && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 text-[11px]"
                            onClick={() => markRead.mutate(n.id)}
                          >
                            <Check className="mr-1 h-3 w-3" />
                            {tNotif("markAsRead")}
                          </Button>
                        )}
                        <Button variant="ghost" size="sm" className="h-6 text-[11px] text-destructive">
                          <Trash2 className="mr-1 h-3 w-3" />
                          {tNotif("deleteNotification")}
                        </Button>
                      </div>
                    </div>
                    {!n.read && <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary" />}
                  </CardContent>
                </Card>
              );
            })}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={tNotif("title")}
        description={tNotif("subtitle")}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleMarkAll} disabled={unread.length === 0 || markAllRead.isPending}>
              <Check className="mr-2 h-4 w-4" />
              {tNotif("markAllRead")}
            </Button>
            <Button variant="outline">
              <SettingsIcon className="mr-2 h-4 w-4" />
              {tNotif("settings")}
            </Button>
          </div>
        }
      />

      <Tabs defaultValue="unread">
        <TabsList>
          <TabsTrigger value="unread" className="text-xs">
            {tNotif("unread")}
            {unread.length > 0 && (
              <Badge variant="secondary" className="ml-1.5 h-4 px-1 text-[10px]">
                {unread.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="all" className="text-xs">
            {tNotif("all")}
            {all.length > 0 && (
              <Badge variant="outline" className="ml-1.5 h-4 px-1 text-[10px]">
                {all.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>
        <TabsContent value="unread" className="mt-4">
          {renderList(unread)}
        </TabsContent>
        <TabsContent value="all" className="mt-4">
          {renderList(all)}
        </TabsContent>
      </Tabs>
    </div>
  );
}
