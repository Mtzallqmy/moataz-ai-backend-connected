"use client";

import { type LucideIcon, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: string | number;
  changePct?: number;
  trend?: "up" | "down" | "neutral";
  icon: LucideIcon;
  description?: string;
  iconClassName?: string;
  isLoading?: boolean;
}

export function StatCard({
  label,
  value,
  changePct,
  trend,
  icon: Icon,
  description,
  iconClassName,
  isLoading,
}: StatCardProps) {
  if (isLoading) {
    return (
      <Card className="overflow-hidden">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <div className="h-4 w-24 shimmer rounded" />
              <div className="h-7 w-32 shimmer rounded" />
              <div className="h-3 w-20 shimmer rounded" />
            </div>
            <div className="h-10 w-10 shimmer rounded-lg" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const TrendIcon = trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : Minus;
  const trendColor =
    trend === "up"
      ? "text-success"
      : trend === "down"
      ? "text-destructive"
      : "text-muted-foreground";

  return (
    <Card className="overflow-hidden transition-all hover:shadow-md hover:border-primary/30">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-1.5">
            <p className="text-sm font-medium text-muted-foreground">{label}</p>
            <p className="text-2xl font-bold tracking-tight">{value}</p>
            {changePct !== undefined && (
              <div className="flex items-center gap-1 text-xs">
                <TrendIcon className={cn("h-3 w-3", trendColor)} />
                <span className={trendColor}>{Math.abs(changePct)}%</span>
                {description && <span className="text-muted-foreground">{description}</span>}
              </div>
            )}
            {!changePct && description && (
              <p className="text-xs text-muted-foreground">{description}</p>
            )}
          </div>
          <div
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary",
              iconClassName
            )}
          >
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
