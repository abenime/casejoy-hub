import { createFileRoute } from "@tanstack/react-router";
import { Plus, Download, CreditCard, Clock, FileText, CheckCircle2, Settings, Upload, Phone } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useApi } from "@/lib/use-api";
import { api } from "@/lib/api";
import { PageHeader, StatCard, statusColor } from "@/components/ui-shared";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState } from "react";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";

export const Route = createFileRoute("/app/billing")({
  component: BillingPage,
});

type InvoiceItem = {
  id: string;
  number: string;
  caseId: string;
  clientId: string | null;
  client: string;
  amount: number;
  issued: string;
  due: string;
  status: string;
};

// Mock time entries
const MOCK_TIME_ENTRIES = [
  {
    id: "t1",
    date: "2026-05-28",
    lawyer: "Marcus Hale",
    case: "Whitaker v. Northbridge",
    description: "Deposition preparation",
    hours: 3.5,
    rate: 450,
    billable: true,
    status: "unbilled",
  },
  {
    id: "t2",
    date: "2026-05-27",
    lawyer: "Eleanor Vance",
    case: "Martinez Estate Planning",
    description: "Drafting trust documents",
    hours: 2.0,
    rate: 350,
    billable: true,
    status: "billed",
  },
  {
    id: "t3",
    date: "2026-05-27",
    lawyer: "Marcus Hale",
    case: "Whitaker Patent Filing",
    description: "Client meeting",
    hours: 1.5,
    rate: 450,
    billable: true,
    status: "unbilled",
  },
  {
    id: "t4",
    date: "2026-05-26",
    lawyer: "Sofia Reyes",
    case: "Whitaker v. Northbridge",
    description: "Document review",
    hours: 4.0,
    rate: 250,
    billable: true,
    status: "unbilled",
  },
];

// Mock retainers
const MOCK_RETAINERS = [
  {
    id: "r1",
    client: "James Whitaker",
    case: "Whitaker v. Northbridge",
    amount: 25000,
    balance: 14500,
    status: "healthy",
  },
  {
    id: "r2",
    client: "Ana Martinez",
    case: "Martinez Estate Planning",
    amount: 5000,
    balance: 1200,
    status: "low",
  },
  {
    id: "r3",
    client: "TechFlow Inc.",
    case: "General Counsel",
    amount: 50000,
    balance: 42000,
    status: "healthy",
  },
];

// Payment Methods
export interface PaymentMethod {
  id: string;
  type: "tele_birr" | "commercial_bank" | "chapa";
  name: string;
  accountHolderName?: string;
  accountNumber?: string;
  phoneNumber?: string;
  merchantId?: string;
  apiKey?: string;
  isActive: boolean;
}

const MOCK_PAYMENT_METHODS: PaymentMethod[] = [
  {
    id: "pm1",
    type: "tele_birr",
    name: "Tele Birr",
    accountHolderName: "Vance & Hale Law Firm",
    phoneNumber: "+251911234567",
    merchantId: "",
    isActive: true,
  },
  {
    id: "pm2",
    type: "commercial_bank",
    name: "Commercial Bank of Ethiopia",
    accountHolderName: "Vance & Hale Law Firm",
    accountNumber: "1000123456789",
    isActive: true,
  },
  {
    id: "pm3",
    type: "chapa",
    name: "Chapa Payment Gateway",
    accountHolderName: "Vance & Hale Law Firm",
    apiKey: "CHAPA_TEST_API_KEY",
    isActive: true,
  },
];

function getInvoiceDetails(invoiceNumber: string) {
  return {
    purpose: "Legal services and associated expenses for the billing period.",
    items: [
      { description: "Initial Consultation & Case Strategy", hours: 2.0, rate: 350, amount: 700 },
      { description: "Document Drafting & Review", hours: 4.5, rate: 350, amount: 1575 },
      { description: "Court Filing Fees", hours: null, rate: null, amount: 250 },
    ],
  };
}

