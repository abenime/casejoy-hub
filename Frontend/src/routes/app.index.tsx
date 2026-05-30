import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  Briefcase,
  DollarSign,
  Users,
  Clock,
  TrendingUp,
  CheckCircle2,
  FileText,
  Calendar as CalendarIcon,
  ArrowUpRight,
  UploadCloud,
  CheckCircle,
  FileIcon,
  X,
  CreditCard
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useApi } from "@/lib/use-api";
import { api } from "@/lib/api";
import { PageHeader, StatCard, statusColor } from "@/components/ui-shared";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const Route = createFileRoute("/app/")({
  component: Dashboard,
});

function Dashboard() {
  const { user, isClient } = useAuth();
  return isClient ? <ClientDashboard /> : <FirmDashboard user={user!} />;
}

function FirmDashboard({ user }: { user: { name: string } }) {
  const { data: analytics } = useApi(() => api.getAnalytics(), []);
  const { data: cases } = useApi(() => api.getCases(user as any), []);
  const { data: tasks } = useApi(() => api.getTasks(user as any), []);
  const { data: events } = useApi(() => api.getEvents(user as any), []);

  const activeCases = cases?.filter((c) => c.status === "active").length ?? 0;
  const openTasks = tasks?.filter((t) => t.status !== "done").length ?? 0;
  const upcoming = (events ?? []).slice(0, 4);
  const recentCases = (cases ?? []).filter((c) => c.status === "active").slice(0, 5);

  return (
    <div>
      <PageHeader
        title={`Good morning, ${user.name.split(" ")[0]}`}
        description="Here's what's happening across the firm today."
      />
      <div className="space-y-6 p-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Revenue (MTD)"
            value={analytics ? `$${(analytics.revenue.thisMonth / 1000).toFixed(1)}k` : "—"}
            icon={DollarSign}
            trend={{ value: `+${analytics?.revenue.growth ?? 0}%`, positive: true }}
            hint="vs last month"
          />
          <StatCard
            label="Active cases"
            value={String(activeCases)}
            icon={Briefcase}
            hint="across practice areas"
          />
          <StatCard
            label="Open tasks"
            value={String(openTasks)}
            icon={CheckCircle2}
            hint="assigned to team"
          />
          <StatCard
            label="Win rate"
            value={analytics ? `${analytics.cases.winRate}%` : "—"}
            icon={TrendingUp}
            hint={`${analytics?.cases.closedYtd ?? 0} closed YTD`}
          />
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Active cases */}
          <div className="rounded-lg border border-border bg-card lg:col-span-2">
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <h2 className="text-sm font-semibold text-foreground">Active cases</h2>
              <Link to="/app/cases" className="text-xs font-medium text-accent hover:underline">
                View all
              </Link>
            </div>
            <div className="divide-y divide-border">
              {recentCases.map((c) => (
                <div key={c.id} className="flex items-center justify-between px-5 py-3.5">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-medium text-foreground">{c.title}</p>
                      <Badge variant="outline" className={statusColor(c.priority)}>
                        {c.priority}
                      </Badge>
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {c.number} · {c.practice} · Lead: {c.lead}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-xs text-muted-foreground">Next deadline</p>
                    <p className="text-sm font-medium text-foreground">{c.nextDeadline ?? "—"}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Upcoming */}
          <div className="rounded-lg border border-border bg-card">
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <h2 className="text-sm font-semibold text-foreground">Upcoming</h2>
              <Link to="/app/calendar" className="text-xs font-medium text-accent hover:underline">
                Calendar
              </Link>
            </div>
            <div className="divide-y divide-border">
              {upcoming.map((e) => (
                <div key={e.id} className="flex items-start gap-3 px-5 py-3.5">
                  <div className="flex h-10 w-10 shrink-0 flex-col items-center justify-center rounded-md bg-secondary text-primary">
                    <CalendarIcon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground">{e.title}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {e.date} · {e.time} · <span className="capitalize">{e.type}</span>
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Team productivity */}
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-lg border border-border bg-card p-5">
            <h2 className="text-sm font-semibold text-foreground">
              Team productivity (billable hrs)
            </h2>
            <div className="mt-4 space-y-4">
              {(analytics?.lawyerProductivity ?? []).map((l) => {
                const pct = Math.min(100, (l.billable / l.target) * 100);
                const over = l.billable >= l.target;
                return (
                  <div key={l.name}>
                    <div className="mb-1.5 flex items-center justify-between text-sm">
                      <span className="font-medium text-foreground">{l.name}</span>
                      <span className="text-muted-foreground">
                        {l.billable} / {l.target} hrs
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-secondary">
                      <div
                        className={`h-full rounded-full ${over ? "bg-success" : "bg-accent"}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="rounded-lg border border-border bg-card p-5">
            <h2 className="text-sm font-semibold text-foreground">Practice area mix</h2>
            <div className="mt-4 space-y-2.5">
              {(analytics?.practiceBreakdown ?? []).map((p, i) => {
                const colors = [
                  "bg-chart-1",
                  "bg-accent",
                  "bg-chart-3",
                  "bg-success",
                  "bg-chart-5",
                ];
                return (
                  <div key={p.name} className="flex items-center gap-3">
                    <span className={`h-2.5 w-2.5 rounded-sm ${colors[i % colors.length]}`} />
                    <span className="flex-1 text-sm text-foreground">{p.name}</span>
                    <span className="text-sm font-medium text-muted-foreground">{p.value}%</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ClientDashboard() {
  const { user } = useAuth();
  const { data: cases } = useApi(() => api.getCases(user!), []);
  const { data: events } = useApi(() => api.getEvents(user!), []);
  const { data: invoices } = useApi(() => api.getInvoices(user!), []);
  const { data: documents } = useApi(() => api.getDocuments(user!), []);

  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<"idle" | "selected" | "uploading" | "success">("idle");
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);

  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentStatus, setPaymentStatus] = useState<"idle" | "processing" | "success">("idle");
  const [localEvents, setLocalEvents] = useState<NonNullable<typeof events>>([]);
  
  const [schedCase, setSchedCase] = useState("");
  const [schedType, setSchedType] = useState("phone");
  const [schedDate, setSchedDate] = useState("");
  const [schedTime, setSchedTime] = useState("morning");

  const outstanding = (invoices ?? [])
    .filter((i) => i.status !== "paid")
    .reduce((s, i) => s + i.amount, 0);

  const upcoming = [...(events ?? []), ...localEvents]
    .sort((a, b) => new Date(`${a.date}T${a.time}`).getTime() - new Date(`${b.date}T${b.time}`).getTime())
    .slice(0, 3);

  return (
    <div>
      <PageHeader
        title={`Welcome, ${user!.name.split(" ")[0]}`}
        description="Track your matters, communicate with your legal team, and manage payments."
        actions={
          <Link to="/app/messages">
            <Button>
              Message your team <ArrowUpRight className="ml-1 h-4 w-4" />
            </Button>
          </Link>
        }
      />
      <div className="space-y-6 p-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Active matters" value={String(cases?.length ?? 0)} icon={Briefcase} />
          <StatCard label="Documents" value={String(documents?.length ?? 0)} icon={FileText} />
          <StatCard
            label="Upcoming events"
            value={String(events?.length ?? 0)}
            icon={CalendarIcon}
          />
          <StatCard
            label="Outstanding"
            value={`$${(outstanding / 1000).toFixed(1)}k`}
            icon={DollarSign}
            hint="across open invoices"
          />
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="rounded-lg border border-border bg-card lg:col-span-2">
            <div className="border-b border-border px-5 py-4">
              <h2 className="text-sm font-semibold text-foreground">Your matters</h2>
            </div>
            <div className="divide-y divide-border">
              {(cases ?? []).map((c) => (
                <div key={c.id} className="px-5 py-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-foreground">{c.title}</p>
                    <Badge variant="outline" className={statusColor(c.status)}>
                      {c.stage}
                    </Badge>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {c.number} · Lead: {c.lead}
                  </p>
                  <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="h-3.5 w-3.5" />
                    Next:{" "}
                    <span className="font-medium text-foreground">{c.nextDeadline ?? "—"}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-6">
            {/* Quick Actions / Self Service */}
            <div className="rounded-lg border border-border bg-card">
              <div className="border-b border-border px-5 py-4">
                <h2 className="text-sm font-semibold text-foreground">Quick Actions</h2>
              </div>
              <div className="p-4 space-y-2">
                <Dialog open={isUploadOpen} onOpenChange={(open) => {
                  setIsUploadOpen(open);
                  if (!open) {
                    setTimeout(() => {
                      setUploadStatus("idle");
                      setSelectedFileName(null);
                    }, 300);
                  }
                }}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="w-full justify-start">
                      <FileText className="mr-2 h-4 w-4" />
                      Upload Requested Document
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                      <DialogTitle>Upload Document</DialogTitle>
                      <DialogDescription>
                        Securely upload requested documents directly to your legal team.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      {uploadStatus === "idle" && (
                        <div className="border-2 border-dashed border-border rounded-lg flex flex-col items-center justify-center p-8 text-center bg-muted/20 relative group overflow-hidden">
                          <input 
                            type="file" 
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                setSelectedFileName(file.name);
                                setUploadStatus("selected");
                              }
                            }}
                          />
                          <UploadCloud className="h-10 w-10 text-muted-foreground mb-4 group-hover:text-primary transition-colors" />
                          <p className="text-sm font-medium mb-1">Click to browse or drag file here</p>
                          <p className="text-xs text-muted-foreground">PDF, DOCX, JPG or PNG (max. 50MB)</p>
                          <Button className="mt-4 pointer-events-none" variant="secondary">
                            Select File
                          </Button>
                        </div>
                      )}

                      {uploadStatus === "selected" && (
                        <div className="border border-border rounded-lg p-4">
                          <div className="flex items-center justify-between bg-muted/50 p-3 rounded-md">
                            <div className="flex items-center gap-3 overflow-hidden">
                              <div className="h-10 w-10 flex items-center justify-center bg-primary/10 text-primary rounded-md shrink-0">
                                <FileIcon className="h-5 w-5" />
                              </div>
                              <div className="min-w-0">
                                <p className="text-sm font-medium truncate">{selectedFileName}</p>
                                <p className="text-xs text-muted-foreground">Ready to upload</p>
                              </div>
                            </div>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 text-muted-foreground hover:text-destructive shrink-0"
                              onClick={() => {
                                setUploadStatus("idle");
                                setSelectedFileName(null);
                              }}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                          
                          <Button 
                            className="w-full mt-4"
                            onClick={() => {
                              setUploadStatus("uploading");
                              setTimeout(() => setUploadStatus("success"), 1500);
                            }}
                          >
                            <UploadCloud className="mr-2 h-4 w-4" />
                            Upload to File
                          </Button>
                        </div>
                      )}
                      
                      {uploadStatus === "uploading" && (
                        <div className="flex flex-col items-center justify-center p-8 text-center space-y-4">
                          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                          <p className="text-sm font-medium">Encrypting and uploading...</p>
                          <p className="text-xs text-muted-foreground">{selectedFileName}</p>
                        </div>
                      )}

                      {uploadStatus === "success" && (
                        <div className="flex flex-col items-center justify-center p-8 text-center space-y-2">
                          <div className="h-12 w-12 rounded-full bg-success/20 flex items-center justify-center mb-2">
                            <CheckCircle className="h-6 w-6 text-success" />
                          </div>
                          <p className="text-base font-semibold text-foreground">Upload Complete</p>
                          <p className="text-sm text-muted-foreground">Your legal team has been notified.</p>
                        </div>
                      )}
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsUploadOpen(false)}>
                        {uploadStatus === "success" ? "Close" : "Cancel"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>

                <Dialog open={isPaymentOpen} onOpenChange={(open) => {
                  setIsPaymentOpen(open);
                  if (!open) setTimeout(() => { setPaymentStatus("idle"); setPaymentAmount(""); }, 300);
                }}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="w-full justify-start">
                      <DollarSign className="mr-2 h-4 w-4" />
                      Make a Payment
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                      <DialogTitle>Make a Payment</DialogTitle>
                      <DialogDescription>
                        Pay an outstanding invoice or replenish your trust retainer.
                      </DialogDescription>
                    </DialogHeader>
                    
                    {paymentStatus === "idle" && (
                      <div className="grid gap-4 py-4">
                        <div className="bg-muted/50 p-4 rounded-lg flex justify-between items-center border border-border">
                          <div>
                            <p className="text-sm font-medium">Total Outstanding</p>
                            <p className="text-xs text-muted-foreground">Across {invoices?.filter(i => i.status !== "paid").length} open invoices</p>
                          </div>
                          <p className="text-xl font-bold">${(outstanding / 1000).toFixed(1)}k</p>
                        </div>
                        
                        <div className="grid gap-2">
                          <Label htmlFor="amount">Payment Amount</Label>
                          <div className="relative">
                            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input 
                              id="amount" 
                              type="number" 
                              placeholder="0.00" 
                              className="pl-9"
                              value={paymentAmount}
                              onChange={(e) => setPaymentAmount(e.target.value)}
                            />
                          </div>
                        </div>

                        <div className="grid gap-2">
                          <Label htmlFor="method">Payment Method</Label>
                          <Select defaultValue="card_ending_4242">
                            <SelectTrigger>
                              <SelectValue placeholder="Select a card" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="card_ending_4242">Visa ending in 4242</SelectItem>
                              <SelectItem value="bank_ending_1122">Chase Checking **1122</SelectItem>
                              <SelectItem value="new_card">+ Add new card</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    )}

                    {paymentStatus === "processing" && (
                      <div className="flex flex-col items-center justify-center py-12 space-y-4">
                        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                        <p className="text-sm font-medium">Processing payment securely...</p>
                      </div>
                    )}

                    {paymentStatus === "success" && (
                      <div className="flex flex-col items-center justify-center py-12 space-y-2">
                        <div className="h-12 w-12 rounded-full bg-success/20 flex items-center justify-center mb-2">
                          <CheckCircle className="h-6 w-6 text-success" />
                        </div>
                        <p className="text-base font-semibold text-foreground">Payment Successful</p>
                        <p className="text-sm text-muted-foreground">Receipt sent to {user!.email}</p>
                      </div>
                    )}

                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsPaymentOpen(false)}>
                        {paymentStatus === "success" ? "Close" : "Cancel"}
                      </Button>
                      {paymentStatus === "idle" && (
                        <Button 
                          disabled={!paymentAmount || isNaN(Number(paymentAmount)) || Number(paymentAmount) <= 0}
                          onClick={() => {
                            setPaymentStatus("processing");
                            setTimeout(() => setPaymentStatus("success"), 2000);
                          }}
                        >
                          <CreditCard className="mr-2 h-4 w-4" />
                          Pay ${paymentAmount || "0.00"}
                        </Button>
                      )}
                    </DialogFooter>
                  </DialogContent>
                </Dialog>

                <Dialog open={isScheduleOpen} onOpenChange={setIsScheduleOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="w-full justify-start">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      Schedule Appointment
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                      <DialogTitle>Request Appointment</DialogTitle>
                      <DialogDescription>
                        Select a time to speak with your assigned attorney.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid gap-2">
                        <Label>Regarding Matter</Label>
                        <Select value={schedCase || (cases?.[0]?.id ?? "")} onValueChange={setSchedCase}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a case" />
                          </SelectTrigger>
                          <SelectContent>
                            {cases?.map(c => (
                              <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid gap-2">
                        <Label>Meeting Type</Label>
                        <Select value={schedType} onValueChange={setSchedType}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="phone">Phone Call</SelectItem>
                            <SelectItem value="video">Video Conference</SelectItem>
                            <SelectItem value="in_person">In-Office Visit</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                          <Label>Preferred Date</Label>
                          <Input 
                            type="date" 
                            value={schedDate}
                            onChange={(e) => setSchedDate(e.target.value)}
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label>Time Preference</Label>
                          <Select value={schedTime} onValueChange={setSchedTime}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select time" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="morning">Morning (9am-12pm)</SelectItem>
                              <SelectItem value="afternoon">Afternoon (1pm-5pm)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsScheduleOpen(false)}>Cancel</Button>
                      <Button 
                        disabled={!schedDate}
                        onClick={() => {
                          const newEvent = {
                            id: `local-evt-${Date.now()}`,
                            date: schedDate,
                            time: schedTime === "morning" ? "09:00" : "14:00",
                            title: `Client requested ${schedType.replace('_', ' ')}`,
                            type: "meeting",
                            caseId: schedCase || (cases?.[0]?.id ?? "c1"),
                            reminder: "1d",
                            notes: "Requested via Client Portal"
                          };
                          setLocalEvents(prev => [...prev, newEvent]);
                          setIsScheduleOpen(false);
                          setSchedDate("");
                        }}
                      >
                        Send Request
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </div>

            <div className="rounded-lg border border-border bg-card">
              <div className="border-b border-border px-5 py-4">
                <h2 className="text-sm font-semibold text-foreground">Upcoming with your team</h2>
              </div>
              <div className="divide-y divide-border">
                {upcoming.map((e) => (
                  <div key={e.id} className="flex items-start gap-3 px-5 py-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-md bg-accent/15 text-accent">
                      <CalendarIcon className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{e.title}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {e.date} · {e.time}
                      </p>
                    </div>
                  </div>
                ))}
                {!upcoming.length && (
                  <p className="px-5 py-6 text-sm text-muted-foreground">No upcoming events.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
