"use client";

import { useTranslations } from "next-intl";
import { BarChart3, TrendingUp, Gauge, AlertOctagon, Target } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { ChartCard, TrendChart, SimpleLineChart, BarsChart, DonutChart } from "@/components/charts/charts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useUsageSummary } from "@/lib/hooks/queries";
import { formatLatency, formatPercent } from "@/lib/format";

export default function AnalyticsPage() {
  const t = useTranslations();
  const tAnalytics = useTranslations("analytics");
  const { data: usage, isLoading } = useUsageSummary();

  const latencyData = [
    { name: "< 100ms", value: 32 },
    { name: "100-300ms", value: 41 },
    { name: "300-500ms", value: 18 },
    { name: "500ms-1s", value: 7 },
    { name: "> 1s", value: 2 },
  ];

  const errorData = [
    { name: "Rate limited", value: 42 },
    { name: "Timeout", value: 28 },
    { name: "5xx errors", value: 18 },
    { name: "4xx errors", value: 12 },
  ];

  const qualityData = usage?.dailyTrend.map((d) => ({
    date: d.date,
    success: d.requests - d.errors,
    errors: d.errors,
  })) ?? [];

  return (
    <div className="space-y-6">
      <PageHeader title={tAnalytics("title")} description={tAnalytics("subtitle")} />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label={tAnalytics("successRate")}
          value={usage ? formatPercent(100 - usage.errorRate, 2) : "—"}
          icon={Target}
          description="last 30 days"
          isLoading={isLoading}
        />
        <StatCard
          label={tAnalytics("throughput")}
          value={usage ? `${(usage.totalRequests / 30 / 86400).toFixed(1)}/s` : "—"}
          icon={TrendingUp}
          description="avg per second"
          isLoading={isLoading}
        />
        <StatCard
          label={tAnalytics("p50Latency")}
          value={usage ? formatLatency(usage.avgLatencyMs * 0.7) : "—"}
          icon={Gauge}
          isLoading={isLoading}
        />
        <StatCard
          label={tAnalytics("p95Latency")}
          value={usage ? formatLatency(usage.avgLatencyMs * 1.8) : "—"}
          icon={Gauge}
          isLoading={isLoading}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard title={tAnalytics("performanceMetrics")} description="Success vs errors (30 days)">
          {qualityData.length > 0 ? (
            <SimpleLineChart data={qualityData} dataKey={["success", "errors"]} xKey="date" height={300} />
          ) : (
            <Skeleton className="h-[300px] w-full" />
          )}
        </ChartCard>
        <ChartCard title={tAnalytics("latencyDistribution")} description="Response time buckets">
          <BarsChart data={latencyData} dataKey="value" xKey="name" height={300} color="var(--chart-4)" />
        </ChartCard>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard title={tAnalytics("errorBreakdown")} description="By error type">
          <DonutChart data={errorData} height={300} colors={["var(--destructive)", "var(--warning)", "var(--chart-5)", "var(--info)"]} />
        </ChartCard>
        <ChartCard title={tAnalytics("costAnalysis")} description="Daily cost trend">
          {usage ? (
            <TrendChart data={usage.dailyTrend} dataKey="cost" xKey="date" height={300} colors={["var(--chart-3)"]} />
          ) : (
            <Skeleton className="h-[300px] w-full" />
          )}
        </ChartCard>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">{tAnalytics("qualityMetrics")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            {[
              { label: "Avg tokens / request", value: usage ? Math.round(usage.totalTokens / usage.totalRequests).toLocaleString() : "—" },
              { label: "Avg cost / request", value: usage ? `$${(usage.totalCost / usage.totalRequests * 1000).toFixed(2)}/1K` : "—" },
              { label: "Error rate", value: usage ? formatPercent(usage.errorRate, 2) : "—" },
            ].map((m) => (
              <div key={m.label} className="rounded-lg border bg-muted/30 p-4">
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                  <p className="text-xs text-muted-foreground">{m.label}</p>
                </div>
                <p className="mt-2 text-2xl font-bold">{m.value}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
