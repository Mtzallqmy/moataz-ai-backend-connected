"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Activity, DollarSign, Cpu, Zap, Download } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { ChartCard, TrendChart, BarsChart, DonutChart } from "@/components/charts/charts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useUsageSummary } from "@/lib/hooks/queries";
import { formatCompact, formatCurrency, formatLatency, formatNumber } from "@/lib/format";
import { Skeleton } from "@/components/ui/skeleton";

export default function UsagePage() {
  const t = useTranslations();
  const tUsage = useTranslations("usage");
  const [range, setRange] = useState("30d");

  const { data: usage, isLoading } = useUsageSummary(range);

  return (
    <div className="space-y-6">
      <PageHeader
        title={tUsage("title")}
        description={tUsage("subtitle")}
        actions={
          <div className="flex items-center gap-2">
            <Select value={range} onValueChange={setRange}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">{tUsage("last7Days")}</SelectItem>
                <SelectItem value="30d">{tUsage("last30Days")}</SelectItem>
                <SelectItem value="90d">{tUsage("last90Days")}</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline">
              <Download className="mr-2 h-4 w-4" />
              {tUsage("exportReport")}
            </Button>
          </div>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label={tUsage("requestsMade")}
          value={usage ? formatCompact(usage.totalRequests) : "—"}
          icon={Activity}
          changePct={usage?.changePct.requests}
          trend="up"
          isLoading={isLoading}
        />
        <StatCard
          label={tUsage("tokensUsed")}
          value={usage ? formatCompact(usage.totalTokens) : "—"}
          icon={Cpu}
          changePct={usage?.changePct.tokens}
          trend="up"
          isLoading={isLoading}
        />
        <StatCard
          label={tUsage("costIncurred")}
          value={usage ? formatCurrency(usage.totalCost) : "—"}
          icon={DollarSign}
          changePct={usage?.changePct.cost}
          trend="up"
          isLoading={isLoading}
        />
        <StatCard
          label={t("dashboard.avgLatency")}
          value={usage ? formatLatency(usage.avgLatencyMs) : "—"}
          icon={Zap}
          changePct={usage?.changePct.latency}
          trend="down"
          isLoading={isLoading}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <ChartCard title={tUsage("byProvider")} description="Request volume" className="lg:col-span-2">
          {usage ? (
            <TrendChart data={usage.dailyTrend} dataKey="requests" xKey="date" height={300} />
          ) : (
            <Skeleton className="h-[300px] w-full" />
          )}
        </ChartCard>
        <ChartCard title="Cost split" description="By provider">
          {usage ? (
            <DonutChart
              data={usage.topProviders.map((p) => ({ name: p.providerName, value: p.cost }))}
              height={300}
            />
          ) : (
            <Skeleton className="h-[300px] w-full" />
          )}
        </ChartCard>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard title={tUsage("byModel")} description="Token consumption">
          {usage ? (
            <BarsChart
              data={usage.topModels.map((m) => ({ name: m.modelName, tokens: m.tokenCount }))}
              dataKey="tokens"
              xKey="name"
              height={260}
              color="var(--chart-2)"
            />
          ) : (
            <Skeleton className="h-[260px] w-full" />
          )}
        </ChartCard>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">{tUsage("byProvider")}</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Provider</TableHead>
                  <TableHead className="text-xs text-right">Requests</TableHead>
                  <TableHead className="text-xs text-right">Cost</TableHead>
                  <TableHead className="text-xs text-right">%</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {usage?.topProviders.map((p) => (
                  <TableRow key={p.providerId}>
                    <TableCell className="text-sm font-medium">{p.providerName}</TableCell>
                    <TableCell className="text-right font-mono text-xs">{formatNumber(p.requestCount)}</TableCell>
                    <TableCell className="text-right font-mono text-xs">{formatCurrency(p.cost)}</TableCell>
                    <TableCell className="text-right text-xs">{p.pct.toFixed(1)}%</TableCell>
                  </TableRow>
                )) ?? (
                  <TableRow>
                    <TableCell colSpan={4}>
                      <Skeleton className="h-8 w-full" />
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
