"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { UserCog, Plus, Shield, Trash2, Users, Lock } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { EmptyState } from "@/components/dashboard/empty-state";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useRoles, useCreateRole, useDeleteRole } from "@/lib/hooks/queries";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const colorMap: Record<string, string> = {
  violet: "bg-violet-500",
  emerald: "bg-emerald-500",
  amber: "bg-amber-500",
  cyan: "bg-cyan-500",
  rose: "bg-rose-500",
  muted: "bg-muted-foreground",
};

export default function RolesPage() {
  const t = useTranslations();
  const tRoles = useTranslations("roles");
  const { data: roles, isLoading } = useRoles();
  const createRole = useCreateRole();
  const deleteRole = useDeleteRole();
  const [createOpen, setCreateOpen] = useState(false);

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    await createRole.mutateAsync({
      name: formData.get("name") as string,
      description: formData.get("description") as string,
      permissions: ["models:read", "playground:use"],
    });
    toast.success("Role created");
    setCreateOpen(false);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={tRoles("title")}
        description={tRoles("subtitle")}
        actions={
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            {tRoles("createRole")}
          </Button>
        }
      />

      {roles && roles.length === 0 && !isLoading ? (
        <EmptyState
          icon={UserCog}
          title={tRoles("noRoles")}
          description={tRoles("createFirstRole")}
          action={<Button onClick={() => setCreateOpen(true)}>{tRoles("createRole")}</Button>}
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {roles?.map((role) => (
            <Card key={role.id} className="overflow-hidden transition-all hover:shadow-md">
              <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-3">
                <div className="flex items-center gap-3">
                  <div className={cn("flex h-10 w-10 items-center justify-center rounded-lg text-white", colorMap[role.color ?? "violet"])}>
                    {role.isSystem ? <Lock className="h-4 w-4" /> : <Shield className="h-4 w-4" />}
                  </div>
                  <div>
                    <CardTitle className="text-base">{role.name}</CardTitle>
                    <p className="text-xs text-muted-foreground">
                      {role.isSystem ? tRoles("systemRole") : tRoles("customRole")}
                    </p>
                  </div>
                </div>
                <Badge variant="outline" className="text-[10px]">
                  <Users className="mr-1 h-2.5 w-2.5" />
                  {role.memberCount}
                </Badge>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-xs text-muted-foreground">{role.description}</p>
                <div>
                  <p className="mb-1.5 text-[10px] font-semibold uppercase text-muted-foreground">{tRoles("permissions")}</p>
                  <div className="flex flex-wrap gap-1">
                    {role.permissions.slice(0, 4).map((p) => (
                      <Badge key={p} variant="secondary" className="text-[10px] font-mono">
                        {p}
                      </Badge>
                    ))}
                    {role.permissions.length > 4 && (
                      <Badge variant="outline" className="text-[10px]">
                        +{role.permissions.length - 4}
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="flex justify-end gap-1 pt-2">
                  <Button variant="ghost" size="sm">Edit</Button>
                  {!role.isSystem && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive"
                      onClick={() => {
                        deleteRole.mutate(role.id, { onSuccess: () => toast.success("Role deleted") });
                      }}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{tRoles("createRole")}</DialogTitle>
            <DialogDescription>Define a new custom role with specific permissions.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">{tRoles("roleName")}</Label>
              <Input id="name" name="name" placeholder="QA Engineer" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">{tRoles("description")}</Label>
              <Textarea id="description" name="description" placeholder="Describe the role's responsibilities..." rows={3} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>
                {t("common.cancel")}
              </Button>
              <Button type="submit" disabled={createRole.isPending}>
                {createRole.isPending ? "Creating..." : tRoles("createRole")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
