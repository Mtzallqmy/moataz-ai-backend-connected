"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import {
  Activity,
  DollarSign,
  Zap,
  Boxes,
  TrendingUp,
  ArrowUpRight,
  Server,
  Cpu,
} from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { ChartCard, TrendChart, DonutChart, BarsChart } from "@/components/charts/charts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { StatusBadge } from "@/components/dashboard/status-badges";
import { useUsageSummary, useProviders, useHealth } from "@/lib/hooks/queries";
import { formatCompact, formatCurrency, formatLatency } from "@/lib/format";
import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardPage() {
  const t = useTranslations();
  const tDashboard = useTranslations("dashboard");
  const { data: usage, isLoading: usageLoading } = useUsageSummary();
  const { data: providers, isLoading: providersLoading } = useProviders();
  const { data: health } = useHealth();

  const recentActivity =
    providers?.slice(0, 5).map((provider) => ({
      id: provider.id,
      user: "System",
      action: provider.status === "active" ? "Provider connected" : "Provider configured",
      target: provider.name,
      time: provider.updatedAt ? new Date(provider.updatedAt).toLocaleString() : "",
    })) ?? [];

  const donutData = usage?.topProviders.map((p) => ({ name: p.providerName, value: p.requestCount })) ?? [];

  const barsData = usage?.topModels.slice(0, 5).map((m) => ({
    name: m.modelName,
    requests: m.requestCount,
  })) ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title={tDashboard("title")}
        description={tDashboard("subtitle")}
        actions={
          <Button asChild>
            <Link href="/playground">
              <Zap className="mr-2 h-4 w-4" />
              {t("nav.playground")}
            </Link>
          </Button>
        }
      />

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label={tDashboard("totalRequests")}
          value={usage ? formatCompact(usage.totalRequests) : "—"}
          changePct={usage?.changePct.requests}
          trend="up"
          description={tDashboard("vsLastPeriod")}
          icon={Activity}
          isLoading={usageLoading}
        />
        <StatCard
          label={tDashboard("totalTokens")}
          value={usage ? formatCompact(usage.totalTokens) : "—"}
          changePct={usage?.changePct.tokens}
          trend="up"
          description={tDashboard("vsLastPeriod")}
          icon={Cpu}
          isLoading={usageLoading}
        />
        <StatCard
          label={tDashboard("totalCost")}
          value={usage ? formatCurrency(usage.totalCost) : "—"}
          changePct={usage?.changePct.cost}
          trend="up"
          description={tDashboard("vsLastPeriod")}
          icon={DollarSign}
          isLoading={usageLoading}
        />
        <StatCard
          label={tDashboard("activeProviders")}
          value={providers ? `${providers.filter((p) => p.status === "active").length} / ${providers.length}` : "—"}
          icon={Boxes}
          description="across all regions"
          isLoading={providersLoading}
        />
      </div>

      {/* Charts row */}
      <div className="grid gap-4 lg:grid-cols-7">
        <ChartCard
          title={tDashboard("requestsOverTime")}
          description="Last 30 days"
          className="lg:col-span-4"
          action={
            <Button variant="ghost" size="sm" asChild>
              <Link href="/analytics">
                <TrendingUp className="mr-1 h-3.5 w-3.5" />
                Analytics
              </Link>
            </Button>
          }
        >
          {usage ? (
            <TrendChart data={usage.dailyTrend} dataKey={["requests", "tokens"]} xKey="date" height={280} />
          ) : (
            <Skeleton className="h-[280px] w-full" />
          )}
        </ChartCard>

        <ChartCard
          title={tDashboard("costBreakdown")}
          description="By provider"
          className="lg:col-span-3"
        >
          {donutData.length > 0 ? (
            <DonutChart data={donutData} height={280} />
          ) : (
            <Skeleton className="h-[280px] w-full" />
          )}
        </ChartCard>
      </div>

      {/* Bottom row */}
      <div className="grid gap-4 lg:grid-cols-7">
        {/* Top models */}
        <ChartCard
          title={tDashboard("topModels")}
          description="By request volume"
          className="lg:col-span-4"
          action={
            <Button variant="ghost" size="sm" asChild>
              <Link href="/models">
                {t("common.viewAll")}
                <ArrowUpRight className="ml-1 h-3.5 w-3.5" />
              </Link>
            </Button>
          }
        >
          {barsData.length > 0 ? (
            <BarsChart data={barsData} dataKey="requests" xKey="name" height={260} />
          ) : (
            <Skeleton className="h-[260px] w-full" />
          )}
        </ChartCard>

        {/* Recent activity */}
        <Card className="lg:col-span-3">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">{tDashboard("recentActivity")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {recentActivity.length === 0 ? (
              <p className="text-sm text-muted-foreground">No live activity yet. Add a provider or send a chat message to start collecting events.</p>
            ) : (
              recentActivity.map((a) => (
                <div key={a.id} className="flex items-start gap-3 rounded-lg p-2 transition-colors hover:bg-muted/50">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-muted text-[10px] font-medium">SY</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 space-y-0.5">
                    <p className="text-sm leading-tight">
                      <span className="font-medium">{a.user}</span>{" "}
                      <span className="text-muted-foreground">{a.action}</span>{" "}
                      <span className="font-medium">{a.target}</span>
                    </p>
                    <p className="text-xs text-muted-foreground">{a.time}</p>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Provider status */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
          <CardTitle className="text-base font-semibold">{tDashboard("providerStatus")}</CardTitle>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/providers">
              {tDashboard("viewAllProviders")}
              <ArrowUpRight className="ml-1 h-3.5 w-3.5" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {providersLoading ? (
              Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24" />)
            ) : (
              providers?.slice(0, 4).map((p) => {
                const healthInfo = health?.find((h) => h.providerId === p.id);
                return (
                  <div
                    key={p.id}
                    className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-muted/50"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                        <Server className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{p.name}</p>
                        <p className="text-xs text-muted-foreground">{formatLatency(p.latencyMs)} avg</p>
                      </div>
                    </div>
                    <StatusBadge status={p.status} />
                  </div>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
