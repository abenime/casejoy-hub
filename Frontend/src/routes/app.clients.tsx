import { createFileRoute } from "@tanstack/react-router";
import { Plus, Mail, Phone } from "lucide-react";
import { useApi } from "@/lib/use-api";
import { api } from "@/lib/api";
import { PageHeader } from "@/components/ui-shared";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export const Route = createFileRoute("/app/clients")({
  component: ClientsPage,
});

function ClientsPage() {
  const { data: clients, loading } = useApi(() => api.getClients(), []);

  return (
    <div>
      <PageHeader
        title="Clients"
        description="Manage client profiles, contacts, and history."
        actions={
          <Button>
            <Plus className="mr-2 h-4 w-4" /> Add client
          </Button>
        }
      />
      <div className="grid gap-4 p-6 md:grid-cols-2 xl:grid-cols-3">
        {loading && <p className="text-sm text-muted-foreground">Loading…</p>}
        {(clients ?? []).map((c: any) => (
          <div
            key={c.id}
            className="rounded-lg border border-border bg-card p-5 transition-shadow hover:shadow-sm"
          >
            <div className="flex items-start gap-3">
              <Avatar className="h-11 w-11">
                <AvatarFallback className="bg-primary text-primary-foreground text-sm font-semibold">
                  {c.name
                    .split(" ")
                    .map((n: string) => n[0])
                    .slice(0, 2)
                    .join("")}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-foreground">{c.name}</p>
                <p className="truncate text-xs text-muted-foreground">{c.company}</p>
              </div>
              <span className="rounded-md bg-secondary px-2 py-0.5 text-xs text-secondary-foreground">
                Since {new Date(c.since).getFullYear()}
              </span>
            </div>
            <div className="mt-4 space-y-1.5 text-xs text-muted-foreground">
              <p className="flex items-center gap-2">
                <Mail className="h-3.5 w-3.5" /> {c.email}
              </p>
              <p className="flex items-center gap-2">
                <Phone className="h-3.5 w-3.5" /> {c.phone}
              </p>
            </div>
            <div className="mt-4 flex items-center justify-between border-t border-border pt-3 text-sm">
              <div>
                <p className="text-xs text-muted-foreground">Active cases</p>
                <p className="font-semibold text-foreground">{c.activeCases}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Outstanding</p>
                <p
                  className={`font-semibold ${c.outstanding > 0 ? "text-destructive" : "text-foreground"}`}
                >
                  ${c.outstanding.toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
