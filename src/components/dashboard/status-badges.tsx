"use client";

import { type LucideIcon, CheckCircle2, XCircle, AlertCircle, Info, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Status, HealthStatus, Severity } from "@/types";

const statusConfig: Record<Status, { label: string; className: string; dot: string }> = {
  active: { label: "Active", className: "bg-success/10 text-success border-success/30", dot: "bg-success" },
  inactive: { label: "Inactive", className: "bg-muted text-muted-foreground border-border", dot: "bg-muted-foreground" },
  pending: { label: "Pending", className: "bg-warning/10 text-warning border-warning/30", dot: "bg-warning" },
  error: { label: "Error", className: "bg-destructive/10 text-destructive border-destructive/30", dot: "bg-destructive" },
  suspended: { label: "Suspended", className: "bg-destructive/10 text-destructive border-destructive/30", dot: "bg-destructive" },
};

const healthConfig: Record<HealthStatus, { label: string; className: string; dot: string }> = {
  healthy: { label: "Healthy", className: "bg-success/10 text-success border-success/30", dot: "bg-success" },
  degraded: { label: "Degraded", className: "bg-warning/10 text-warning border-warning/30", dot: "bg-warning" },
  down: { label: "Down", className: "bg-destructive/10 text-destructive border-destructive/30", dot: "bg-destructive" },
  maintenance: { label: "Maintenance", className: "bg-info/10 text-info border-info/30", dot: "bg-info" },
};

const severityConfig: Record<Severity, { label: string; className: string }> = {
  info: { label: "Info", className: "bg-info/10 text-info border-info/30" },
  warning: { label: "Warning", className: "bg-warning/10 text-warning border-warning/30" },
  error: { label: "Error", className: "bg-destructive/10 text-destructive border-destructive/30" },
  critical: { label: "Critical", className: "bg-destructive/15 text-destructive border-destructive/40" },
};

export function StatusBadge({ status, className }: { status: Status; className?: string }) {
  const cfg = statusConfig[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium",
        cfg.className,
        className
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", cfg.dot)} />
      {cfg.label}
    </span>
  );
}

export function HealthBadge({ status, className }: { status: HealthStatus; className?: string }) {
  const cfg = healthConfig[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium",
        cfg.className,
        className
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", cfg.dot)} />
      {cfg.label}
    </span>
  );
}

export function SeverityBadge({ severity, className }: { severity: Severity; className?: string }) {
  const cfg = severityConfig[severity];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium",
        cfg.className,
        className
      )}
    >
      {cfg.label}
    </span>
  );
}

interface IconBadgeProps {
  icon: LucideIcon;
  variant?: "default" | "success" | "warning" | "error" | "info";
  className?: string;
}

export function IconBadge({ icon: Icon, variant = "default", className }: IconBadgeProps) {
  const variants = {
    default: "bg-muted text-muted-foreground",
    success: "bg-success/10 text-success",
    warning: "bg-warning/10 text-warning",
    error: "bg-destructive/10 text-destructive",
    info: "bg-info/10 text-info",
  };
  return (
    <div className={cn("flex h-9 w-9 items-center justify-center rounded-lg", variants[variant], className)}>
      <Icon className="h-4 w-4" />
    </div>
  );
}

export { CheckCircle2, XCircle, AlertCircle, Info, Clock };
