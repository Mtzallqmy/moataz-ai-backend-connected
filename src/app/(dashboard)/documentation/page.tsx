"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { BookOpen, Search, FileText, Code, Lightbulb, Boxes, Star, ArrowRight } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useDocs } from "@/lib/hooks/queries";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

const categoryIcons: Record<string, typeof BookOpen> = {
  "Getting Started": Lightbulb,
  "API Reference": Code,
  "Guides": FileText,
  "Examples": Star,
};

export default function DocumentationPage() {
  const t = useTranslations();
  const tDocs = useTranslations("documentation");
  const { data: docs, isLoading } = useDocs();
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("All");

  const categories = ["All", ...Array.from(new Set(docs?.map((d) => d.category) ?? []))];

  const filtered = docs?.filter(
    (d) =>
      (activeCategory === "All" || d.category === activeCategory) &&
      (d.title.toLowerCase().includes(search.toLowerCase()) ||
        d.description.toLowerCase().includes(search.toLowerCase()))
  );

  const popular = docs?.slice(0, 3) ?? [];

  return (
    <div className="space-y-6">
      <PageHeader title={tDocs("title")} description={tDocs("subtitle")} />

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder={tDocs("search")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-12 pl-10"
        />
      </div>

      {/* Quick links */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: tDocs("gettingStarted"), icon: Lightbulb, color: "bg-amber-500/10 text-amber-500" },
          { label: tDocs("apiReference"), icon: Code, color: "bg-cyan-500/10 text-cyan-500" },
          { label: tDocs("guides"), icon: FileText, color: "bg-emerald-500/10 text-emerald-500" },
          { label: tDocs("sdk"), icon: Boxes, color: "bg-violet-500/10 text-violet-500" },
        ].map((item) => (
          <Card key={item.label} className="cursor-pointer transition-all hover:border-primary/30 hover:shadow-sm">
            <CardContent className="flex items-center gap-3 p-4">
              <div className={cn("flex h-10 w-10 items-center justify-center rounded-lg", item.color)}>
                <item.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-medium">{item.label}</p>
                <p className="text-xs text-muted-foreground">Browse →</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Popular */}
      {!search && (
        <div>
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold">
            <Star className="h-4 w-4 text-warning" />
            {tDocs("popular")}
          </h2>
          <div className="grid gap-3 md:grid-cols-3">
            {isLoading
              ? Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-32" />)
              : popular.map((doc) => (
                  <Card key={doc.id} className="cursor-pointer transition-all hover:border-primary/30 hover:shadow-sm">
                    <CardContent className="space-y-2 p-4">
                      <Badge variant="outline" className="text-[10px]">{doc.category}</Badge>
                      <p className="font-medium leading-tight">{doc.title}</p>
                      <p className="text-xs text-muted-foreground">{doc.description}</p>
                      <p className="text-[10px] text-muted-foreground/70">
                        {tDocs("lastUpdated")} {formatDistanceToNow(new Date(doc.updatedAt), { addSuffix: true })}
                      </p>
                    </CardContent>
                  </Card>
                ))}
          </div>
        </div>
      )}

      {/* Categories */}
      <div className="flex flex-wrap gap-2">
        {categories.map((cat) => (
          <Button
            key={cat}
            variant={activeCategory === cat ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveCategory(cat)}
            className="text-xs"
          >
            {cat}
          </Button>
        ))}
      </div>

      {/* Docs list */}
      <div className="grid gap-3 md:grid-cols-2">
        {isLoading
          ? Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-28" />)
          : filtered?.map((doc) => {
              const Icon = categoryIcons[doc.category] ?? BookOpen;
              return (
                <Card key={doc.id} className="cursor-pointer transition-all hover:border-primary/30 hover:shadow-sm">
                  <CardContent className="flex items-start gap-3 p-4">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium leading-tight">{doc.title}</p>
                      </div>
                      <p className="text-xs text-muted-foreground">{doc.description}</p>
                      <div className="flex items-center gap-2 pt-1">
                        <Badge variant="secondary" className="text-[10px]">{doc.category}</Badge>
                        <span className="text-[10px] text-muted-foreground/70">
                          {formatDistanceToNow(new Date(doc.updatedAt), { addSuffix: true })}
                        </span>
                      </div>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground rtl-flip" />
                  </CardContent>
                </Card>
              );
            })}
      </div>
    </div>
  );
}
