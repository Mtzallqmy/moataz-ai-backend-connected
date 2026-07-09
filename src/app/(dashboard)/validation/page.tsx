"use client";

import { useTranslations } from "next-intl";
import { ShieldCheck, Play, CheckCircle2, XCircle, AlertCircle, Loader2 } from "lucide-react";
import { type ColumnDef } from "@tanstack/react-table";
import { PageHeader } from "@/components/dashboard/page-header";
import { DataTable } from "@/components/dashboard/data-table";
import { StatCard } from "@/components/dashboard/stat-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useValidation, useRunValidation, useProviders, useModels } from "@/lib/hooks/queries";
import { formatDistanceToNow } from "date-fns";
import type { ValidationResult } from "@/types";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const statusConfig: Record<ValidationResult["status"], { icon: typeof CheckCircle2; color: string; label: string }> = {
  pass: { icon: CheckCircle2, color: "text-success bg-success/10 border-success/30", label: "Pass" },
  fail: { icon: XCircle, color: "text-destructive bg-destructive/10 border-destructive/30", label: "Fail" },
  skipped: { icon: AlertCircle, color: "text-muted-foreground bg-muted border-border", label: "Skipped" },
  running: { icon: Loader2, color: "text-info bg-info/10 border-info/30", label: "Running" },
};

export default function ValidationPage() {
  const t = useTranslations();
  const tValidation = useTranslations("validation");
  const { data: results, isLoading } = useValidation();
  const runValidation = useRunValidation();
  const { data: providers } = useProviders();
  const { data: models } = useModels();

  const passed = results?.filter((r) => r.status === "pass").length ?? 0;
  const failed = results?.filter((r) => r.status === "fail").length ?? 0;
  const total = results?.length ?? 0;
  const passRate = total > 0 ? (passed / total) * 100 : 0;

  const columns: ColumnDef<ValidationResult>[] = [
    {
      accessorKey: "testName",
      header: tValidation("testName"),
      cell: ({ row }) => (
        <div>
          <p className="font-medium">{row.original.testName}</p>
          <p className="text-xs text-muted-foreground">{row.original.category}</p>
        </div>
      ),
    },
    {
      accessorKey: "providerName",
      header: tValidation("category"),
      cell: ({ row }) => (
        <div>
          <p className="text-sm">{row.original.providerName}</p>
          <p className="text-xs font-mono text-muted-foreground">{row.original.modelName}</p>
        </div>
      ),
    },
    {
      accessorKey: "status",
      header: tValidation("status"),
      cell: ({ row }) => {
        const cfg = statusConfig[row.original.status];
        const Icon = cfg.icon;
        return (
          <Badge variant="outline" className={cn("text-xs", cfg.color)}>
            <Icon className={cn("mr-1 h-3 w-3", row.original.status === "running" && "animate-spin")} />
            {cfg.label}
          </Badge>
        );
      },
    },
    {
      accessorKey: "score",
      header: tValidation("score"),
      cell: ({ row }) =>
        row.original.score !== undefined ? (
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-semibold">{row.original.score.toFixed(1)}</span>
            <div className="h-1.5 w-16 overflow-hidden rounded-full bg-muted">
              <div
                className={cn(
                  "h-full",
                  row.original.score >= 90 ? "bg-success" : row.original.score >= 70 ? "bg-warning" : "bg-destructive"
                )}
                style={{ width: `${row.original.score}%` }}
              />
            </div>
          </div>
        ) : (
          <span className="text-xs text-muted-foreground">—</span>
        ),
    },
    {
      accessorKey: "durationMs",
      header: tValidation("duration"),
      cell: ({ row }) => <span className="font-mono text-xs">{row.original.durationMs}ms</span>,
    },
    {
      accessorKey: "message",
      header: "Message",
      cell: ({ row }) => (
        <span className="block max-w-xs truncate text-xs text-muted-foreground" title={row.original.message}>
          {row.original.message}
        </span>
      ),
    },
    {
      accessorKey: "checkedAt",
      header: tValidation("lastRun"),
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground">
          {formatDistanceToNow(new Date(row.original.checkedAt), { addSuffix: true })}
        </span>
      ),
    },
  ];

  const handleRunAll = () => {
    if (!providers?.length || !models?.length) return;
    const provider = providers[0];
    const model = models[0];
    runValidation.mutate(
      { providerId: provider.id, modelId: model.id },
      {
        onSuccess: () => toast.success("Validation started", { description: "Tests are running in the background." }),
        onError: () => toast.error("Failed to start validation"),
      }
    );
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={tValidation("title")}
        description={tValidation("subtitle")}
        actions={
          <Button onClick={handleRunAll} disabled={runValidation.isPending}>
            {runValidation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Play className="mr-2 h-4 w-4" />}
            {tValidation("runTests")}
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total tests"
          value={total}
          icon={ShieldCheck}
          isLoading={isLoading}
        />
        <StatCard
          label={tValidation("passRate")}
          value={`${passRate.toFixed(1)}%`}
          icon={CheckCircle2}
          iconClassName="bg-success/10 text-success"
          isLoading={isLoading}
        />
        <StatCard
          label="Passed"
          value={passed}
          icon={CheckCircle2}
          iconClassName="bg-success/10 text-success"
          isLoading={isLoading}
        />
        <StatCard
          label="Failed"
          value={failed}
          icon={XCircle}
          iconClassName="bg-destructive/10 text-destructive"
          isLoading={isLoading}
        />
      </div>

      <DataTable columns={columns} data={results ?? []} isLoading={isLoading} />
    </div>
  );
}
