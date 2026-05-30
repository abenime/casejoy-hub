import { createFileRoute } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth-context";
import { useApi } from "@/lib/use-api";
import { api } from "@/lib/api";
import { PageHeader } from "@/components/ui-shared";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/app/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  const { user } = useAuth();
  const { data: staff } = useApi(() => api.getStaff(), []);

  if (user?.role !== "admin") {
    return (
      <div>
        <PageHeader title="Settings" />
        <div className="p-6">
          <div className="rounded-lg border border-border bg-card p-8 text-center">
            <p className="text-sm text-muted-foreground">Admin access required.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Settings" description="Firm profile, team, and configuration." />
      <div className="space-y-6 p-6">
        {/* Firm profile */}
        <div className="rounded-lg border border-border bg-card p-6">
          <h2 className="text-sm font-semibold text-foreground">Firm profile</h2>
          <p className="mt-1 text-xs text-muted-foreground">Branding visible to clients in the portal.</p>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Firm name</Label>
              <Input defaultValue="Vance & Hale LLP" />
            </div>
            <div className="space-y-2">
              <Label>Custom domain</Label>
              <Input defaultValue="clients.vancehale.law" />
            </div>
            <div className="space-y-2">
              <Label>Primary color</Label>
              <Input defaultValue="#1f2a4d" />
            </div>
            <div className="space-y-2">
              <Label>Accent color</Label>
              <Input defaultValue="#c89a3c" />
            </div>
          </div>
          <div className="mt-5 flex justify-end">
            <Button>Save changes</Button>
          </div>
        </div>

        {/* Team */}
        <div className="rounded-lg border border-border bg-card">
          <div className="flex items-center justify-between border-b border-border px-6 py-4">
            <div>
              <h2 className="text-sm font-semibold text-foreground">Team & permissions</h2>
              <p className="mt-0.5 text-xs text-muted-foreground">Manage roles for lawyers, paralegals, and staff.</p>
            </div>
            <Button>Invite member</Button>
          </div>
          <div className="divide-y divide-border">
            {(staff ?? []).map((s) => (
              <div key={s.id} className="flex items-center gap-4 px-6 py-4">
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">
                    {s.avatar}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">{s.name}</p>
                  <p className="text-xs text-muted-foreground">{s.email}</p>
                </div>
                <Badge variant="outline" className="capitalize">{s.role}</Badge>
                <span className="text-sm text-muted-foreground">{s.title}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
