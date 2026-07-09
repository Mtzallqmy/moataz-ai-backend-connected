"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Lock, Monitor, Smartphone, Tablet, Trash2, AlertTriangle, Shield } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";

const sessions = [
  { id: "s1", device: "MacBook Pro · Chrome 127.0", location: "San Francisco, CA", lastActive: "Active now", icon: Monitor, current: true },
  { id: "s2", device: "iPhone 15 Pro · Safari", location: "San Francisco, CA", lastActive: "2 hours ago", icon: Smartphone, current: false },
  { id: "s3", device: "iPad Pro · Safari", location: "New York, NY", lastActive: "1 day ago", icon: Tablet, current: false },
];

export default function AccountPage() {
  const t = useTranslations();
  const tAccount = useTranslations("account");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [understand, setUnderstand] = useState(false);

  const handlePasswordUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success(tAccount("updatePassword") + " successful");
    (e.target as HTMLFormElement).reset();
  };

  return (
    <div className="space-y-6">
      <PageHeader title={tAccount("title")} description={tAccount("subtitle")} />

      {/* Account info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{tAccount("accountInfo")}</CardTitle>
          <CardDescription>Your account details and identifiers</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Account ID</Label>
            <p className="font-mono text-sm">usr_001_moataz</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Member since</Label>
            <p className="text-sm">January 15, 2024</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Plan</Label>
            <Badge variant="secondary">Scale</Badge>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Status</Label>
            <Badge variant="outline" className="text-success border-success/30 bg-success/10">Active</Badge>
          </div>
        </CardContent>
      </Card>

      {/* Change password */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Lock className="h-4 w-4" />
            {tAccount("changePassword")}
          </CardTitle>
          <CardDescription>Update your password regularly to keep your account secure</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePasswordUpdate} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="current">{tAccount("currentPassword")}</Label>
              <Input id="current" type="password" required />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="new">{tAccount("newPassword")}</Label>
                <Input id="new" type="password" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm">{tAccount("confirmPassword")}</Label>
                <Input id="confirm" type="password" required />
              </div>
            </div>
            <Button type="submit">{tAccount("updatePassword")}</Button>
          </form>
        </CardContent>
      </Card>

      {/* Active sessions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{tAccount("sessions")}</CardTitle>
          <CardDescription>Manage devices currently signed in to your account</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {sessions.map((s) => {
            const Icon = s.icon;
            return (
              <div key={s.id} className="flex items-center justify-between rounded-lg border p-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted">
                    <Icon className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">
                      {s.device}
                      {s.current && (
                        <Badge variant="secondary" className="ml-2 text-[10px]">Current</Badge>
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground">{s.location} · {s.lastActive}</p>
                  </div>
                </div>
                {!s.current && (
                  <Button variant="ghost" size="sm" className="text-destructive">
                    {tAccount("revokeSession")}
                  </Button>
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Security checklist */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Security checklist
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {[
            { label: "Strong password", done: true },
            { label: "Two-factor authentication", done: false },
            { label: "Recovery email configured", done: true },
            { label: "Recent security review", done: false },
          ].map((item) => (
            <div key={item.label} className="flex items-center justify-between rounded-lg border p-3">
              <p className="text-sm">{item.label}</p>
              <Badge variant={item.done ? "outline" : "secondary"} className={item.done ? "text-success border-success/30 bg-success/10" : ""}>
                {item.done ? "Done" : "Pending"}
              </Badge>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Danger zone */}
      <Card className="border-destructive/30">
        <CardHeader>
          <CardTitle className="text-base text-destructive flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            {tAccount("deleteAccount")}
          </CardTitle>
          <CardDescription>{tAccount("deleteAccountWarning")}</CardDescription>
        </CardHeader>
        <CardContent>
          <Dialog open={confirmDelete} onOpenChange={setConfirmDelete}>
            <DialogTrigger asChild>
              <Button variant="destructive">{tAccount("deleteAccount")}</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="text-destructive">Are you absolutely sure?</DialogTitle>
                <DialogDescription>{tAccount("deleteAccountWarning")}</DialogDescription>
              </DialogHeader>
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Warning</AlertTitle>
                <AlertDescription>
                  All your data, including API keys, providers, and team memberships, will be permanently deleted.
                </AlertDescription>
              </Alert>
              <div className="flex items-start gap-2">
                <Checkbox id="confirm" checked={understand} onCheckedChange={(v) => setUnderstand(v === true)} />
                <Label htmlFor="confirm" className="text-sm cursor-pointer">
                  {tAccount("deleteAccountConfirm")}
                </Label>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setConfirmDelete(false)}>
                  {t("common.cancel")}
                </Button>
                <Button variant="destructive" disabled={!understand}>
                  <Trash2 className="mr-2 h-4 w-4" />
                  {tAccount("deleteAccount")}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>
    </div>
  );
}
