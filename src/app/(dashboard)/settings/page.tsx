"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Save, Settings as SettingsIcon, Palette, Bell, Shield, Plug, Sliders } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useSettingsStore } from "@/stores/settings-store";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const accentColors = [
  { name: "Violet", value: "violet", className: "bg-violet-500" },
  { name: "Emerald", value: "emerald", className: "bg-emerald-500" },
  { name: "Amber", value: "amber", className: "bg-amber-500" },
  { name: "Rose", value: "rose", className: "bg-rose-500" },
  { name: "Cyan", value: "cyan", className: "bg-cyan-500" },
];

export default function SettingsPage() {
  const t = useTranslations();
  const tSettings = useTranslations("settings");
  const settings = useSettingsStore();
  const [workspaceName, setWorkspaceName] = useState("Moataz AI Workspace");

  const handleSave = () => {
    toast.success(tSettings("changesSaved"));
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={tSettings("title")}
        description={tSettings("subtitle")}
        actions={
          <Button onClick={handleSave}>
            <Save className="mr-2 h-4 w-4" />
            {tSettings("saveChanges")}
          </Button>
        }
      />

      <Tabs defaultValue="general">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 lg:w-fit">
          <TabsTrigger value="general" className="text-xs">
            <SettingsIcon className="mr-1.5 h-3.5 w-3.5" />
            <span className="hidden sm:inline">{tSettings("general")}</span>
          </TabsTrigger>
          <TabsTrigger value="appearance" className="text-xs">
            <Palette className="mr-1.5 h-3.5 w-3.5" />
            <span className="hidden sm:inline">{tSettings("appearance")}</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="text-xs">
            <Bell className="mr-1.5 h-3.5 w-3.5" />
            <span className="hidden sm:inline">{tSettings("notifications")}</span>
          </TabsTrigger>
          <TabsTrigger value="security" className="text-xs">
            <Shield className="mr-1.5 h-3.5 w-3.5" />
            <span className="hidden sm:inline">{tSettings("security")}</span>
          </TabsTrigger>
          <TabsTrigger value="integrations" className="text-xs">
            <Plug className="mr-1.5 h-3.5 w-3.5" />
            <span className="hidden sm:inline">{tSettings("integrations")}</span>
          </TabsTrigger>
          <TabsTrigger value="advanced" className="text-xs">
            <Sliders className="mr-1.5 h-3.5 w-3.5" />
            <span className="hidden sm:inline">{tSettings("advanced")}</span>
          </TabsTrigger>
        </TabsList>

        {/* General */}
        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{tSettings("general")}</CardTitle>
              <CardDescription>Configure your workspace settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="workspace">{tSettings("workspaceName")}</Label>
                <Input id="workspace" value={workspaceName} onChange={(e) => setWorkspaceName(e.target.value)} />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>{tSettings("defaultLanguage")}</Label>
                  <Select value={settings.locale} onValueChange={(v) => settings.setLocale(v as "en" | "ar")}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="ar">العربية</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>{tSettings("defaultTimezone")}</Label>
                  <Select defaultValue="utc">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="utc">UTC</SelectItem>
                      <SelectItem value="est">EST (UTC-5)</SelectItem>
                      <SelectItem value="pst">PST (UTC-8)</SelectItem>
                      <SelectItem value="gst">GST (UTC+4)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Appearance */}
        <TabsContent value="appearance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{tSettings("appearance")}</CardTitle>
              <CardDescription>Customize how the application looks</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <Label>{tSettings("themeMode")}</Label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { value: "light", label: t("common.lightMode") },
                    { value: "dark", label: t("common.darkMode") },
                    { value: "system", label: t("common.systemMode") },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => settings.setTheme(opt.value as "light" | "dark" | "system")}
                      className={cn(
                        "rounded-lg border p-4 text-center text-sm transition-all",
                        settings.theme === opt.value
                          ? "border-primary bg-primary/5 text-primary"
                          : "hover:bg-muted"
                      )}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <Label>{tSettings("accentColor")}</Label>
                <div className="flex gap-2">
                  {accentColors.map((c) => (
                    <button
                      key={c.value}
                      onClick={() => settings.setAccentColor(c.value as "violet" | "emerald" | "amber" | "rose" | "cyan")}
                      className={cn(
                        "flex h-10 w-10 items-center justify-center rounded-lg ring-offset-2 transition-all",
                        c.className,
                        settings.accentColor === c.value && "ring-2 ring-ring"
                      )}
                      aria-label={c.name}
                    >
                      {settings.accentColor === c.value && <span className="text-xs text-white">✓</span>}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <Label>{tSettings("density")}</Label>
                <Select value={settings.density} onValueChange={(v) => settings.setDensity(v as "compact" | "comfortable" | "spacious")}>
                  <SelectTrigger className="sm:w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="compact">Compact</SelectItem>
                    <SelectItem value="comfortable">Comfortable</SelectItem>
                    <SelectItem value="spacious">Spacious</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications */}
        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{tSettings("notifications")}</CardTitle>
              <CardDescription>Choose what you want to be notified about</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { key: "emailNotifications", label: tSettings("emailNotifications"), desc: "Receive email notifications for important events" },
                { key: "pushNotifications", label: tSettings("pushNotifications"), desc: "Get real-time push notifications in your browser" },
                { key: "weeklyDigest", label: tSettings("weeklyDigest"), desc: "Receive a weekly summary of activity every Monday" },
              ].map((item) => (
                <div key={item.key} className="flex items-center justify-between rounded-lg border p-3">
                  <div className="pr-4">
                    <p className="text-sm font-medium">{item.label}</p>
                    <p className="text-xs text-muted-foreground">{item.desc}</p>
                  </div>
                  <Switch
                    checked={settings[item.key as "emailNotifications" | "pushNotifications" | "weeklyDigest"]}
                    onCheckedChange={(v) => {
                      if (item.key === "emailNotifications") settings.setEmailNotifications(v);
                      if (item.key === "pushNotifications") settings.setPushNotifications(v);
                      if (item.key === "weeklyDigest") settings.setWeeklyDigest(v);
                    }}
                  />
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security */}
        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{tSettings("security")}</CardTitle>
              <CardDescription>Manage security settings for your workspace</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div className="pr-4">
                  <p className="text-sm font-medium">{tSettings("twoFactor")}</p>
                  <p className="text-xs text-muted-foreground">Require 2FA for all team members</p>
                </div>
                <Switch checked={settings.twoFactor} onCheckedChange={settings.setTwoFactor} />
              </div>
              <div className="space-y-2">
                <Label>{tSettings("apiRateLimit")}</Label>
                <Input type="number" defaultValue={1000} />
                <p className="text-xs text-muted-foreground">Maximum requests per minute per API key</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Integrations */}
        <TabsContent value="integrations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{tSettings("integrations")}</CardTitle>
              <CardDescription>Connect Moataz with your favorite tools</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2">
              {[
                { name: "Slack", desc: "Get notifications in Slack channels", connected: true },
                { name: "Datadog", desc: "Send metrics to Datadog", connected: false },
                { name: "PagerDuty", desc: "Trigger incidents for outages", connected: false },
                { name: "Zapier", desc: "Automate workflows with 5000+ apps", connected: true },
                { name: "Webhook", desc: "Send custom webhook events", connected: true },
                { name: "GraphQL API", desc: "Programmatic access to all features", connected: true },
              ].map((int) => (
                <div key={int.name} className="flex items-start justify-between rounded-lg border p-3">
                  <div className="pr-4">
                    <p className="text-sm font-medium">{int.name}</p>
                    <p className="text-xs text-muted-foreground">{int.desc}</p>
                  </div>
                  <Button variant={int.connected ? "outline" : "default"} size="sm">
                    {int.connected ? "Disconnect" : "Connect"}
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Advanced */}
        <TabsContent value="advanced" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{tSettings("advanced")}</CardTitle>
              <CardDescription>Advanced configuration options</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Custom domain</Label>
                <Input placeholder="api.yourcompany.com" />
                <p className="text-xs text-muted-foreground">Use a custom domain for API requests</p>
              </div>
              <div className="space-y-2">
                <Label>IP allowlist</Label>
                <Textarea placeholder="192.168.1.1, 10.0.0.0/8" rows={3} />
                <p className="text-xs text-muted-foreground">Comma-separated list of allowed IPs/CIDRs</p>
              </div>
              <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4">
                <p className="text-sm font-medium text-destructive">Danger zone</p>
                <p className="mt-1 text-xs text-muted-foreground">These actions are permanent and cannot be undone.</p>
                <div className="mt-3 flex gap-2">
                  <Button variant="destructive" size="sm">Reset workspace</Button>
                  <Button variant="outline" size="sm" className="text-destructive">Delete workspace</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
