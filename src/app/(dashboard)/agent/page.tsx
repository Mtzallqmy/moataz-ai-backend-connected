"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Bot,
  BrainCircuit,
  Code2,
  ExternalLink,
  Globe2,
  KeyRound,
  Loader2,
  MessageSquare,
  PlugZap,
  Send,
  Terminal,
  Wand2,
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { useApiKeys, useCreateApiKey, useModels, useProviders } from "@/lib/hooks/queries";
import { agentApi, providerPresetsApi, providersApi, repositoriesApi, toolsApi } from "@/lib/api/endpoints";
import { queryKeys } from "@/lib/hooks/queries";
import { toast } from "sonner";

interface Message {
  role: "user" | "assistant";
  content: string;
}

type Preset = {
  name: string;
  type: string;
  baseUrl: string;
  defaultModel: string;
  features: string[];
  models: string[];
};

type Repo = {
  id: string;
  name: string;
  owner: string;
  repo: string;
  default_branch?: string;
  status: string;
};

export default function AgentStudioPage() {
  const qc = useQueryClient();
  const { data: providers = [] } = useProviders();
  const { data: apiKeys = [] } = useApiKeys();
  const createApiKey = useCreateApiKey();

  const [presets, setPresets] = useState<Preset[]>([]);
  const [providerId, setProviderId] = useState("");
  const { data: models = [] } = useModels(providerId || undefined);
  const [modelId, setModelId] = useState("");
  const [mode, setMode] = useState<"chat" | "agent" | "code" | "research">("agent");
  const [agentEnabled, setAgentEnabled] = useState(true);

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);

  const [providerType, setProviderType] = useState("openrouter");
  const selectedPreset = useMemo(() => presets.find((p) => p.type === providerType), [presets, providerType]);
  const [apiKey, setApiKey] = useState("");
  const [baseUrl, setBaseUrl] = useState("");
  const [defaultModel, setDefaultModel] = useState("");
  const [addingProvider, setAddingProvider] = useState(false);

  const [browserUrl, setBrowserUrl] = useState("");
  const [browserPreview, setBrowserPreview] = useState<{ title: string; text: string; url: string } | null>(null);
  const [browsing, setBrowsing] = useState(false);

  const [repos, setRepos] = useState<Repo[]>([]);
  const [repoId, setRepoId] = useState("");
  const [repoPath, setRepoPath] = useState("README.md");
  const [repoRef, setRepoRef] = useState("");
  const [repoSha, setRepoSha] = useState("");
  const [codeDraft, setCodeDraft] = useState("");
  const [repoLoading, setRepoLoading] = useState(false);
  const [newGatewayKey, setNewGatewayKey] = useState("");

  const activeProviders = useMemo(() => providers.filter((p) => p.status !== "inactive"), [providers]);
  const selectedProvider = activeProviders.find((p) => p.id === providerId);

  useEffect(() => {
    providerPresetsApi.list().then(setPresets).catch(() => setPresets([]));
    repositoriesApi.list().then(setRepos).catch(() => setRepos([]));
  }, []);

  useEffect(() => {
    if (!providerId && activeProviders[0]?.id) setProviderId(activeProviders[0].id);
  }, [activeProviders, providerId]);

  useEffect(() => {
    const first = models[0];
    if (first && (!modelId || !models.some((m) => m.slug === modelId || m.id === modelId))) {
      setModelId(first.slug || first.name || first.id);
    }
  }, [models, modelId]);

  useEffect(() => {
    if (selectedPreset) {
      setBaseUrl(selectedPreset.baseUrl || "");
      setDefaultModel(selectedPreset.defaultModel || selectedPreset.models?.[0] || "");
    }
  }, [selectedPreset]);

  async function addProvider(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!selectedPreset) return;
    setAddingProvider(true);
    try {
      const created = await providersApi.create({
        name: selectedPreset.name,
        type: selectedPreset.type,
        description: `${selectedPreset.name} connected from Agent Studio`,
        baseUrl,
        apiKey,
        defaultModel,
        region: "global",
        supportedFeatures: selectedPreset.features,
      } as any);
      try {
        await providersApi.testConnection(created.id);
        toast.success("تم حفظ المزود وفحص الاتصال بنجاح");
      } catch (err: any) {
        toast.warning("تم حفظ المزود، لكن فحص الاتصال فشل", { description: err?.message });
      }
      setApiKey("");
      setProviderId(created.id);
      await qc.invalidateQueries({ queryKey: queryKeys.providers });
      await qc.invalidateQueries({ queryKey: queryKeys.models });
    } catch (err: any) {
      toast.error("فشل حفظ المزود", { description: err?.message ?? "تحقق من البيانات" });
    } finally {
      setAddingProvider(false);
    }
  }

  async function createGatewayKey() {
    try {
      const res = await createApiKey.mutateAsync({ name: "CLI / OpenCode key", scopes: ["chat", "models"] } as any);
      setNewGatewayKey(res.newKey || res.key || "");
      toast.success("تم إنشاء مفتاح Gateway للـ CLI");
    } catch (err: any) {
      toast.error("فشل إنشاء المفتاح", { description: err?.message });
    }
  }

  async function browseNow() {
    if (!browserUrl) return;
    setBrowsing(true);
    try {
      const res = await toolsApi.browse({ url: browserUrl });
      setBrowserPreview({ title: res.title, text: res.text, url: res.url });
      toast.success("تم جلب الصفحة", { description: res.title });
    } catch (err: any) {
      toast.error("فشل التصفح", { description: err?.message });
    } finally {
      setBrowsing(false);
    }
  }

  async function readRepoFile() {
    if (!repoId || !repoPath) return;
    setRepoLoading(true);
    try {
      const res = await repositoriesApi.readFile(repoId, { path: repoPath, ref: repoRef || undefined });
      setCodeDraft(res.content);
      setRepoSha(res.sha);
      toast.success("تمت قراءة الملف من المستودع");
    } catch (err: any) {
      toast.error("فشل قراءة الملف", { description: err?.message });
    } finally {
      setRepoLoading(false);
    }
  }

  async function writeRepoFile() {
    if (!repoId || !repoPath) return;
    setRepoLoading(true);
    try {
      await repositoriesApi.writeFile(repoId, {
        path: repoPath,
        content: codeDraft,
        sha: repoSha || undefined,
        branch: repoRef || undefined,
        message: `Update ${repoPath} from Moataz Agent`,
      });
      toast.success("تم حفظ التعديل في GitHub");
    } catch (err: any) {
      toast.error("فشل حفظ الملف", { description: err?.message });
    } finally {
      setRepoLoading(false);
    }
  }

  async function sendMessage() {
    if (!input.trim()) return;
    if (!providerId || !modelId) {
      toast.error("أضف مزود API واختر نموذجًا أولًا");
      return;
    }
    const nextMessages = [...messages, { role: "user" as const, content: input.trim() }];
    setMessages(nextMessages);
    setInput("");
    setSending(true);
    try {
      const res = await agentApi.run({
        providerId,
        modelId,
        messages: nextMessages,
        temperature: mode === "code" ? 0.25 : 0.7,
        maxTokens: mode === "code" ? 4096 : 1600,
        tools: agentEnabled
          ? {
              browserUrl,
              repositoryId: repoId,
              repositoryPath: repoPath || undefined,
              repositoryRef: repoRef || undefined,
              codeDraft: codeDraft || undefined,
              mode,
            }
          : { mode: "chat" },
      });
      setMessages([...nextMessages, { role: "assistant", content: res.content }]);
      toast.success("تم رد الوكيل", { description: `${res.provider} · ${res.model} · ${res.latencyMs}ms` });
    } catch (err: any) {
      const text = err?.message ?? "تعذر تشغيل الوكيل";
      setMessages([...nextMessages, { role: "assistant", content: `خطأ: ${text}` }]);
      toast.error("فشل تشغيل الوكيل", { description: text });
    } finally {
      setSending(false);
    }
  }

  const baseUrlForCli = typeof window !== "undefined" ? `${window.location.origin}/v1` : "https://YOUR-RAILWAY-APP.up.railway.app/v1";

  return (
    <div className="space-y-6">
      <PageHeader
        title="استوديو الوكيل"
        description="دردشة حقيقية مع مزوداتك، وضع وكيل للتصفح، تحرير الأكواد، قراءة المستودعات، وواجهة /v1 متوافقة مع أدوات CLI و OpenCode."
        actions={<Badge className="gap-2" variant={selectedProvider ? "default" : "secondary"}><BrainCircuit className="h-3.5 w-3.5" />{selectedProvider ? selectedProvider.name : "أضف مزودًا"}</Badge>}
      />

      <div className="grid gap-6 xl:grid-cols-[360px_1fr_390px]">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base"><PlugZap className="h-4 w-4" />إضافة مزود API</CardTitle>
              <CardDescription>ضع مفتاحك مرة واحدة. يتم حفظه مشفرًا في Supabase عبر Railway.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={addProvider} className="space-y-4">
                <div className="space-y-2">
                  <Label>المزود</Label>
                  <Select value={providerType} onValueChange={setProviderType}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {presets.map((p) => <SelectItem key={p.type} value={p.type}>{p.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Base URL</Label>
                  <Input value={baseUrl} onChange={(e) => setBaseUrl(e.target.value)} placeholder="https://api.openai.com/v1" />
                </div>
                <div className="space-y-2">
                  <Label>Default model</Label>
                  <Input value={defaultModel} onChange={(e) => setDefaultModel(e.target.value)} placeholder="gpt-4o-mini" />
                </div>
                <div className="space-y-2">
                  <Label>API key</Label>
                  <Input type="password" value={apiKey} onChange={(e) => setApiKey(e.target.value)} placeholder="sk-..." required />
                </div>
                <Button type="submit" className="w-full" disabled={addingProvider || !apiKey}>
                  {addingProvider ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <KeyRound className="mr-2 h-4 w-4" />}
                  حفظ وفحص الاتصال
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">اختيار الوكيل</CardTitle>
              <CardDescription>اختر المزود والنموذج المستخدمين في المحادثة.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>المزود</Label>
                <Select value={providerId} onValueChange={setProviderId}>
                  <SelectTrigger><SelectValue placeholder="اختر المزود" /></SelectTrigger>
                  <SelectContent>
                    {activeProviders.map((p) => <SelectItem key={p.id} value={p.id}>{p.name} · {p.status}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>النموذج</Label>
                <Select value={modelId} onValueChange={setModelId}>
                  <SelectTrigger><SelectValue placeholder="اختر النموذج" /></SelectTrigger>
                  <SelectContent>
                    {models.map((m) => <SelectItem key={m.id} value={m.slug || m.name}>{m.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>وضع العمل</Label>
                <Select value={mode} onValueChange={(v: any) => setMode(v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="agent">وكيل عام</SelectItem>
                    <SelectItem value="code">وكيل أكواد</SelectItem>
                    <SelectItem value="research">بحث وتصفح</SelectItem>
                    <SelectItem value="chat">دردشة فقط</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <p className="text-sm font-medium">تفعيل الأدوات</p>
                  <p className="text-xs text-muted-foreground">تصفح + مستودعات + كود كـ context</p>
                </div>
                <Switch checked={agentEnabled} onCheckedChange={setAgentEnabled} />
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="min-h-[760px]">
          <CardHeader className="flex flex-row items-start justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2"><Bot className="h-5 w-5" />بوابة الدردشة والوكيل</CardTitle>
              <CardDescription>اكتب طلبًا، واربطه بالتصفح أو ملف من المستودع أو كود في المحرر.</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={() => setMessages([])}>مسح</Button>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="h-[520px] overflow-y-auto rounded-xl border bg-muted/20 p-4">
              {messages.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center text-center text-muted-foreground">
                  <Wand2 className="mb-3 h-10 w-10" />
                  <p className="font-medium text-foreground">ابدأ محادثة حقيقية مع وكيلك</p>
                  <p className="mt-1 max-w-md text-sm">مثال: تصفح هذا الرابط ولخصه، أو اقرأ README من المستودع واقترح خطة تعديل، أو عدل الكود الموجود في المحرر.</p>
                </div>
              ) : messages.map((m, i) => (
                <div key={i} className={`mb-3 flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[86%] whitespace-pre-wrap rounded-xl p-3 text-sm leading-relaxed ${m.role === "user" ? "bg-primary text-primary-foreground" : "border bg-card"}`}>
                    <div className="mb-1 text-[10px] font-semibold uppercase opacity-70">{m.role === "user" ? "أنت" : "الوكيل"}</div>
                    {m.content}
                  </div>
                </div>
              ))}
              {sending ? <div className="rounded-xl border bg-card p-3 text-sm text-muted-foreground">الوكيل يعمل الآن...</div> : null}
            </div>

            <div className="space-y-2">
              <Label>رسالتك</Label>
              <Textarea
                rows={4}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="اكتب: تصفح الرابط، اقرأ الملف، عدل هذا الكود، أو نفّذ كمساعد CLI..."
                onKeyDown={(e) => {
                  if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) sendMessage();
                }}
              />
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Ctrl/⌘ + Enter للإرسال</span>
                <Button onClick={sendMessage} disabled={sending || !input.trim()}>
                  {sending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                  إرسال للوكيل
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Tabs defaultValue="browser">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="browser"><Globe2 className="mr-1.5 h-3.5 w-3.5" />تصفح</TabsTrigger>
              <TabsTrigger value="code"><Code2 className="mr-1.5 h-3.5 w-3.5" />كود</TabsTrigger>
              <TabsTrigger value="cli"><Terminal className="mr-1.5 h-3.5 w-3.5" />CLI</TabsTrigger>
            </TabsList>

            <TabsContent value="browser" className="mt-4 space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">تصفح حقيقي من Railway</CardTitle>
                  <CardDescription>سيجلب الباك‑إند محتوى الرابط ويعطيه للوكيل كسياق.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Input value={browserUrl} onChange={(e) => setBrowserUrl(e.target.value)} placeholder="https://example.com" />
                  <Button variant="outline" onClick={browseNow} disabled={browsing || !browserUrl} className="w-full">
                    {browsing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ExternalLink className="mr-2 h-4 w-4" />}
                    تجربة التصفح الآن
                  </Button>
                  {browserPreview ? (
                    <div className="max-h-64 overflow-y-auto rounded-lg border p-3 text-xs">
                      <p className="mb-1 font-semibold">{browserPreview.title}</p>
                      <p className="mb-2 truncate text-muted-foreground">{browserPreview.url}</p>
                      <p className="whitespace-pre-wrap leading-relaxed">{browserPreview.text.slice(0, 1200)}</p>
                    </div>
                  ) : null}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="code" className="mt-4 space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">محرر الأكواد والمستودعات</CardTitle>
                  <CardDescription>اقرأ ملفًا من GitHub، عدله هنا، ثم اطلب من الوكيل مراجعته أو احفظه.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Select value={repoId} onValueChange={setRepoId}>
                    <SelectTrigger><SelectValue placeholder="اختر مستودعًا متصلًا" /></SelectTrigger>
                    <SelectContent>
                      {repos.map((r) => <SelectItem key={r.id} value={r.id}>{r.owner}/{r.repo}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <div className="grid grid-cols-[1fr_110px] gap-2">
                    <Input value={repoPath} onChange={(e) => setRepoPath(e.target.value)} placeholder="src/app/page.tsx" />
                    <Input value={repoRef} onChange={(e) => setRepoRef(e.target.value)} placeholder="main" />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Button variant="outline" onClick={readRepoFile} disabled={repoLoading || !repoId || !repoPath}>قراءة</Button>
                    <Button variant="outline" onClick={writeRepoFile} disabled={repoLoading || !repoId || !repoPath}>حفظ</Button>
                  </div>
                  <Textarea value={codeDraft} onChange={(e) => setCodeDraft(e.target.value)} rows={16} className="font-mono text-xs" placeholder="ضع الكود هنا أو اقرأ ملفًا من المستودع..." />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="cli" className="mt-4 space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base"><MessageSquare className="h-4 w-4" />OpenAI-compatible API</CardTitle>
                  <CardDescription>استخدم المنصة من أي CLI يدعم OPENAI_BASE_URL مثل OpenCode أو سكربتات curl.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button variant="outline" onClick={createGatewayKey} className="w-full"><KeyRound className="mr-2 h-4 w-4" />إنشاء مفتاح Gateway</Button>
                  {newGatewayKey ? <Textarea readOnly value={newGatewayKey} rows={3} className="font-mono text-xs" /> : null}
                  <pre className="overflow-x-auto rounded-lg border bg-muted/30 p-3 font-mono text-xs leading-relaxed">{`export OPENAI_BASE_URL="${baseUrlForCli}"
export OPENAI_API_KEY="mk_..."

curl ${baseUrlForCli}/chat/completions \
  -H "Authorization: Bearer $OPENAI_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"model":"${modelId || "gpt-4o-mini"}","messages":[{"role":"user","content":"Hello"}]}'`}</pre>
                  <p className="text-xs text-muted-foreground">المفاتيح الحالية: {apiKeys.length}</p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
