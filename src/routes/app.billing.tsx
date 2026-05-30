import { createFileRoute } from "@tanstack/react-router";
import { Plus, Download, CreditCard } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useApi } from "@/lib/use-api";
import { api } from "@/lib/api";
import { PageHeader, StatCard, statusColor } from "@/components/ui-shared";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/app/billing")({
  component: BillingPage,
});

function BillingPage() {
  const { user, isClient } = useAuth();
  const { data: invoices, loading } = useApi(() => api.getInvoices(user!), [user?.id]);

  const total = (invoices ?? []).reduce((s, i) => s + i.amount, 0);
  const paid = (invoices ?? []).filter((i) => i.status === "paid").reduce((s, i) => s + i.amount, 0);
  const outstanding = total - paid;
  const overdue = (invoices ?? []).filter((i) => i.status === "overdue").reduce((s, i) => s + i.amount, 0);

  return (
    <div>
      <PageHeader
        title={isClient ? "Payments" : "Billing & Finance"}
        description={isClient ? "Pay invoices and view payment history." : "Time, invoices, and revenue tracking."}
        actions={
          !isClient ? (
            <Button><Plus className="mr-2 h-4 w-4" /> New invoice</Button>
          ) : (
            <Button><CreditCard className="mr-2 h-4 w-4" /> Pay outstanding</Button>
          )
        }
      />
      <div className="space-y-6 p-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Total billed" value={`$${(total / 1000).toFixed(1)}k`} />
          <StatCard label="Collected" value={`$${(paid / 1000).toFixed(1)}k`} />
          <StatCard label="Outstanding" value={`$${(outstanding / 1000).toFixed(1)}k`} />
          <StatCard label="Overdue" value={`$${(overdue / 1000).toFixed(1)}k`} />
        </div>

        <div className="overflow-hidden rounded-lg border border-border bg-card">
          <table className="w-full text-sm">
            <thead className="bg-secondary/60 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-5 py-3 text-left font-medium">Invoice</th>
                {!isClient && <th className="px-5 py-3 text-left font-medium">Client</th>}
                <th className="px-5 py-3 text-left font-medium">Issued</th>
                <th className="px-5 py-3 text-left font-medium">Due</th>
                <th className="px-5 py-3 text-right font-medium">Amount</th>
                <th className="px-5 py-3 text-left font-medium">Status</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading && (
                <tr><td colSpan={7} className="px-5 py-10 text-center text-muted-foreground">Loading…</td></tr>
              )}
              {(invoices ?? []).map((i: any) => (
                <tr key={i.id} className="transition-colors hover:bg-secondary/40">
                  <td className="px-5 py-3.5 font-mono text-xs text-foreground">{i.number}</td>
                  {!isClient && <td className="px-5 py-3.5 text-foreground">{i.client}</td>}
                  <td className="px-5 py-3.5 text-muted-foreground">{i.issued}</td>
                  <td className="px-5 py-3.5 text-muted-foreground">{i.due}</td>
                  <td className="px-5 py-3.5 text-right font-semibold tabular-nums text-foreground">
                    ${i.amount.toLocaleString()}
                  </td>
                  <td className="px-5 py-3.5">
                    <Badge variant="outline" className={`capitalize ${statusColor(i.status)}`}>
                      {i.status}
                    </Badge>
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    {isClient && i.status !== "paid" ? (
                      <Button size="sm">Pay</Button>
                    ) : (
                      <Button variant="ghost" size="icon"><Download className="h-4 w-4" /></Button>
                    )}
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
