"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { type ColumnDef } from "@tanstack/react-table";
import { Download, Search, Filter } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { DataTable } from "@/components/dashboard/data-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuditLogs } from "@/lib/hooks/queries";
import { getInitials } from "@/lib/format";
import { formatDistanceToNow } from "date-fns";
import type { AuditLog } from "@/types";
import { cn } from "@/lib/utils";

const actionColors: Record<string, string> = {
  success: "text-success",
  failure: "text-destructive",
};

export default function AuditLogsPage() {
  const t = useTranslations();
  const tAudit = useTranslations("auditLogs");
  const [action, setAction] = useState("all");
  const [search, setSearch] = useState("");

  const { data, isLoading } = useAuditLogs({ pageSize: 25 });

  const filtered = data?.data.filter(
    (l) =>
      (action === "all" || l.action.includes(action)) &&
      (l.actorName.toLowerCase().includes(search.toLowerCase()) ||
        l.action.toLowerCase().includes(search.toLowerCase()) ||
        l.resourceName.toLowerCase().includes(search.toLowerCase()))
  );

  const columns: ColumnDef<AuditLog>[] = [
    {
      accessorKey: "timestamp",
      header: tAudit("timestamp"),
      cell: ({ row }) => (
        <span className="font-mono text-xs text-muted-foreground">
          {new Date(row.original.timestamp).toLocaleString()}
        </span>
      ),
    },
    {
      accessorKey: "actor",
      header: tAudit("actor"),
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Avatar className="h-6 w-6">
            <AvatarFallback className="bg-muted text-[9px]">{getInitials(row.original.actorName)}</AvatarFallback>
          </Avatar>
          <div>
            <p className="text-xs font-medium">{row.original.actorName}</p>
            <p className="text-[10px] text-muted-foreground">{row.original.actorEmail}</p>
          </div>
        </div>
      ),
    },
    {
      accessorKey: "action",
      header: tAudit("action"),
      cell: ({ row }) => (
        <Badge variant="outline" className="font-mono text-[10px]">
          {row.original.action}
        </Badge>
      ),
    },
    {
      accessorKey: "resource",
      header: tAudit("resource"),
      cell: ({ row }) => (
        <div>
          <p className="text-xs font-medium capitalize">{row.original.resource}</p>
          <p className="text-[10px] text-muted-foreground">{row.original.resourceName}</p>
        </div>
      ),
    },
    {
      accessorKey: "ipAddress",
      header: tAudit("ipAddress"),
      cell: ({ row }) => <span className="font-mono text-xs text-muted-foreground">{row.original.ipAddress}</span>,
    },
    {
      accessorKey: "status",
      header: tAudit("status"),
      cell: ({ row }) => (
        <span className={cn("text-xs font-medium capitalize", actionColors[row.original.status])}>
          {row.original.status}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title={tAudit("title")}
        description={tAudit("subtitle")}
        actions={
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            {tAudit("exportAudit")}
          </Button>
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
        <Select value={action} onValueChange={setAction}>
          <SelectTrigger className="sm:w-48">
            <SelectValue placeholder={tAudit("action")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("common.all")}</SelectItem>
            <SelectItem value="provider">Provider actions</SelectItem>
            <SelectItem value="api-key">API Key actions</SelectItem>
            <SelectItem value="user">User actions</SelectItem>
            <SelectItem value="role">Role actions</SelectItem>
            <SelectItem value="billing">Billing actions</SelectItem>
            <SelectItem value="login">Login events</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="ghost" size="sm">
          <Filter className="mr-1 h-3.5 w-3.5" />
          {t("logs.clearFilters")}
        </Button>
      </div>

      <DataTable columns={columns} data={filtered ?? []} isLoading={isLoading} />

      {data && (
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>
            Showing {data.data.length} of {data.pagination.total} entries
          </span>
          <span>{formatDistanceToNow(new Date(), { addSuffix: true })}</span>
        </div>
      )}
    </div>
  );
}
