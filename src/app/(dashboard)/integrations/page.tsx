"use client";

import { useEffect, useMemo, useState } from "react";
import { Bot, CheckCircle2, Loader2, PlugZap } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { EmptyState } from "@/components/dashboard/empty-state";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { integrationsApi } from "@/lib/api/endpoints";
import { useProviders, useModels } from "@/lib/hooks/queries";
import { toast } from "sonner";

type TelegramIntegration = {
  id: string;
  bot_username?: string;
  botUsername?: string;
  status: string;
  default_provider_id?: string;
  default_model?: string;
  webhook_url?: string;
};

export default function IntegrationsPage() {
  const { data: providers = [] } = useProviders();
  const [providerId, setProviderId] = useState("");
  const { data: models = [] } = useModels(providerId || undefined);
  const [botToken, setBotToken] = useState("");
  const [model, setModel] = useState("");
  const [setWebhook, setSetWebhook] = useState(true);
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<TelegramIntegration[]>([]);

  const activeProviders = useMemo(() => providers.filter((p) => p.status !== "inactive"), [providers]);

  useEffect(() => {
    if (!providerId && activeProviders[0]?.id) {
      setProviderId(activeProviders[0].id);
    }
  }, [activeProviders, providerId]);

  useEffect(() => {
    if (!model && models[0]?.slug) {
      setModel(models[0].slug);
    }
  }, [models, model]);

  async function loadStatus() {
    try {
      const res = await integrationsApi.telegramStatus();
      setItems(res);
    } catch {
      // The backend may not be configured yet; keep the page usable.
    }
  }

  useEffect(() => {
    loadStatus();
  }, []);

  async function connectTelegram(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!providerId || !model) {
      toast.error("اختر مزودًا ونموذجًا أولًا");
      return;
    }

    setLoading(true);
    try {
      const res = await integrationsApi.connectTelegram({
        botToken,
        defaultProviderId: providerId,
        defaultModel: model,
        setWebhook,
      });
      toast.success("تم ربط Telegram", { description: res.botUsername });
      setBotToken("");
      await loadStatus();
    } catch (err: any) {
      toast.error("فشل ربط Telegram", { description: err?.message ?? "تحقق من token والمتغيرات" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="التكاملات"
        description="اربط المنصة مع Telegram واجعل البوت يرد عبر المزود والنموذج الذي تختاره."
      />

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-primary" />
              <CardTitle>Telegram Bot</CardTitle>
            </div>
            <CardDescription>
              أنشئ Bot من BotFather، ثم ضع token هنا. سيتم حفظ token مشفرًا في Supabase عبر الباك‑إند.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={connectTelegram} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="botToken">Bot token</Label>
                <Input
                  id="botToken"
                  type="password"
                  value={botToken}
                  onChange={(e) => setBotToken(e.target.value)}
                  placeholder="123456:ABC..."
                  required
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>المزود الافتراضي</Label>
                  <Select value={providerId} onValueChange={setProviderId}>
                    <SelectTrigger>
                      <SelectValue placeholder="اختر المزود" />
                    </SelectTrigger>
                    <SelectContent>
                      {activeProviders.map((provider) => (
                        <SelectItem key={provider.id} value={provider.id}>
                          {provider.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>النموذج الافتراضي</Label>
                  <Select value={model} onValueChange={setModel}>
                    <SelectTrigger>
                      <SelectValue placeholder="اختر النموذج" />
                    </SelectTrigger>
                    <SelectContent>
                      {models.map((m) => (
                        <SelectItem key={m.id} value={m.slug || m.name}>
                          {m.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center gap-2 rounded-lg border p-3">
                <Checkbox id="setWebhook" checked={setWebhook} onCheckedChange={(v) => setSetWebhook(v === true)} />
                <Label htmlFor="setWebhook" className="cursor-pointer text-sm">
                  اضبط Webhook تلقائيًا باستخدام PUBLIC_BACKEND_URL في Railway
                </Label>
              </div>

              <Button type="submit" disabled={loading || !botToken} className="w-full">
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PlugZap className="mr-2 h-4 w-4" />}
                ربط Telegram
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>الحالات المتصلة</CardTitle>
            <CardDescription>كل Bot متصل بهذه المنصة.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {items.length === 0 ? (
              <EmptyState icon={Bot} title="لا توجد تكاملات بعد" description="اربط Telegram Bot ليظهر هنا." />
            ) : (
              items.map((item) => (
                <div key={item.id} className="rounded-lg border p-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="font-medium">@{item.bot_username || item.botUsername}</div>
                    <Badge variant="outline" className="gap-1">
                      <CheckCircle2 className="h-3 w-3" />
                      {item.status}
                    </Badge>
                  </div>
                  {item.webhook_url ? <p className="mt-2 truncate text-xs text-muted-foreground">{item.webhook_url}</p> : null}
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