function BillingPage() {
  const { user, isClient } = useAuth();
  const { data: invoices, loading } = useApi(() => api.getInvoices(user!), [user?.id]);
  const { data: cases } = useApi(() => api.getCases(user!), [user?.id]);

  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [isTimeModalOpen, setIsTimeModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceItem | null>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isPaymentMethodModalOpen, setIsPaymentMethodModalOpen] = useState(false);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>(MOCK_PAYMENT_METHODS);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod | null>(null);
  const [editingPmId, setEditingPmId] = useState<string | null>(null);
  const [editPmDraft, setEditPmDraft] = useState<PaymentMethod | null>(null);
  const [paymentFormData, setPaymentFormData] = useState({
    screenshot: null as File | null,
    ftNumber: "",
    transactionRef: "",
  });

  const total = ((invoices as InvoiceItem[]) ?? []).reduce(
    (s: number, i: InvoiceItem) => s + i.amount,
    0,
  );
  const paid = ((invoices as InvoiceItem[]) ?? [])
    .filter((i: InvoiceItem) => i.status === "paid")
    .reduce((s: number, i: InvoiceItem) => s + i.amount, 0);
  const outstanding = total - paid;
  const overdue = ((invoices as InvoiceItem[]) ?? [])
    .filter((i: InvoiceItem) => i.status === "overdue")
    .reduce((s: number, i: InvoiceItem) => s + i.amount, 0);

  const handleCreateInvoice = () => {
    toast.success("Draft invoice created successfully.");
    setIsInvoiceModalOpen(false);
  };

  const handleLogTime = () => {
    toast.success("Time entry logged successfully.");
    setIsTimeModalOpen(false);
  };

  return (
    <div className="flex h-full flex-col bg-gradient-to-b from-background via-background to-secondary/10">
      <PageHeader
        title={isClient ? "Payments" : "Billing & Finance"}
        description={
          isClient
            ? "Pay invoices and view payment history."
            : "Time, invoices, and revenue tracking."
        }
        actions={
          !isClient ? (
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setIsPaymentMethodModalOpen(true)}>
                <Settings className="mr-2 h-4 w-4" /> Payment Methods
              </Button>
              <Button variant="outline" onClick={() => setIsTimeModalOpen(true)}>
                <Clock className="mr-2 h-4 w-4" /> Log Time
              </Button>
              <Button onClick={() => setIsInvoiceModalOpen(true)}>
                <Plus className="mr-2 h-4 w-4" /> New invoice
              </Button>
            </div>
          ) : (
            <Button>
              <CreditCard className="mr-2 h-4 w-4" /> Pay outstanding
            </Button>
          )
        }
      />
      <div className="flex-1 space-y-6 overflow-y-auto p-6">
        {!isClient && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Total billed (YTD)" value={`$${(total / 1000).toFixed(1)}k`} />
            <StatCard label="Collected (YTD)" value={`$${(paid / 1000).toFixed(1)}k`} />
            <StatCard label="Outstanding" value={`$${(outstanding / 1000).toFixed(1)}k`} />
            <StatCard label="Overdue" value={`$${(overdue / 1000).toFixed(1)}k`} />
          </div>
        )}

        <Tabs defaultValue="invoices" className="w-full">
          {!isClient && (
            <TabsList className="mb-4">
              <TabsTrigger value="invoices">Invoices</TabsTrigger>
              <TabsTrigger value="time">Time Tracking</TabsTrigger>
              <TabsTrigger value="retainers">Retainer Balances</TabsTrigger>
            </TabsList>
          )}

          <TabsContent value="invoices" className="mt-0">
            <div className="overflow-hidden rounded-lg border border-border bg-card shadow-md">
              <table className="w-full text-sm">
                <thead className="bg-gradient-to-r from-primary/10 via-transparent to-accent/10 text-xs uppercase tracking-wider text-muted-foreground border-b border-border">
                  <tr>
                    <th className="px-5 py-3 text-left font-semibold">Invoice</th>
                    {!isClient && <th className="px-5 py-3 text-left font-semibold">Client</th>}
                    <th className="px-5 py-3 text-left font-semibold">Issued</th>
                    <th className="px-5 py-3 text-left font-semibold">Due</th>
                    <th className="px-5 py-3 text-right font-semibold">Amount</th>
                    <th className="px-5 py-3 text-left font-semibold">Status</th>
                    <th className="px-5 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {loading && (
                    <tr>
                      <td colSpan={7} className="px-5 py-10 text-center text-muted-foreground">
                        Loading…
                      </td>
                    </tr>
                  )}
                  {(invoices ?? []).map((i: InvoiceItem) => (
                    <tr
                      key={i.id}
                      className="transition-colors hover:bg-secondary/40 cursor-pointer"
                      onClick={() => setSelectedInvoice(i)}
                    >
                      <td className="px-5 py-3.5 font-mono text-xs text-foreground flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        {i.number}
                      </td>
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
                          <Button size="sm" onClick={(e) => { e.stopPropagation(); toast.success("Processing payment..."); }}>Pay</Button>
                        ) : (
                          <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); toast.success("Downloading PDF..."); }}>
                            <Download className="h-4 w-4" />
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </TabsContent>

          {!isClient && (
            <>
              <TabsContent value="time" className="mt-0">
                <div className="overflow-hidden rounded-lg border border-border bg-card">
                  <table className="w-full text-sm">
                    <thead className="bg-secondary/60 text-xs uppercase tracking-wider text-muted-foreground">
                      <tr>
                        <th className="px-5 py-3 text-left font-medium">Date</th>
                        <th className="px-5 py-3 text-left font-medium">Lawyer</th>
                        <th className="px-5 py-3 text-left font-medium">Case</th>
                        <th className="px-5 py-3 text-left font-medium">Description</th>
                        <th className="px-5 py-3 text-right font-medium">Hours</th>
                        <th className="px-5 py-3 text-right font-medium">Amount</th>
                        <th className="px-5 py-3 text-left font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {MOCK_TIME_ENTRIES.map((t) => (
                        <tr key={t.id} className="transition-colors hover:bg-secondary/40">
                          <td className="px-5 py-3.5 text-muted-foreground">{t.date}</td>
                          <td className="px-5 py-3.5 font-medium">{t.lawyer}</td>
                          <td className="px-5 py-3.5 text-foreground">{t.case}</td>
                          <td
                            className="max-w-50 truncate px-5 py-3.5 text-muted-foreground"
                            title={t.description}
                          >
                            {t.description}
                          </td>
                          <td className="px-5 py-3.5 text-right font-medium tabular-nums">
                            {t.hours}
                          </td>
                          <td className="px-5 py-3.5 text-right tabular-nums text-muted-foreground">
                            ${(t.hours * t.rate).toLocaleString()}
                          </td>
                          <td className="px-5 py-3.5">
                            <Badge
                              variant={t.status === "billed" ? "secondary" : "outline"}
                              className="capitalize"
                            >
                              {t.status}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </TabsContent>

              <TabsContent value="retainers" className="mt-0">
                <div className="overflow-hidden rounded-lg border border-border bg-card">
                  <table className="w-full text-sm">
                    <thead className="bg-secondary/60 text-xs uppercase tracking-wider text-muted-foreground">
                      <tr>
                        <th className="px-5 py-3 text-left font-medium">Client</th>
                        <th className="px-5 py-3 text-left font-medium">Case</th>
                        <th className="px-5 py-3 text-right font-medium">Total Amount</th>
                        <th className="px-5 py-3 text-right font-medium">Remaining Balance</th>
                        <th className="px-5 py-3 text-left font-medium">Status</th>
                        <th className="px-5 py-3"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {MOCK_RETAINERS.map((r) => (
                        <tr key={r.id} className="transition-colors hover:bg-secondary/40">
                          <td className="px-5 py-3.5 font-medium">{r.client}</td>
                          <td className="px-5 py-3.5 text-foreground">{r.case}</td>
                          <td className="px-5 py-3.5 text-right tabular-nums text-muted-foreground">
                            ${r.amount.toLocaleString()}
                          </td>
                          <td className="px-5 py-3.5 text-right font-semibold tabular-nums text-foreground">
                            ${r.balance.toLocaleString()}
                          </td>
                          <td className="px-5 py-3.5">
                            {r.status === "low" ? (
                              <Badge
                                variant="outline"
                                className="border-destructive/30 text-destructive capitalize"
                              >
                                Low Balance
                              </Badge>
                            ) : (
                              <Badge
                                variant="outline"
                                className="border-success/30 text-success capitalize"
                              >
                                Healthy
                              </Badge>
                            )}
                          </td>
                          <td className="px-5 py-3.5 text-right">
                            <Button size="sm" variant="secondary">
                              Request Replenishment
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </TabsContent>
            </>
          )}
        </Tabs>
      </div>

      {/* Log Time Modal */}
      <Dialog open={isTimeModalOpen} onOpenChange={setIsTimeModalOpen}>
        <DialogContent className="border-border bg-card/95 backdrop-blur-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" /> Log Billable Time
            </DialogTitle>
            <DialogDescription>Record time spent on a case for billing purposes.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Case / Matter</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select a case..." />
                </SelectTrigger>
                <SelectContent>
                  {((cases as { id: string; title: string }[]) ?? []).map(
                    (c: { id: string; title: string }) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.title}
                      </SelectItem>
                    ),
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Date</Label>
                <Input type="date" defaultValue={new Date().toISOString().split("T")[0]} />
              </div>
              <div className="grid gap-2">
                <Label>Hours</Label>
                <Input type="number" step="0.1" placeholder="e.g. 1.5" />
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Description</Label>
              <Textarea placeholder="Detailed description of work performed..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsTimeModalOpen(false)}>
              Cancel
            </Button>
            <Button 
              className="bg-gradient-to-r from-primary to-primary/80"
              onClick={handleLogTime}
            >
              Save Time Entry
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Invoice Modal */}
      <Dialog open={isInvoiceModalOpen} onOpenChange={setIsInvoiceModalOpen}>
        <DialogContent className="sm:max-w-[600px] border-border bg-card/95 backdrop-blur-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" /> Generate Invoice
            </DialogTitle>
            <DialogDescription>
              Create a new invoice from unbilled time and expenses.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Client / Case</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select a case..." />
                </SelectTrigger>
                <SelectContent>
                  {((cases as { id: string; title: string }[]) ?? []).map(
                    (c: { id: string; title: string }) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.title}
                      </SelectItem>
                    ),
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="mt-2 rounded-lg border border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5 p-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-semibold text-foreground">Unbilled Time</span>
                <span className="text-sm font-bold text-primary">12.5 hrs</span>
              </div>
              <div className="flex justify-between items-center mb-4">
                <span className="text-sm font-semibold text-foreground">Unbilled Expenses</span>
                <span className="text-sm font-bold text-primary">$450.00</span>
              </div>
              <div className="border-t border-primary/20 pt-2 flex justify-between items-center">
                <span className="text-sm font-semibold text-foreground">Total Draft Amount</span>
                <span className="text-lg font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">$4,825.00</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Issue Date</Label>
                <Input type="date" defaultValue={new Date().toISOString().split("T")[0]} />
              </div>
              <div className="grid gap-2">
                <Label>Due Date</Label>
                <Input
                  type="date"
                  defaultValue={
                    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
                  }
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsInvoiceModalOpen(false)}>
              Cancel
            </Button>
            <Button 
              className="bg-gradient-to-r from-primary to-primary/80"
              onClick={handleCreateInvoice}
            >
              Generate Draft
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Invoice Detail Modal */}
      <Dialog open={!!selectedInvoice} onOpenChange={(open) => { if (!open) setSelectedInvoice(null); }}>
        <DialogContent className="sm:max-w-[600px] border-border bg-card/95 backdrop-blur-md">
          {selectedInvoice && (() => {
            const details = getInvoiceDetails(selectedInvoice.number);
            return (
              <>
                <DialogHeader>
                  <div className="flex items-center justify-between mt-2">
                    <DialogTitle className="text-xl">Invoice {selectedInvoice.number}</DialogTitle>
                    <Badge variant="outline" className={`capitalize ${statusColor(selectedInvoice.status)}`}>
                      {selectedInvoice.status}
                    </Badge>
                  </div>
                  <DialogDescription>
                    {selectedInvoice.client} &middot; Billed for services
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-6 py-4">
                  <div className="flex justify-between text-sm">
                    <div>
                      <p className="font-medium text-foreground">Issue Date</p>
                      <p className="text-muted-foreground">{selectedInvoice.issued}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-foreground">Due Date</p>
                      <p className="text-muted-foreground">{selectedInvoice.due}</p>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-semibold text-foreground mb-2">Statement of Services</h4>
                    <p className="text-sm text-muted-foreground mb-4">{details.purpose}</p>
                    
                    <div className="rounded-md border border-border bg-secondary/20 overflow-hidden">
                      <table className="w-full text-sm">
                        <thead className="bg-gradient-to-r from-primary/10 to-accent/10 text-xs text-muted-foreground uppercase border-b border-border">
                          <tr>
                            <th className="px-4 py-2 text-left font-semibold">Description</th>
                            <th className="px-4 py-2 text-right font-semibold">Hrs</th>
                            <th className="px-4 py-2 text-right font-semibold">Rate</th>
                            <th className="px-4 py-2 text-right font-semibold">Amount</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          {details.items.map((item, idx) => (
                            <tr key={idx}>
                              <td className="px-4 py-2 text-foreground">{item.description}</td>
                              <td className="px-4 py-2 text-right text-muted-foreground">{item.hours ?? "—"}</td>
                              <td className="px-4 py-2 text-right text-muted-foreground">{item.rate ? `$${item.rate}` : "—"}</td>
                              <td className="px-4 py-2 text-right font-medium text-foreground">${item.amount.toLocaleString()}</td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot className="bg-primary/5 border-t border-border">
                          <tr>
                            <td colSpan={3} className="px-4 py-3 text-right font-semibold text-foreground">Total</td>
                            <td className="px-4 py-3 text-right font-bold text-primary">${selectedInvoice.amount.toLocaleString()}</td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>
                </div>

                <DialogFooter className="flex justify-end gap-2">
                  {isClient && selectedInvoice.status !== "paid" ? (
                    <Button 
                      onClick={() => { 
                        setIsPaymentModalOpen(true);
                        setSelectedPaymentMethod(paymentMethods.find(pm => pm.isActive) || null);
                      }}
                      className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
                    >
                      <CreditCard className="mr-2 h-4 w-4" /> Pay Now
                    </Button>
                  ) : (
                    <Button variant="outline" onClick={() => { toast.success("Downloading PDF..."); setSelectedInvoice(null); }}>
                      <Download className="mr-2 h-4 w-4" /> Download PDF
                    </Button>
                  )}
                  <Button variant="ghost" onClick={() => setSelectedInvoice(null)}>Close</Button>
                </DialogFooter>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* Payment Methods Management Dialog (Admin) */}
      <Dialog open={isPaymentMethodModalOpen} onOpenChange={setIsPaymentMethodModalOpen}>
        <DialogContent className="sm:max-w-[600px] border-border bg-card/95 backdrop-blur-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-primary" /> Payment Methods
            </DialogTitle>
            <DialogDescription>
              Configure payment methods for clients
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {paymentMethods.map((pm) => (
              <div key={pm.id} className="rounded-lg border border-border bg-secondary/30 p-4 space-y-3">
                {editingPmId === pm.id && editPmDraft ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-foreground">Edit {pm.name}</h4>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label>Display Name</Label>
                        <Input 
                          value={editPmDraft.name} 
                          onChange={(e) => setEditPmDraft({...editPmDraft, name: e.target.value})} 
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Account Holder Name</Label>
                        <Input 
                          value={editPmDraft.accountHolderName || ""} 
                          onChange={(e) => setEditPmDraft({...editPmDraft, accountHolderName: e.target.value})} 
                          placeholder="Legal Firm Name"
                        />
                      </div>
                    </div>
                    {pm.type === "tele_birr" && (
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <Label>Phone Number</Label>
                          <Input 
                            value={editPmDraft.phoneNumber || ""} 
                            disabled={!!editPmDraft.merchantId}
                            onChange={(e) => setEditPmDraft({...editPmDraft, phoneNumber: e.target.value})} 
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Merchant ID</Label>
                          <Input 
                            value={editPmDraft.merchantId || ""} 
                            disabled={!!editPmDraft.phoneNumber}
                            onChange={(e) => setEditPmDraft({...editPmDraft, merchantId: e.target.value})} 
                          />
                        </div>
                      </div>
                    )}
                    {pm.type === "commercial_bank" && (
                      <div className="space-y-2">
                        <Label>Account Number</Label>
                        <Input 
                          value={editPmDraft.accountNumber || ""} 
                          onChange={(e) => setEditPmDraft({...editPmDraft, accountNumber: e.target.value})} 
                        />
                      </div>
                    )}
                    {pm.type === "chapa" && (
                      <div className="space-y-2">
                        <Label>API Key</Label>
                        <Input 
                          value={editPmDraft.apiKey || ""} 
                          type="password"
                          onChange={(e) => setEditPmDraft({...editPmDraft, apiKey: e.target.value})} 
                        />
                      </div>
                    )}
                    <div className="flex justify-end gap-2 pt-2">
                      <Button size="sm" variant="outline" onClick={() => {
                        setEditingPmId(null);
                        setEditPmDraft(null);
                      }}>Cancel</Button>
                      <Button size="sm" onClick={() => {
                        setPaymentMethods(paymentMethods.map(p => p.id === editPmDraft.id ? editPmDraft : p));
                        setEditingPmId(null);
                        setEditPmDraft(null);
                        toast.success("Payment method updated");
                      }}>Save</Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 flex-1">
                        <Checkbox 
                          checked={pm.isActive}
                          onCheckedChange={() => {
                            setPaymentMethods(paymentMethods.map(p => 
                              p.id === pm.id ? { ...p, isActive: !p.isActive } : p
                            ));
                          }}
                        />
                        <div>
                          <p className="font-semibold text-foreground">{pm.name}</p>
                          <p className="text-xs text-muted-foreground capitalize">{pm.type.replace('_', ' ')}</p>
                        </div>
                      </div>
                      <Button size="sm" variant="outline" onClick={() => {
                        setEditingPmId(pm.id);
                        setEditPmDraft({ ...pm });
                      }}>Edit</Button>
                    </div>
                    
                    {pm.type === "tele_birr" && (
                      <div className="grid grid-cols-2 gap-3 ml-8 pt-2 border-t border-border">
                        <div className="text-sm">
                          <p className="text-xs text-muted-foreground">Account Holder</p>
                          <p className="font-medium text-foreground">{pm.accountHolderName || "—"}</p>
                        </div>
                        <div className="text-sm">
                          <p className="text-xs text-muted-foreground">{pm.phoneNumber ? "Phone Number" : "Merchant ID"}</p>
                          <p className="font-medium text-foreground">{pm.phoneNumber || pm.merchantId || "—"}</p>
                        </div>
                      </div>
                    )}
                    
                    {pm.type === "commercial_bank" && (
                      <div className="grid grid-cols-2 gap-3 ml-8 pt-2 border-t border-border">
                        <div className="text-sm">
                          <p className="text-xs text-muted-foreground">Account Holder</p>
                          <p className="font-medium text-foreground">{pm.accountHolderName || "—"}</p>
                        </div>
                        <div className="text-sm">
                          <p className="text-xs text-muted-foreground">Account Number</p>
                          <p className="font-medium text-foreground">{pm.accountNumber || "—"}</p>
                        </div>
                      </div>
                    )}
                    
                    {pm.type === "chapa" && (
                      <div className="grid grid-cols-2 gap-3 ml-8 pt-2 border-t border-border">
                        <div className="text-sm">
                          <p className="text-xs text-muted-foreground">Account Holder</p>
                          <p className="font-medium text-foreground">{pm.accountHolderName || "—"}</p>
                        </div>
                        <div className="text-sm">
                          <p className="text-xs text-muted-foreground">API Key</p>
                          <p className="font-medium text-foreground font-mono text-xs">{pm.apiKey ? `${pm.apiKey.substring(0, 20)}...` : "—"}</p>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            ))}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPaymentMethodModalOpen(false)}>
              Close
            </Button>
            <Button 
              className="bg-gradient-to-r from-primary to-primary/80"
              onClick={() => {
                toast.success("Payment methods updated");
                setIsPaymentMethodModalOpen(false);
              }}
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Payment Processing Dialog (Client) */}
      <Dialog open={isPaymentModalOpen} onOpenChange={setIsPaymentModalOpen}>
        <DialogContent className="sm:max-w-[600px] border-border bg-card/95 backdrop-blur-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-primary" /> Select Payment Method
            </DialogTitle>
            <DialogDescription>
              Choose how you'd like to pay ${selectedInvoice?.amount.toLocaleString()} for invoice {selectedInvoice?.number}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-4">
            {paymentMethods.filter(pm => pm.isActive).map((pm) => (
              <button
                key={pm.id}
                onClick={() => setSelectedPaymentMethod(pm)}
                className={`w-full rounded-lg border-2 p-4 text-left transition-all ${
                  selectedPaymentMethod?.id === pm.id
                    ? "border-primary bg-primary/10"
                    : "border-border hover:border-primary/50 bg-secondary/20"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-foreground">{pm.name}</p>
                    <p className="text-xs text-muted-foreground capitalize">{pm.type.replace('_', ' ')}</p>
                  </div>
                  <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center ${
                    selectedPaymentMethod?.id === pm.id ? "border-primary bg-primary" : "border-border"
                  }`}>
                    {selectedPaymentMethod?.id === pm.id && <div className="h-2 w-2 bg-primary-foreground rounded-full" />}
                  </div>
                </div>
              </button>
            ))}
          </div>

          {selectedPaymentMethod && (
            <div className="space-y-4 py-4 border-t border-border">
              {selectedPaymentMethod.type === "tele_birr" && (
                <>
                  <div className="rounded-lg bg-accent/10 border border-accent/20 p-4">
                    <p className="text-sm font-semibold text-foreground mb-2">Send payment to {selectedPaymentMethod.name}:</p>
                    {selectedPaymentMethod.accountHolderName && (
                      <p className="text-sm font-medium text-foreground mb-1">{selectedPaymentMethod.accountHolderName}</p>
                    )}
                    {selectedPaymentMethod.phoneNumber && (
                      <p className="text-lg font-bold text-primary flex items-center gap-2">
                        <Phone className="h-5 w-5" /> {selectedPaymentMethod.phoneNumber}
                      </p>
                    )}
                    {selectedPaymentMethod.merchantId && (
                      <p className="text-sm text-foreground mt-1">Merchant ID: <span className="font-bold">{selectedPaymentMethod.merchantId}</span></p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ftRef">Enter FT Number from your Tele Birr receipt</Label>
                    <Input
                      id="ftRef"
                      placeholder="e.g., FT123456789"
                      value={paymentFormData.ftNumber}
                      onChange={(e) => setPaymentFormData({ ...paymentFormData, ftNumber: e.target.value })}
                    />
                  </div>
                </>
              )}

              {selectedPaymentMethod.type === "commercial_bank" && (
                <>
                  <div className="rounded-lg bg-accent/10 border border-accent/20 p-4">
                    <p className="text-sm font-semibold text-foreground mb-2">Send payment to {selectedPaymentMethod.name}:</p>
                    {selectedPaymentMethod.accountHolderName && (
                      <p className="text-sm font-medium text-foreground mb-1">{selectedPaymentMethod.accountHolderName}</p>
                    )}
                    <p className="text-lg font-bold text-primary">{selectedPaymentMethod.accountNumber}</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bankFtRef">Enter FT Number from your bank receipt</Label>
                    <Input
                      id="bankFtRef"
                      placeholder="e.g., FT123456789"
                      value={paymentFormData.ftNumber}
                      onChange={(e) => setPaymentFormData({ ...paymentFormData, ftNumber: e.target.value })}
                    />
                  </div>
                </>
              )}

              {selectedPaymentMethod.type === "chapa" && (
                <>
                  <div className="rounded-lg bg-accent/10 border border-accent/20 p-4 text-center">
                    <p className="text-sm font-semibold text-foreground mb-2">Pay via Chapa Secure Gateway</p>
                    <p className="text-xs text-muted-foreground">You will be redirected securely to Chapa to complete this transaction.</p>
                  </div>
                </>
              )}

              {selectedPaymentMethod.type !== "chapa" && (
                <div className="space-y-2">
                  <Label htmlFor="screenshot" className="flex items-center gap-2">
                    <Upload className="h-4 w-4" /> Upload Payment Proof (Screenshot)
                  </Label>
                  <Input
                    id="screenshot"
                    type="file"
                    accept="image/*"
                    onChange={(e) => setPaymentFormData({ 
                      ...paymentFormData, 
                      screenshot: e.target.files?.[0] || null 
                    })}
                    className="cursor-pointer"
                  />
                  {paymentFormData.screenshot && (
                    <p className="text-xs text-success flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" /> {paymentFormData.screenshot.name}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={() => setIsPaymentModalOpen(false)}>
              Cancel
            </Button>
            <Button 
              disabled={
                !selectedPaymentMethod || 
                (selectedPaymentMethod.type !== "chapa" && (!paymentFormData.ftNumber || !paymentFormData.screenshot))
              }
              className="bg-gradient-to-r from-success to-success/80 hover:from-success/90 hover:to-success/70"
              onClick={() => {
                if (selectedPaymentMethod?.type === "chapa") {
                  toast.success("Redirecting to Chapa...");
                } else {
                  toast.success("Payment submitted successfully! We'll verify and update your invoice soon.");
                }
                setIsPaymentModalOpen(false);
                setSelectedInvoice(null);
                setPaymentFormData({ screenshot: null, ftNumber: "", transactionRef: "" });
              }}
            >
              {selectedPaymentMethod?.type === "chapa" ? "Proceed to Chapa" : "Submit Payment"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
