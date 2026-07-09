"use client";

import { useTranslations } from "next-intl";
import { Activity, CheckCircle2, AlertTriangle, XCircle, Wrench, Globe } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { HealthBadge } from "@/components/dashboard/status-badges";
import { useHealth, useRunDiagnostic } from "@/lib/hooks/queries";
import { formatLatency, formatPercent } from "@/lib/format";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { HealthStatus } from "@/types";

const statusIcon: Record<HealthStatus, typeof CheckCircle2> = {
  healthy: CheckCircle2,
  degraded: AlertTriangle,
  down: XCircle,
  maintenance: Wrench,
};

const statusColor: Record<HealthStatus, string> = {
  healthy: "text-success",
  degraded: "text-warning",
  down: "text-destructive",
  maintenance: "text-info",
};

export default function HealthPage() {
  const t = useTranslations();
  const tHealth = useTranslations("health");
  const { data: health, isLoading } = useHealth();
  const runDiagnostic = useRunDiagnostic();

  const healthy = health?.filter((h) => h.status === "healthy").length ?? 0;
  const degraded = health?.filter((h) => h.status === "degraded").length ?? 0;
  const down = health?.filter((h) => h.status === "down").length ?? 0;
  const totalIncidents = health?.reduce((acc, h) => acc + h.incidents, 0) ?? 0;

  return (
    <div className="space-y-6">
      <PageHeader title={tHealth("title")} description={tHealth("subtitle")} />

      {degraded === 0 && down === 0 && !isLoading ? (
        <div className="flex items-center gap-3 rounded-lg border border-success/30 bg-success/5 p-4">
          <CheckCircle2 className="h-5 w-5 text-success" />
          <div>
            <p className="font-medium text-success">{tHealth("allSystemsOperational")}</p>
            <p className="text-xs text-muted-foreground">All providers are responding normally.</p>
          </div>
        </div>
      ) : (degraded > 0 || down > 0) && !isLoading ? (
        <div className="flex items-center gap-3 rounded-lg border border-warning/30 bg-warning/5 p-4">
          <AlertTriangle className="h-5 w-5 text-warning" />
          <div>
            <p className="font-medium text-warning">{tHealth("issuesDetected")}</p>
            <p className="text-xs text-muted-foreground">
              {degraded} degraded, {down} down. Investigate affected providers.
            </p>
          </div>
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Healthy providers"
          value={isLoading ? "—" : `${healthy} / ${health?.length ?? 0}`}
          icon={CheckCircle2}
          iconClassName="bg-success/10 text-success"
          isLoading={isLoading}
        />
        <StatCard
          label="Degraded"
          value={isLoading ? "—" : degraded}
          icon={AlertTriangle}
          iconClassName="bg-warning/10 text-warning"
          isLoading={isLoading}
        />
        <StatCard
          label="Down"
          value={isLoading ? "—" : down}
          icon={XCircle}
          iconClassName="bg-destructive/10 text-destructive"
          isLoading={isLoading}
        />
        <StatCard
          label={tHealth("incidents")}
          value={isLoading ? "—" : totalIncidents}
          icon={Activity}
          isLoading={isLoading}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {isLoading
          ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-64" />)
          : health?.map((h) => {
              const StatusIcon = statusIcon[h.status];
              return (
                <Card key={h.id} className="overflow-hidden">
                  <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-3">
                    <div className="flex items-center gap-3">
                      <div className={cn("flex h-10 w-10 items-center justify-center rounded-lg", `${statusColor[h.status]}`.replace("text-", "bg-") + "/10")}>
                        <StatusIcon className={cn("h-5 w-5", statusColor[h.status])} />
                      </div>
                      <div>
                        <CardTitle className="text-base">{h.providerName}</CardTitle>
                        <p className="text-xs text-muted-foreground">{h.region}</p>
                      </div>
                    </div>
                    <HealthBadge status={h.status} />
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div className="rounded-md bg-muted/50 p-2">
                        <p className="text-muted-foreground">Latency</p>
                        <p className="font-semibold">{formatLatency(h.latencyMs)}</p>
                      </div>
                      <div className="rounded-md bg-muted/50 p-2">
                        <p className="text-muted-foreground">Uptime</p>
                        <p className="font-semibold">{formatPercent(h.uptimePct, 2)}</p>
                      </div>
                      <div className="rounded-md bg-muted/50 p-2">
                        <p className="text-muted-foreground">Incidents</p>
                        <p className="font-semibold">{h.incidents}</p>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="flex items-center gap-1.5 text-muted-foreground">
                          <Globe className="h-3 w-3" />
                          {tHealth("connectivity")}
                        </span>
                        {h.details.connectivity ? (
                          <CheckCircle2 className="h-3.5 w-3.5 text-success" />
                        ) : (
                          <XCircle className="h-3.5 w-3.5 text-destructive" />
                        )}
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">{tHealth("authentication")}</span>
                        {h.details.authentication ? (
                          <CheckCircle2 className="h-3.5 w-3.5 text-success" />
                        ) : (
                          <XCircle className="h-3.5 w-3.5 text-destructive" />
                        )}
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">{tHealth("rateLimit")}</span>
                        <Badge variant="outline" className="text-[10px]">
                          {h.details.rateLimit}/min
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">{tHealth("quotaRemaining")}</span>
                        <span className="font-mono text-xs">{h.details.quotaRemaining.toLocaleString()}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between pt-2">
                      <span className="text-xs text-muted-foreground">
                        {tHealth("lastChecked")}: {formatDistanceToNow(new Date(h.lastCheckedAt), { addSuffix: true })}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          runDiagnostic.mutate(h.providerId, {
                            onSuccess: (res) =>
                              toast.success(`Diagnostic complete`, {
                                description: `${h.providerName}: ${res.status} (${formatLatency(res.latencyMs)})`,
                              }),
                          })
                        }
                        disabled={runDiagnostic.isPending}
                      >
                        <Wrench className="mr-1.5 h-3.5 w-3.5" />
                        {tHealth("runDiagnostic")}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
      </div>
    </div>
  );
}
