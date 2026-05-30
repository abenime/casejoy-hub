import { createFileRoute } from "@tanstack/react-router";
import { Plus, Filter } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useApi } from "@/lib/use-api";
import { api } from "@/lib/api";
import { PageHeader, statusColor } from "@/components/ui-shared";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/app/cases")({
  component: CasesPage,
});

function CasesPage() {
  const { user, isClient } = useAuth();
  const { data: cases, loading } = useApi(() => api.getCases(user!), [user?.id]);

  return (
    <div>
      <PageHeader
        title={isClient ? "Your matters" : "Cases"}
        description={
          isClient ? "Every matter your firm is handling for you." : "All matters across the firm."
        }
        actions={
          !isClient && (
            <>
              <Button variant="outline">
                <Filter className="mr-2 h-4 w-4" /> Filter
              </Button>
              <Button>
                <Plus className="mr-2 h-4 w-4" /> New case
              </Button>
            </>
          )
        }
      />
      <div className="p-6">
        <div className="overflow-hidden rounded-lg border border-border bg-card">
          <table className="w-full text-sm">
            <thead className="bg-secondary/60 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-5 py-3 text-left font-medium">Case number</th>
                <th className="px-5 py-3 text-left font-medium">Title</th>
                {!isClient && <th className="px-5 py-3 text-left font-medium">Client</th>}
                <th className="px-5 py-3 text-left font-medium">Practice</th>
                <th className="px-5 py-3 text-left font-medium">Stage</th>
                <th className="px-5 py-3 text-left font-medium">Lead</th>
                <th className="px-5 py-3 text-left font-medium">Deadline</th>
                <th className="px-5 py-3 text-left font-medium">Priority</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading && (
                <tr>
                  <td colSpan={8} className="px-5 py-10 text-center text-muted-foreground">
                    Loading…
                  </td>
                </tr>
              )}
              {(cases ?? []).map((c) => (
                <tr key={c.id} className="transition-colors hover:bg-secondary/40">
                  <td className="px-5 py-3.5 font-mono text-xs text-muted-foreground">
                    {c.number}
                  </td>
                  <td className="px-5 py-3.5 font-medium text-foreground">{c.title}</td>
                  {!isClient && <td className="px-5 py-3.5 text-foreground">{c.client}</td>}
                  <td className="px-5 py-3.5 text-muted-foreground">{c.practice}</td>
                  <td className="px-5 py-3.5">
                    <Badge variant="outline" className={statusColor(c.status)}>
                      {c.stage}
                    </Badge>
                  </td>
                  <td className="px-5 py-3.5 text-muted-foreground">{c.lead}</td>
                  <td className="px-5 py-3.5 text-foreground">{c.nextDeadline ?? "—"}</td>
                  <td className="px-5 py-3.5">
                    <Badge variant="outline" className={statusColor(c.priority)}>
                      {c.priority}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
