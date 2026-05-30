import { createFileRoute } from "@tanstack/react-router";
import { Plus, Gavel, Users as UsersIcon, AlertCircle } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useApi } from "@/lib/use-api";
import { api } from "@/lib/api";
import { PageHeader } from "@/components/ui-shared";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/app/calendar")({
  component: CalendarPage,
});

const TYPE_META: Record<string, { icon: any; cls: string; label: string }> = {
  court: { icon: Gavel, cls: "bg-chart-3/10 text-chart-3 border-chart-3/20", label: "Court" },
  meeting: { icon: UsersIcon, cls: "bg-accent/10 text-accent border-accent/20", label: "Meeting" },
  deadline: { icon: AlertCircle, cls: "bg-destructive/10 text-destructive border-destructive/20", label: "Deadline" },
};

function CalendarPage() {
  const { user, isClient } = useAuth();
  const { data: events, loading } = useApi(() => api.getEvents(user!), [user?.id]);

  const grouped = (events ?? []).reduce<Record<string, typeof events>>((acc, e) => {
    (acc[e.date] ||= [] as any).push(e);
    return acc;
  }, {});

  return (
    <div>
      <PageHeader
        title={isClient ? "Your schedule" : "Calendar"}
        description={isClient ? "Court dates, meetings, and deadlines for your matters." : "Firm-wide schedule across all cases."}
        actions={
          !isClient && (
            <Button>
              <Plus className="mr-2 h-4 w-4" /> New event
            </Button>
          )
        }
      />
      <div className="space-y-4 p-6">
        {loading && <p className="text-sm text-muted-foreground">Loading…</p>}
        {Object.entries(grouped).map(([date, evs]) => (
          <div key={date} className="rounded-lg border border-border bg-card">
            <div className="border-b border-border bg-secondary/40 px-5 py-3">
              <p className="text-sm font-semibold text-foreground">
                {new Date(date).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
              </p>
            </div>
            <div className="divide-y divide-border">
              {(evs ?? []).map((e) => {
                const meta = TYPE_META[e.type] ?? TYPE_META.meeting;
                const Icon = meta.icon;
                return (
                  <div key={e.id} className="flex items-center gap-4 px-5 py-3.5">
                    <span className="w-16 text-sm font-medium tabular-nums text-foreground">{e.time}</span>
                    <div className={`flex h-9 w-9 items-center justify-center rounded-md border ${meta.cls}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">{e.title}</p>
                      <p className="text-xs text-muted-foreground">{meta.label}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
