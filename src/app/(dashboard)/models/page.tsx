"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Cpu, Search, Filter, Brain, Eye, Code, Mic, FileText } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { EmptyState } from "@/components/dashboard/empty-state";
import { Card, CardContent } from "@/components/ui/card";
import type { Model } from "@/types";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StatusBadge } from "@/components/dashboard/status-badges";
import { useModels, useProviders } from "@/lib/hooks/queries";
import { formatCompact, formatCurrency } from "@/lib/format";

const modalityIcons: Record<string, typeof Brain> = {
  text: FileText,
  image: Eye,
  audio: Mic,
  video: Eye,
  code: Code,
};

export default function ModelsPage() {
  const t = useTranslations();
  const tModels = useTranslations("models");
  const { data: models, isLoading } = useModels();
  const { data: providers } = useProviders();
  const [search, setSearch] = useState("");
  const [providerFilter, setProviderFilter] = useState<string>("all");
  const [capabilityFilter, setCapabilityFilter] = useState<string>("all");

  const allCapabilities = Array.from(new Set(models?.flatMap((m) => m.capabilities) ?? []));

  const filtered = models?.filter((m) => {
    const matchesSearch =
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.description.toLowerCase().includes(search.toLowerCase());
    const matchesProvider = providerFilter === "all" || m.providerId === providerFilter;
    const matchesCapability = capabilityFilter === "all" || m.capabilities.includes(capabilityFilter);
    return matchesSearch && matchesProvider && matchesCapability;
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title={tModels("title")}
        description={tModels("subtitle")}
        actions={
          <Button variant="outline">
            <Filter className="mr-2 h-4 w-4" />
            {t("common.filter")}
          </Button>
        }
      />

      <Card>
        <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={t("common.search")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={providerFilter} onValueChange={setProviderFilter}>
            <SelectTrigger className="sm:w-48">
              <SelectValue placeholder={tModels("provider")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("common.all")}</SelectItem>
              {providers?.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={capabilityFilter} onValueChange={setCapabilityFilter}>
            <SelectTrigger className="sm:w-48">
              <SelectValue placeholder={tModels("capabilities")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("common.all")}</SelectItem>
              {allCapabilities.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {filtered && filtered.length === 0 && !isLoading ? (
        <EmptyState
          icon={Cpu}
          title={tModels("noModels")}
          description={tModels("noModelsDescription")}
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {isLoading
            ? Array.from({ length: 6 }).map((_, i) => (
                <Card key={i} className="h-72">
                  <CardContent className="h-full shimmer rounded-lg" />
                </Card>
              ))
            : filtered?.map((m) => <ModelCard key={m.id} model={m} />)}
        </div>
      )}
    </div>
  );
}

function ModelCard({ model }: { model: Model }) {
  const tModels = useTranslations("models");
  return (
    <Card className="overflow-hidden transition-all hover:shadow-md hover:border-primary/30">
      <CardContent className="space-y-4 p-5">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Cpu className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-semibold leading-tight">{model.name}</h3>
              <p className="text-xs text-muted-foreground">{model.providerName}</p>
            </div>
          </div>
          <StatusBadge status={model.status} />
        </div>

        <p className="line-clamp-2 text-xs text-muted-foreground">{model.description}</p>

        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="rounded-md bg-muted/50 p-2">
            <p className="text-muted-foreground">{tModels("contextWindow")}</p>
            <p className="font-semibold">{formatCompact(model.contextWindow)}</p>
          </div>
          <div className="rounded-md bg-muted/50 p-2">
            <p className="text-muted-foreground">{tModels("maxOutput")}</p>
            <p className="font-semibold">{formatCompact(model.maxOutput)}</p>
          </div>
          <div className="rounded-md bg-muted/50 p-2">
            <p className="text-muted-foreground">{tModels("inputPrice")}</p>
            <p className="font-semibold">{formatCurrency(model.inputPricePer1k)}/1K</p>
          </div>
          <div className="rounded-md bg-muted/50 p-2">
            <p className="text-muted-foreground">{tModels("outputPrice")}</p>
            <p className="font-semibold">{formatCurrency(model.outputPricePer1k)}/1K</p>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex flex-wrap gap-1">
            {model.capabilities.map((c) => (
              <Badge key={c} variant="secondary" className="text-[10px]">
                {c}
              </Badge>
            ))}
          </div>
          <div className="flex items-center gap-1.5">
            {model.modalities.map((m) => {
              const Icon = modalityIcons[m] ?? FileText;
              return (
                <div key={m} className="flex h-6 w-6 items-center justify-center rounded bg-muted" title={m}>
                  <Icon className="h-3 w-3 text-muted-foreground" />
                </div>
              );
            })}
            {model.benchmarkScore !== undefined && (
              <Badge variant="outline" className="ml-auto text-[10px]">
                <Brain className="mr-1 h-2.5 w-2.5" />
                {model.benchmarkScore}
              </Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
