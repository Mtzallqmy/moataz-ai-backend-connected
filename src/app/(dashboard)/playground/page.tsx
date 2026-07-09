"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Send, Eraser, Save, Zap, Clock, Cpu, DollarSign, MessageSquare } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useProviders, useModels } from "@/lib/hooks/queries";
import { playgroundApi } from "@/lib/api/endpoints";
import { toast } from "sonner";

interface Message {
  role: "system" | "user" | "assistant";
  content: string;
}

export default function PlaygroundPage() {
  const tPlayground = useTranslations("playground");
  const { data: providers } = useProviders();
  const { data: models } = useModels();

  const [providerId, setProviderId] = useState<string>("");
  const [modelId, setModelId] = useState<string>("");
  const [systemPrompt, setSystemPrompt] = useState("You are a helpful assistant. Answer concisely and accurately.");
  const [userMessage, setUserMessage] = useState("");
  const [temperature, setTemperature] = useState(0.7);
  const [maxTokens, setMaxTokens] = useState(2048);
  const [topP, setTopP] = useState(1);
  const [streaming, setStreaming] = useState(true);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  const availableModels = models?.filter((m) => m.providerId === providerId) ?? [];

  useEffect(() => {
    if (!providerId && providers?.[0]?.id) setProviderId(providers[0].id);
  }, [providers, providerId]);

  useEffect(() => {
    const firstModel = availableModels[0] || models?.[0];
    if (firstModel && (!modelId || !models?.some((m) => m.slug === modelId || m.id === modelId))) {
      setModelId(firstModel.slug || firstModel.name || firstModel.id);
    }
  }, [availableModels, models, modelId]);

  const handleSend = async () => {
    if (!userMessage.trim()) return;
    if (!providerId || !modelId) {
      toast.error("Add a provider and select a model first");
      return;
    }
    const newMessages: Message[] = [
      ...messages,
      { role: "user", content: userMessage },
    ];
    setMessages(newMessages);
    setUserMessage("");
    setIsGenerating(true);

    try {
      const apiMessages: Message[] = [
        ...(systemPrompt.trim() ? [{ role: "system", content: systemPrompt } as Message] : []),
        ...newMessages,
      ];
      const res = await playgroundApi.chat({
        providerId,
        modelId,
        messages: apiMessages,
        temperature,
        maxTokens,
        topP,
      });
      setMessages([
        ...newMessages,
        { role: "assistant", content: res.content },
      ]);
      toast.success("Response generated", { description: `${res.provider} · ${res.model} · ${res.latencyMs}ms` });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Generation failed";
      setMessages([
        ...newMessages,
        { role: "assistant", content: `Error: ${message}` },
      ]);
      toast.error("Generation failed", { description: message });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleClear = () => {
    setMessages([]);
    toast.info("Conversation cleared");
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={tPlayground("title")}
        description={tPlayground("subtitle")}
        actions={
          <Button variant="outline">
            <Save className="mr-2 h-4 w-4" />
            {tPlayground("savePreset")}
          </Button>
        }
      />

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Main chat */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              {tPlayground("response")}
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={handleClear}>
              <Eraser className="mr-1.5 h-3.5 w-3.5" />
              {tPlayground("clear")}
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="min-h-[400px] max-h-[500px] overflow-y-auto scrollbar-thin space-y-3 rounded-lg border bg-muted/20 p-4">
              {messages.length === 0 ? (
                <div className="flex h-full min-h-[360px] flex-col items-center justify-center text-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                    <Zap className="h-6 w-6 text-primary" />
                  </div>
                  <p className="mt-3 text-sm font-medium">{tPlayground("noHistory")}</p>
                  <p className="mt-1 text-xs text-muted-foreground">Send a message to start a conversation</p>
                </div>
              ) : (
                messages.map((m, i) => (
                  <div
                    key={i}
                    className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-lg p-3 text-sm ${
                        m.role === "user"
                          ? "bg-primary text-primary-foreground"
                          : m.role === "system"
                          ? "bg-muted text-muted-foreground italic"
                          : "bg-card border"
                      }`}
                    >
                      <p className="mb-1 text-[10px] uppercase font-semibold opacity-70">
                        {m.role}
                      </p>
                      <p className="leading-relaxed whitespace-pre-wrap">{m.content}</p>
                    </div>
                  </div>
                ))
              )}
              {isGenerating && (
                <div className="flex justify-start">
                  <div className="rounded-lg border bg-card p-3">
                    <div className="flex gap-1">
                      <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground" style={{ animationDelay: "0ms" }} />
                      <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground" style={{ animationDelay: "150ms" }} />
                      <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground" style={{ animationDelay: "300ms" }} />
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label>{tPlayground("userMessage")}</Label>
              <Textarea
                value={userMessage}
                onChange={(e) => setUserMessage(e.target.value)}
                placeholder="Type your message..."
                rows={3}
                className="resize-none"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                    handleSend();
                  }
                }}
              />
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  Press ⌘+Enter to send
                </span>
                <Button onClick={handleSend} disabled={!userMessage.trim() || isGenerating}>
                  <Send className="mr-2 h-4 w-4" />
                  {tPlayground("send")}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Settings sidebar */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>{tPlayground("selectProvider")}</Label>
                <Select value={providerId} onValueChange={(v) => {
                  setProviderId(v);
                  const firstModel = models?.find((m) => m.providerId === v);
                  if (firstModel) setModelId(firstModel.id);
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    {providers?.map((p) => (
                      <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{tPlayground("selectModel")}</Label>
                <Select value={modelId} onValueChange={setModelId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableModels.map((m) => (
                      <SelectItem key={m.id} value={m.slug || m.name || m.id}>{m.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>{tPlayground("temperature")}</Label>
                  <Badge variant="secondary" className="font-mono text-xs">{temperature.toFixed(2)}</Badge>
                </div>
                <Slider
                  value={[temperature]}
                  onValueChange={(v) => setTemperature(v[0])}
                  min={0}
                  max={2}
                  step={0.05}
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>{tPlayground("maxTokens")}</Label>
                  <Badge variant="secondary" className="font-mono text-xs">{maxTokens}</Badge>
                </div>
                <Slider
                  value={[maxTokens]}
                  onValueChange={(v) => setMaxTokens(v[0])}
                  min={1}
                  max={8192}
                  step={1}
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>{tPlayground("topP")}</Label>
                  <Badge variant="secondary" className="font-mono text-xs">{topP.toFixed(2)}</Badge>
                </div>
                <Slider
                  value={[topP]}
                  onValueChange={(v) => setTopP(v[0])}
                  min={0}
                  max={1}
                  step={0.05}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="streaming">{tPlayground("streaming")}</Label>
                <Switch id="streaming" checked={streaming} onCheckedChange={setStreaming} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">{tPlayground("systemPrompt")}</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={systemPrompt}
                onChange={(e) => setSystemPrompt(e.target.value)}
                placeholder="You are a helpful assistant..."
                rows={4}
                className="resize-none text-sm"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">{tPlayground("metadata")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <Clock className="h-3.5 w-3.5" />
                  {tPlayground("latency")}
                </span>
                <span className="font-mono">324ms</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <Cpu className="h-3.5 w-3.5" />
                  {tPlayground("tokensUsed")}
                </span>
                <span className="font-mono">1,284</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <DollarSign className="h-3.5 w-3.5" />
                  {tPlayground("cost")}
                </span>
                <span className="font-mono">$0.0124</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
