"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { type ColumnDef } from "@tanstack/react-table";
import { Search, Pause, Play, Download, Filter } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { DataTable } from "@/components/dashboard/data-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useLogs, useProviders } from "@/lib/hooks/queries";
import { formatDistanceToNow } from "date-fns";
import type { LogEntry } from "@/types";
import { cn } from "@/lib/utils";

const levelColors: Record<LogEntry["level"], string> = {
  debug: "bg-muted text-muted-foreground",
  info: "bg-info/10 text-info",
  warn: "bg-warning/10 text-warning",
  error: "bg-destructive/10 text-destructive",
  fatal: "bg-destructive text-destructive-foreground",
};

const statusColors: Record<string, string> = {
  "2": "text-success",
  "3": "text-info",
  "4": "text-warning",
  "5": "text-destructive",
};

export default function LogsPage() {
  const t = useTranslations();
  const tLogs = useTranslations("logs");
  const [level, setLevel] = useState<string>("all");
  const [providerId, setProviderId] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [live, setLive] = useState(true);

  const { data, isLoading } = useLogs({
    level: level === "all" ? undefined : level,
    providerId: providerId === "all" ? undefined : providerId,
    pageSize: 50,
  });
  const { data: providers } = useProviders();

  const filtered = data?.data.filter((l) =>
    l.message.toLowerCase().includes(search.toLowerCase()) ||
    l.path.toLowerCase().includes(search.toLowerCase())
  );

  const columns: ColumnDef<LogEntry>[] = [
    {
      accessorKey: "timestamp",
      header: tLogs("timestamp"),
      cell: ({ row }) => (
        <span className="font-mono text-xs text-muted-foreground">
          {new Date(row.original.timestamp).toLocaleTimeString()}
        </span>
      ),
    },
    {
      accessorKey: "level",
      header: tLogs("level"),
      cell: ({ row }) => (
        <Badge variant="outline" className={cn("text-[10px] uppercase", levelColors[row.original.level])}>
          {row.original.level}
        </Badge>
      ),
    },
    {
      accessorKey: "providerName",
      header: tLogs("provider"),
      cell: ({ row }) => <span className="text-xs">{row.original.providerName}</span>,
    },
    {
      accessorKey: "modelName",
      header: tLogs("model"),
      cell: ({ row }) => <span className="font-mono text-xs">{row.original.modelName}</span>,
    },
    {
      accessorKey: "method",
      header: tLogs("method"),
      cell: ({ row }) => (
        <Badge variant="secondary" className="text-[10px] font-mono">
          {row.original.method}
        </Badge>
      ),
    },
    {
      accessorKey: "statusCode",
      header: tLogs("status"),
      cell: ({ row }) => (
        <span className={cn("font-mono text-xs font-semibold", statusColors[String(row.original.statusCode)[0]])}>
          {row.original.statusCode}
        </span>
      ),
    },
    {
      accessorKey: "durationMs",
      header: tLogs("duration"),
      cell: ({ row }) => <span className="font-mono text-xs">{row.original.durationMs}ms</span>,
    },
    {
      accessorKey: "tokenCount",
      header: tLogs("tokens"),
      cell: ({ row }) =>
        row.original.tokenCount ? (
          <span className="font-mono text-xs">{row.original.tokenCount}</span>
        ) : (
          <span className="text-xs text-muted-foreground">—</span>
        ),
    },
    {
      accessorKey: "message",
      header: tLogs("message"),
      cell: ({ row }) => (
        <span className="block max-w-md truncate text-xs text-muted-foreground" title={row.original.message}>
          {row.original.message}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title={tLogs("title")}
        description={tLogs("subtitle")}
        actions={
          <div className="flex items-center gap-2">
            <Button variant={live ? "default" : "outline"} size="sm" onClick={() => setLive(!live)}>
              {live ? <Pause className="mr-1.5 h-3.5 w-3.5" /> : <Play className="mr-1.5 h-3.5 w-3.5" />}
              {live ? tLogs("live") : tLogs("paused")}
            </Button>
            <Button variant="outline" size="sm">
              <Download className="mr-2 h-3.5 w-3.5" />
              {tLogs("exportLogs")}
            </Button>
          </div>
        }
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={t("common.search")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={level} onValueChange={setLevel}>
          <SelectTrigger className="sm:w-36">
            <SelectValue placeholder={tLogs("level")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("common.all")}</SelectItem>
            <SelectItem value="debug">Debug</SelectItem>
            <SelectItem value="info">Info</SelectItem>
            <SelectItem value="warn">Warning</SelectItem>
            <SelectItem value="error">Error</SelectItem>
            <SelectItem value="fatal">Fatal</SelectItem>
          </SelectContent>
        </Select>
        <Select value={providerId} onValueChange={setProviderId}>
          <SelectTrigger className="sm:w-40">
            <SelectValue placeholder={tLogs("provider")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("common.all")}</SelectItem>
            {providers?.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button variant="ghost" size="sm">
          <Filter className="mr-1 h-3.5 w-3.5" />
          {tLogs("clearFilters")}
        </Button>
      </div>

      <DataTable columns={columns} data={filtered ?? []} isLoading={isLoading} />

      {data && (
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>
            Showing {data.data.length} of {data.pagination.total} logs
          </span>
          <span>Last updated {formatDistanceToNow(new Date(), { addSuffix: true })}</span>
        </div>
      )}
    </div>
  );
}
