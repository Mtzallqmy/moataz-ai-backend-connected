"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { type ColumnDef } from "@tanstack/react-table";
import { Plus, Search, MoreHorizontal, Server, Activity, Zap, KeyRound } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { DataTable } from "@/components/dashboard/data-table";
import { StatusBadge } from "@/components/dashboard/status-badges";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { useProviders, useCreateProvider, useTestProviderConnection } from "@/lib/hooks/queries";
import { formatCompact, formatLatency, formatPercent } from "@/lib/format";
import type { Provider } from "@/types";
import { toast } from "sonner";
import { EmptyState } from "@/components/dashboard/empty-state";

export default function ProvidersPage() {
  const t = useTranslations();
  const tProviders = useTranslations("providers");
  const { data: providers, isLoading } = useProviders();
  const createProvider = useCreateProvider();
  const testConnection = useTestProviderConnection();
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);

  const filtered = providers?.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.description ?? "").toLowerCase().includes(search.toLowerCase())
  );

  const columns: ColumnDef<Provider>[] = [
    {
      accessorKey: "name",
      header: "Provider",
      cell: ({ row }) => {
        const p = row.original;
        return (
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Server className="h-4 w-4" />
            </div>
            <div>
              <p className="font-medium">{p.name}</p>
              <p className="text-xs text-muted-foreground">{p.region}</p>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
    },
    {
      accessorKey: "supportedFeatures",
      header: "Features",
      cell: ({ row }) => (
        <div className="flex flex-wrap gap-1">
          {row.original.supportedFeatures.slice(0, 3).map((f) => (
            <Badge key={f} variant="outline" className="text-[10px]">
              {f}
            </Badge>
          ))}
          {row.original.supportedFeatures.length > 3 && (
            <Badge variant="outline" className="text-[10px]">
              +{row.original.supportedFeatures.length - 3}
            </Badge>
          )}
        </div>
      ),
    },
    {
      accessorKey: "requestCount",
      header: "Requests",
      cell: ({ row }) => <span className="font-mono text-xs">{formatCompact(row.original.requestCount)}</span>,
    },
    {
      accessorKey: "latencyMs",
      header: "Latency",
      cell: ({ row }) => (
        <span className="inline-flex items-center gap-1 text-xs">
          <Activity className="h-3 w-3 text-muted-foreground" />
          {formatLatency(row.original.latencyMs)}
        </span>
      ),
    },
    {
      accessorKey: "uptimePct",
      header: "Uptime",
      cell: ({ row }) => (
        <span className={row.original.uptimePct >= 99.9 ? "text-success" : "text-warning"}>
          {formatPercent(row.original.uptimePct, 2)}
        </span>
      ),
    },
    {
      accessorKey: "errorRate",
      header: "Errors",
      cell: ({ row }) => (
        <span className={row.original.errorRate > 0.3 ? "text-destructive" : "text-muted-foreground"}>
          {formatPercent(row.original.errorRate)}
        </span>
      ),
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => testConnection.mutate(row.original.id, {
              onSuccess: (res) => toast.success(`Connection ${res.success ? "successful" : "failed"}`, { description: `Latency: ${formatLatency(res.latencyMs)}` }),
              onError: () => toast.error("Connection failed"),
            })}>
              <Zap className="mr-2 h-4 w-4" />
              {tProviders("testConnection")}
            </DropdownMenuItem>
            <DropdownMenuItem>{tProviders("configure")}</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive focus:text-destructive">
              {t("common.delete")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    await createProvider.mutateAsync({
      name: formData.get("name") as string,
      type: formData.get("type") as string,
      description: formData.get("description") as string,
      baseUrl: formData.get("baseUrl") as string,
      region: formData.get("region") as string,
      apiKey: formData.get("apiKey") as string,
      defaultModel: formData.get("defaultModel") as string,
    });
    toast.success("Provider added", { description: "Configuration pending verification." });
    setDialogOpen(false);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={tProviders("title")}
        description={tProviders("subtitle")}
        actions={
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                {tProviders("addProvider")}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{tProviders("addProvider")}</DialogTitle>
                <DialogDescription>Add a provider API base URL and API key. The key will be encrypted server-side and never shown again.</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreate} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Provider name</Label>
                  <Input id="name" name="name" placeholder="OpenAI" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="type">Provider type</Label>
                  <select
                    id="type"
                    name="type"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    defaultValue="openai"
                  >
                    <option value="openai">OpenAI</option>
                    <option value="openrouter">OpenRouter</option>
                    <option value="anthropic">Anthropic Claude</option>
                    <option value="google">Google Gemini</option>
                    <option value="mistral">Mistral</option>
                    <option value="groq">Groq</option>
                    <option value="deepseek">DeepSeek</option>
                    <option value="together">Together AI</option>
                    <option value="xai">xAI</option>
                    <option value="cohere">Cohere</option>
                    <option value="custom">Custom OpenAI-compatible</option>
                  </select>
                  <p className="text-xs text-muted-foreground">The backend will use the correct adapter and default base URL for this provider.</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Input id="description" name="description" placeholder="GPT-4 and other models" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="baseUrl">Base URL</Label>
                  <Input id="baseUrl" name="baseUrl" placeholder="https://api.openai.com/v1 (optional for known providers)" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="apiKey" className="flex items-center gap-2"><KeyRound className="h-3.5 w-3.5" /> Provider API key</Label>
                  <Input id="apiKey" name="apiKey" type="password" placeholder="sk-... / gsk_... / openrouter..." />
                  <p className="text-xs text-muted-foreground">Optional now, required for real Playground responses.</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="defaultModel">Default model</Label>
                  <Input id="defaultModel" name="defaultModel" placeholder="gpt-4o-mini" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="region">Region</Label>
                  <Input id="region" name="region" placeholder="global" />
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                    {t("common.cancel")}
                  </Button>
                  <Button type="submit" disabled={createProvider.isPending}>
                    {createProvider.isPending ? "Adding..." : tProviders("addProvider")}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        }
      />

      <Card>
        <CardContent className="p-4">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={t("common.search")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </CardContent>
      </Card>

      {filtered && filtered.length === 0 && !isLoading ? (
        <EmptyState
          icon={Server}
          title={tProviders("noProviders")}
          description={tProviders("noProvidersDescription")}
          action={
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              {tProviders("addFirstProvider")}
            </Button>
          }
        />
      ) : (
        <DataTable columns={columns} data={filtered ?? []} isLoading={isLoading} />
      )}
    </div>
  );
}
