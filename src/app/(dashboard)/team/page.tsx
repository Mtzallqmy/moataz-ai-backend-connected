"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { type ColumnDef } from "@tanstack/react-table";
import { UserPlus, MoreHorizontal, Mail, Trash2, Shield } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { DataTable } from "@/components/dashboard/data-table";
import { EmptyState } from "@/components/dashboard/empty-state";
import { StatusBadge } from "@/components/dashboard/status-badges";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTeam, useRoles, useInviteMember, useRemoveMember } from "@/lib/hooks/queries";
import { getInitials } from "@/lib/format";
import { formatDistanceToNow } from "date-fns";
import type { TeamMember } from "@/types";
import { toast } from "sonner";

export default function TeamPage() {
  const t = useTranslations();
  const tTeam = useTranslations("team");
  const { data: team, isLoading } = useTeam();
  const { data: roles } = useRoles();
  const inviteMember = useInviteMember();
  const removeMember = useRemoveMember();
  const [inviteOpen, setInviteOpen] = useState(false);

  const columns: ColumnDef<TeamMember>[] = [
    {
      accessorKey: "name",
      header: tTeam("memberName"),
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9">
            <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
              {getInitials(row.original.name)}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium">{row.original.name}</p>
            <p className="text-xs text-muted-foreground">{row.original.email}</p>
          </div>
        </div>
      ),
    },
    {
      accessorKey: "role",
      header: tTeam("role"),
      cell: ({ row }) => <Badge variant="secondary" className="text-xs">{row.original.role}</Badge>,
    },
    {
      accessorKey: "status",
      header: tTeam("status"),
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
    },
    {
      accessorKey: "lastActiveAt",
      header: tTeam("lastActive"),
      cell: ({ row }) =>
        row.original.lastActiveAt ? (
          <span className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(row.original.lastActiveAt), { addSuffix: true })}
          </span>
        ) : (
          <span className="text-xs text-muted-foreground">Never</span>
        ),
    },
    {
      accessorKey: "permissions",
      header: tTeam("permissions"),
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <Shield className="h-3 w-3 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">
            {row.original.permissions.includes("*") ? "All" : `${row.original.permissions.length} scopes`}
          </span>
        </div>
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
            <DropdownMenuItem>{tTeam("changeRole")}</DropdownMenuItem>
            <DropdownMenuItem>
              <Mail className="mr-2 h-4 w-4" />
              Resend invite
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={() => {
                removeMember.mutate(row.original.id, { onSuccess: () => toast.success("Member removed") });
              }}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              {tTeam("removeMember")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  const handleInvite = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    await inviteMember.mutateAsync({
      email: formData.get("email") as string,
      roleId: formData.get("roleId") as string,
      name: (formData.get("name") as string) || undefined,
    });
    toast.success("Invitation sent", { description: "They'll receive an email shortly." });
    setInviteOpen(false);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={tTeam("title")}
        description={tTeam("subtitle")}
        actions={
          <Button onClick={() => setInviteOpen(true)}>
            <UserPlus className="mr-2 h-4 w-4" />
            {tTeam("inviteMember")}
          </Button>
        }
      />

      {team && team.length === 0 && !isLoading ? (
        <EmptyState
          icon={UserPlus}
          title={tTeam("noMembers")}
          description={tTeam("inviteFirst")}
          action={<Button onClick={() => setInviteOpen(true)}>{tTeam("inviteMember")}</Button>}
        />
      ) : (
        <DataTable columns={columns} data={team ?? []} isLoading={isLoading} />
      )}

      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{tTeam("inviteMember")}</DialogTitle>
            <DialogDescription>Send an invitation to join your workspace.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleInvite} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">{t("auth.fullName")}</Label>
              <Input id="name" name="name" placeholder="John Doe" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">{tTeam("email")}</Label>
              <Input id="email" name="email" type="email" placeholder="john@company.com" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="roleId">{tTeam("role")}</Label>
              <Select name="roleId" defaultValue="role_dev">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {roles?.map((r) => (
                    <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setInviteOpen(false)}>
                {t("common.cancel")}
              </Button>
              <Button type="submit" disabled={inviteMember.isPending}>
                {inviteMember.isPending ? "Sending..." : "Send invite"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
