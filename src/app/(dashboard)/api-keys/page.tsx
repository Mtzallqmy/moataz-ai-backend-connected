"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { type ColumnDef } from "@tanstack/react-table";
import { KeyRound, Plus, MoreHorizontal, Copy, RotateCw, Trash2, CheckCircle2, AlertTriangle } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { DataTable } from "@/components/dashboard/data-table";
import { EmptyState } from "@/components/dashboard/empty-state";
import { StatusBadge } from "@/components/dashboard/status-badges";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { useApiKeys, useCreateApiKey, useRotateApiKey, useRevokeApiKey } from "@/lib/hooks/queries";
import { formatDistanceToNow } from "date-fns";
import type { ApiKey } from "@/types";
import { toast } from "sonner";
import { formatCompact } from "@/lib/format";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";

const allScopes = ["chat", "completions", "embeddings", "vision", "function-calling"];

export default function ApiKeysPage() {
  const t = useTranslations();
  const tKeys = useTranslations("apiKeys");
  const { data: keys, isLoading } = useApiKeys();
  const createKey = useCreateApiKey();
  const rotateKey = useRotateApiKey();
  const revokeKey = useRevokeApiKey();
  const [createOpen, setCreateOpen] = useState(false);
  const [newKey, setNewKey] = useState<string | null>(null);
  const [scopes, setScopes] = useState<string[]>(["chat"]);

  const columns: ColumnDef<ApiKey>[] = [
    {
      accessorKey: "name",
      header: "Name",
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <KeyRound className="h-4 w-4" />
          </div>
          <div>
            <p className="font-medium">{row.original.name}</p>
            <p className="font-mono text-xs text-muted-foreground">{row.original.maskedKey}</p>
          </div>
        </div>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
    },
    {
      accessorKey: "scopes",
      header: "Scopes",
      cell: ({ row }) => (
        <div className="flex flex-wrap gap-1">
          {row.original.scopes.map((s) => (
            <Badge key={s} variant="outline" className="text-[10px]">
              {s}
            </Badge>
          ))}
        </div>
      ),
    },
    {
      accessorKey: "usageCount",
      header: "Usage",
      cell: ({ row }) => {
        const k = row.original;
        const pct = k.usageLimit ? (k.usageCount / k.usageLimit) * 100 : 0;
        return (
          <div className="space-y-1">
            <p className="text-xs font-mono">
              {formatCompact(k.usageCount)}
              {k.usageLimit && ` / ${formatCompact(k.usageLimit)}`}
            </p>
            {k.usageLimit && (
              <div className="h-1 w-20 overflow-hidden rounded-full bg-muted">
                <div
                  className={`h-full ${pct > 80 ? "bg-destructive" : pct > 50 ? "bg-warning" : "bg-success"}`}
                  style={{ width: `${Math.min(pct, 100)}%` }}
                />
              </div>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "lastUsedAt",
      header: "Last used",
      cell: ({ row }) =>
        row.original.lastUsedAt ? (
          <span className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(row.original.lastUsedAt), { addSuffix: true })}
          </span>
        ) : (
          <span className="text-xs text-muted-foreground">Never</span>
        ),
    },
    {
      accessorKey: "createdBy",
      header: "Created by",
      cell: ({ row }) => <span className="text-xs">{row.original.createdBy}</span>,
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
            <DropdownMenuItem
              onClick={() => {
                navigator.clipboard.writeText(row.original.maskedKey);
                toast.success(t("common.copied"));
              }}
            >
              <Copy className="mr-2 h-4 w-4" />
              {tKeys("copyKey")}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => {
                rotateKey.mutate(row.original.id, {
                  onSuccess: () => {
                    toast.success("Key rotated", { description: "Update your integrations with the new key." });
                  },
                });
              }}
            >
              <RotateCw className="mr-2 h-4 w-4" />
              {tKeys("rotateKey")}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={() => {
                revokeKey.mutate(row.original.id, {
                  onSuccess: () => toast.success("Key revoked"),
                });
              }}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              {tKeys("revoke")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const name = formData.get("name") as string;
    const result = await createKey.mutateAsync({
      name,
      scopes,
      usageLimit: formData.get("limit") ? Number(formData.get("limit")) : undefined,
    });
    setNewKey(result.newKey ?? result.key ?? result.maskedKey);
    toast.success(tKeys("keyCreated"));
    setCreateOpen(false);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={tKeys("title")}
        description={tKeys("subtitle")}
        actions={
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            {tKeys("createKey")}
          </Button>
        }
      />

      {keys && keys.length === 0 && !isLoading ? (
        <EmptyState
          icon={KeyRound}
          title={tKeys("noKeys")}
          description={tKeys("noKeysDescription")}
          action={
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              {tKeys("createKey")}
            </Button>
          }
        />
      ) : (
        <DataTable columns={columns} data={keys ?? []} isLoading={isLoading} />
      )}

      {/* Create dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{tKeys("createKey")}</DialogTitle>
            <DialogDescription>Create a new API key for accessing the gateway.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">{tKeys("keyName")}</Label>
              <Input id="name" name="name" placeholder="Production - Web App" required />
            </div>
            <div className="space-y-2">
              <Label>{tKeys("scopes")}</Label>
              <div className="flex flex-wrap gap-3">
                {allScopes.map((s) => (
                  <div key={s} className="flex items-center gap-1.5">
                    <Checkbox
                      id={`scope-${s}`}
                      checked={scopes.includes(s)}
                      onCheckedChange={(v) => {
                        if (v) setScopes([...scopes, s]);
                        else setScopes(scopes.filter((x) => x !== s));
                      }}
                    />
                    <Label htmlFor={`scope-${s}`} className="cursor-pointer text-sm">
                      {s}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="limit">
                {tKeys("usageLimit")} <span className="text-xs text-muted-foreground">(optional)</span>
              </Label>
              <Input id="limit" name="limit" type="number" placeholder="1000000" />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>
                {t("common.cancel")}
              </Button>
              <Button type="submit" disabled={createKey.isPending}>
                {createKey.isPending ? "Creating..." : tKeys("createKey")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* New key dialog */}
      <Dialog open={!!newKey} onOpenChange={(open) => !open && setNewKey(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-success" />
              {tKeys("keyCreated")}
            </DialogTitle>
            <DialogDescription>{tKeys("keyCreatedWarning")}</DialogDescription>
          </DialogHeader>
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>{tKeys("warning")}</AlertTitle>
            <AlertDescription>
              You will not be able to see this key again. Copy it now and store it securely.
            </AlertDescription>
          </Alert>
          <div className="rounded-md border bg-muted/30 p-3">
            <code className="block break-all font-mono text-xs">{newKey}</code>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                if (newKey) navigator.clipboard.writeText(newKey);
                toast.success(t("common.copied"));
              }}
            >
              <Copy className="mr-2 h-4 w-4" />
              {tKeys("copyKey")}
            </Button>
            <Button onClick={() => setNewKey(null)}>{t("common.close")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
