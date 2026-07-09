"use client";

import { useTranslations } from "next-intl";
import { Lock, Check, X } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { usePermissions } from "@/lib/hooks/queries";
import { useMemo } from "react";

export default function PermissionsPage() {
  const t = useTranslations();
  const tPermissions = useTranslations("permissions");
  const { data: permissions, isLoading } = usePermissions();

  const grouped = useMemo(() => {
    const groups: Record<string, NonNullable<typeof permissions>> = {};
    permissions?.forEach((p) => {
      if (!groups[p.group]) groups[p.group] = [];
      groups[p.group].push(p);
    });
    return groups;
  }, [permissions]);

  return (
    <div className="space-y-6">
      <PageHeader title={tPermissions("title")} description={tPermissions("subtitle")} />

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {Object.entries(grouped).map(([group, perms]) => (
            <Card key={group}>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Lock className="h-4 w-4" />
                  </div>
                  <CardTitle className="text-base">{group}</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {perms?.map((p) => (
                  <div key={p.id} className="flex items-start justify-between rounded-lg border p-3">
                    <div className="pr-4">
                      <p className="font-mono text-xs font-medium">{p.name}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">{p.description}</p>
                      <div className="mt-1.5 flex gap-1">
                        {p.actions.map((a) => (
                          <Badge key={a} variant="outline" className="text-[10px]">
                            {a}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <Checkbox />
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Permission Matrix</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="pb-2 pr-4 text-left text-xs font-semibold text-muted-foreground">Permission</th>
                  <th className="pb-2 px-2 text-center text-xs font-semibold text-muted-foreground">Owner</th>
                  <th className="pb-2 px-2 text-center text-xs font-semibold text-muted-foreground">Admin</th>
                  <th className="pb-2 px-2 text-center text-xs font-semibold text-muted-foreground">Developer</th>
                  <th className="pb-2 px-2 text-center text-xs font-semibold text-muted-foreground">Billing</th>
                  <th className="pb-2 pl-2 text-center text-xs font-semibold text-muted-foreground">Viewer</th>
                </tr>
              </thead>
              <tbody>
                {permissions?.slice(0, 10).map((p) => (
                  <tr key={p.id} className="border-b last:border-0">
                    <td className="py-2 pr-4 font-mono text-xs">{p.name}</td>
                    <td className="px-2 text-center"><Check className="mx-auto h-3.5 w-3.5 text-success" /></td>
                    <td className="px-2 text-center">
                      {p.resource === "billing" || p.resource === "providers" || p.resource === "models" || p.resource === "api-keys" || p.resource === "team" ? (
                        <Check className="mx-auto h-3.5 w-3.5 text-success" />
                      ) : (
                        <X className="mx-auto h-3.5 w-3.5 text-muted-foreground" />
                      )}
                    </td>
                    <td className="px-2 text-center">
                      {p.actions.includes("read") && (p.resource === "models" || p.resource === "api-keys" || p.resource === "playground") ? (
                        <Check className="mx-auto h-3.5 w-3.5 text-success" />
                      ) : (
                        <X className="mx-auto h-3.5 w-3.5 text-muted-foreground" />
                      )}
                    </td>
                    <td className="px-2 text-center">
                      {p.resource === "billing" ? (
                        <Check className="mx-auto h-3.5 w-3.5 text-success" />
                      ) : (
                        <X className="mx-auto h-3.5 w-3.5 text-muted-foreground" />
                      )}
                    </td>
                    <td className="pl-2 text-center">
                      {p.actions.includes("read") ? (
                        <Check className="mx-auto h-3.5 w-3.5 text-success" />
                      ) : (
                        <X className="mx-auto h-3.5 w-3.5 text-muted-foreground" />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
