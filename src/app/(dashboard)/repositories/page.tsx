"use client";

import { useEffect, useState } from "react";
import { GitBranch, Github, Loader2, LockKeyhole, RefreshCw } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { EmptyState } from "@/components/dashboard/empty-state";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { repositoriesApi } from "@/lib/api/endpoints";
import { toast } from "sonner";

type RepoConnection = {
  id: string;
  name: string;
  provider: string;
  owner: string;
  repo: string;
  default_branch?: string;
  status: string;
  created_at?: string;
};

export default function RepositoriesPage() {
  const [token, setToken] = useState("");
  const [owner, setOwner] = useState("");
  const [repo, setRepo] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<RepoConnection[]>([]);

  async function load() {
    try {
      const res = await repositoriesApi.list();
      setItems(res);
    } catch {
      // Keep the form usable if backend is not ready yet.
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function connectRepository(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    try {
      await repositoriesApi.connect({ token, owner, repo, name: name || undefined });
      toast.success("تم ربط المستودع", { description: `${owner}/${repo}` });
      setToken("");
      setOwner("");
      setRepo("");
      setName("");
      await load();
    } catch (err: any) {
      toast.error("فشل ربط المستودع", { description: err?.message ?? "تحقق من token وصلاحيات المستودع" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="المستودعات"
        description="اربط مستودعات GitHub حتى يستطيع الوكيل الذكي قراءة الملفات وتحديثها عبر الباك‑إند."
        actions={
          <Button variant="outline" onClick={load}>
            <RefreshCw className="mr-2 h-4 w-4" />
            تحديث
          </Button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Github className="h-5 w-5 text-primary" />
              <CardTitle>ربط GitHub</CardTitle>
            </div>
            <CardDescription>
              ضع Personal Access Token بصلاحية مناسبة. سيتم حفظه مشفرًا في Supabase عبر Railway.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={connectRepository} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="token">GitHub token</Label>
                <div className="relative">
                  <LockKeyhole className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="token"
                    type="password"
                    className="pl-9"
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    placeholder="github_pat_..."
                    required
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="owner">Owner</Label>
                  <Input id="owner" value={owner} onChange={(e) => setOwner(e.target.value)} placeholder="moataz" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="repo">Repo</Label>
                  <Input id="repo" value={repo} onChange={(e) => setRepo(e.target.value)} placeholder="ai-app" required />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">اسم اختياري</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Main app repository" />
              </div>

              <Button type="submit" disabled={loading || !token || !owner || !repo} className="w-full">
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <GitBranch className="mr-2 h-4 w-4" />}
                ربط المستودع
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>المستودعات المتصلة</CardTitle>
            <CardDescription>القائمة الحقيقية محفوظة في Supabase.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {items.length === 0 ? (
              <EmptyState icon={GitBranch} title="لا توجد مستودعات بعد" description="اربط مستودع GitHub ليظهر هنا." />
            ) : (
              items.map((item) => (
                <div key={item.id} className="rounded-lg border p-3">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <div className="font-medium">{item.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {item.owner}/{item.repo} · {item.default_branch || "main"}
                      </div>
                    </div>
                    <Badge variant="outline">{item.status}</Badge>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
