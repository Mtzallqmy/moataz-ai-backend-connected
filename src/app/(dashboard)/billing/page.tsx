"use client";

import { useTranslations } from "next-intl";
import { Download, Check, Plus, TrendingUp } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useBillingPlans, useInvoices, usePaymentMethods, useCurrentUsage } from "@/lib/hooks/queries";
import { formatCurrency, formatCompact } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

const invoiceStatusColors: Record<string, string> = {
  paid: "bg-success/10 text-success border-success/30",
  pending: "bg-warning/10 text-warning border-warning/30",
  overdue: "bg-destructive/10 text-destructive border-destructive/30",
  draft: "bg-muted text-muted-foreground border-border",
};

export default function BillingPage() {
  const t = useTranslations();
  const tBilling = useTranslations("billing");
  const { data: plans, isLoading: plansLoading } = useBillingPlans();
  const { data: invoices } = useInvoices();
  const { data: paymentMethods } = usePaymentMethods();
  const { data: currentUsage, isLoading: usageLoading } = useCurrentUsage();

  const currentPlan = plans?.find((p) => p.isCurrent);
  const requestsPct = currentUsage ? Math.min(100, (Number(currentUsage.totalRequests) / 10000000) * 100) : 0;
  const tokensPct = currentUsage ? Math.min(100, (Number(currentUsage.totalTokens) / 5000000000) * 100) : 0;

  return (
    <div className="space-y-6">
      <PageHeader title={tBilling("title")} description={tBilling("subtitle")} />

      {/* Current plan + usage */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">{tBilling("currentPlan")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {plansLoading ? (
              <Skeleton className="h-24" />
            ) : currentPlan ? (
              <>
                <div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-bold">{formatCurrency(currentPlan.price)}</span>
                    <span className="text-sm text-muted-foreground">{tBilling(currentPlan.interval === "month" ? "perMonth" : "perYear")}</span>
                  </div>
                  <p className="mt-1 text-sm font-medium">{currentPlan.name}</p>
                  <p className="text-xs text-muted-foreground">{currentPlan.description}</p>
                </div>
                <Button className="w-full">
                  <TrendingUp className="mr-2 h-4 w-4" />
                  {tBilling("upgradePlan")}
                </Button>
              </>
            ) : null}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">{tBilling("usageThisMonth")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Requests</span>
                <span className="font-mono text-xs">
                  {currentUsage ? formatCompact(currentUsage.totalRequests) : "—"} / {currentUsage ? formatCompact(10000000) : "—"}
                </span>
              </div>
              <Progress value={requestsPct} className="h-2" />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Tokens</span>
                <span className="font-mono text-xs">
                  {currentUsage ? formatCompact(currentUsage.totalTokens) : "—"} / {currentUsage ? formatCompact(5000000000) : "—"}
                </span>
              </div>
              <Progress value={tokensPct} className="h-2" />
            </div>
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="rounded-md bg-muted/50 p-3">
                <p className="text-xs text-muted-foreground">Cost this month</p>
                <p className="text-lg font-semibold">{currentUsage ? formatCurrency(currentUsage.totalCost) : "—"}</p>
              </div>
              <div className="rounded-md bg-muted/50 p-3">
                <p className="text-xs text-muted-foreground">{tBilling("nextBillingDate")}</p>
                <p className="text-sm font-semibold">Oct 15, 2024</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Plans */}
      <div>
        <h2 className="mb-4 text-lg font-semibold">{tBilling("plans")}</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {plansLoading
            ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-80" />)
            : plans?.map((plan) => (
                <Card
                  key={plan.id}
                  className={cn(
                    "relative overflow-hidden transition-all",
                    plan.isPopular && "border-primary ring-1 ring-primary",
                    plan.isCurrent && "border-success"
                  )}
                >
                  {plan.isPopular && (
                    <div className="absolute right-0 top-0 bg-primary px-2 py-0.5 text-[10px] font-semibold text-primary-foreground">
                      {tBilling("mostPopular")}
                    </div>
                  )}
                  {plan.isCurrent && (
                    <div className="absolute right-0 top-0 bg-success px-2 py-0.5 text-[10px] font-semibold text-success-foreground">
                      {tBilling("currentPlanLabel")}
                    </div>
                  )}
                  <CardContent className="space-y-4 p-5">
                    <div>
                      <h3 className="text-lg font-bold">{plan.name}</h3>
                      <p className="mt-1 text-xs text-muted-foreground">{plan.description}</p>
                    </div>
                    <div>
                      {plan.price === 0 ? (
                        <span className="text-2xl font-bold">Custom</span>
                      ) : (
                        <div className="flex items-baseline gap-1">
                          <span className="text-3xl font-bold">{formatCurrency(plan.price)}</span>
                          <span className="text-xs text-muted-foreground">
                            {tBilling(plan.interval === "month" ? "perMonth" : "perYear")}
                          </span>
                        </div>
                      )}
                    </div>
                    <ul className="space-y-2">
                      {plan.features.map((f) => (
                        <li key={f} className="flex items-start gap-2 text-xs">
                          <Check className="mt-0.5 h-3 w-3 shrink-0 text-success" />
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                    <Button
                      className="w-full"
                      variant={plan.isCurrent ? "outline" : plan.isPopular ? "default" : "outline"}
                      disabled={plan.isCurrent}
                    >
                      {plan.isCurrent
                        ? tBilling("currentPlanLabel")
                        : plan.price === 0
                        ? tBilling("contactSales")
                        : tBilling("choosePlan")}
                    </Button>
                  </CardContent>
                </Card>
              ))}
        </div>
      </div>

      {/* Payment methods */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
          <CardTitle className="text-base font-semibold">{tBilling("paymentMethods")}</CardTitle>
          <Button variant="outline" size="sm">
            <Plus className="mr-2 h-3.5 w-3.5" />
            {tBilling("addPaymentMethod")}
          </Button>
        </CardHeader>
        <CardContent className="space-y-2">
          {paymentMethods?.map((pm) => (
            <div key={pm.id} className="flex items-center justify-between rounded-lg border p-3">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-12 items-center justify-center rounded bg-muted text-[10px] font-bold uppercase">
                  {pm.brand ?? pm.type}
                </div>
                <div>
                  <p className="text-sm font-medium">
                    •••• {pm.last4}
                    {pm.isDefault && (
                      <Badge variant="secondary" className="ml-2 text-[10px]">Default</Badge>
                    )}
                  </p>
                  {pm.expiryMonth && (
                    <p className="text-xs text-muted-foreground">
                      Expires {pm.expiryMonth}/{pm.expiryYear}
                    </p>
                  )}
                </div>
              </div>
              <Button variant="ghost" size="sm">Edit</Button>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Invoices */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">{tBilling("invoices")}</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">{tBilling("invoiceNumber")}</TableHead>
                <TableHead className="text-xs">{tBilling("date")}</TableHead>
                <TableHead className="text-xs">Plan</TableHead>
                <TableHead className="text-xs text-right">{tBilling("amount")}</TableHead>
                <TableHead className="text-xs">{tBilling("status")}</TableHead>
                <TableHead className="text-xs text-right">{tBilling("download")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices?.map((inv) => (
                <TableRow key={inv.id}>
                  <TableCell className="font-mono text-xs">{inv.number}</TableCell>
                  <TableCell className="text-xs">{new Date(inv.date).toLocaleDateString()}</TableCell>
                  <TableCell className="text-xs">{inv.plan} · {inv.period}</TableCell>
                  <TableCell className="text-right font-mono text-xs">{formatCurrency(inv.amount)}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={cn("text-[10px] capitalize", invoiceStatusColors[inv.status])}>
                      {inv.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" className="h-7 w-7">
                      <Download className="h-3.5 w-3.5" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
