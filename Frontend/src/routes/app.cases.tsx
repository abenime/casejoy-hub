import { createFileRoute } from "@tanstack/react-router";
import { format } from "date-fns";
import {
  ArrowUpDown,
  CalendarDays,
  CheckCircle2,
  Filter,
  FileText,
  ListTodo,
  Plus,
  Search,
  SlidersHorizontal,
  Users,
  Clock3,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useApi } from "@/lib/use-api";
import { api, type Case } from "@/lib/api";
import { PageHeader, StatCard, statusColor } from "@/components/ui-shared";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

export const Route = createFileRoute("/app/cases")({
  component: CasesPage,
});

type SortKey = "deadline" | "openedAt" | "priority" | "status" | "billable";
type TaskStatus = "todo" | "in_progress" | "review" | "done";
type CaseStatusFilter = "all" | "active" | "pending" | "closed";

interface CaseTask {
  id: string;
  caseId: string;
  title: string;
  assignee: string;
  due: string;
  status: TaskStatus;
  priority: "low" | "medium" | "high";
  notes?: string;
}

interface CaseTimelineItem {
  label: string;
  value: string;
}

interface CaseDocument {
  id: string;
  caseId: string;
  name: string;
  type: string;
  size: string;
  uploadedBy: string;
  uploadedAt: string;
  signed: boolean;
}

interface NewCaseForm {
  number: string;
  title: string;
  client: string;
  practice: string;
  stage: string;
  lead: string;
  court: string;
  judge: string;
  hearingDate: string;
  priority: "low" | "medium" | "high";
  nextDeadline: string;
}

const SORT_LABELS: Record<SortKey, string> = {
  deadline: "Deadline",
  openedAt: "Opened",
  priority: "Priority",
  status: "Status",
  billable: "Billable",
};

const STATUS_FILTER_LABELS: Record<CaseStatusFilter, string> = {
  all: "All statuses",
  active: "Active",
  pending: "Pending",
  closed: "Closed",
};

const CASE_STATUS_ORDER: Record<string, number> = {
  active: 0,
  pending: 1,
  closed: 2,
  archived: 2,
};

const CASE_STATUS_LABELS: Record<string, string> = {
  active: "Active",
  pending: "Pending",
  closed: "Closed",
  archived: "Closed",
};

const PRIORITY_RANK: Record<Case["priority"], number> = {
  high: 0,
  medium: 1,
  low: 2,
};

const STAGE_STYLES: Record<string, string> = {
  intake: "bg-secondary text-secondary-foreground border-border",
  drafting: "bg-chart-3/10 text-chart-3 border-chart-3/20",
  discovery: "bg-accent/10 text-accent border-accent/20",
  filing: "bg-chart-1/10 text-chart-1 border-chart-1/20",
  trial: "bg-destructive/10 text-destructive border-destructive/20",
  closed: "bg-muted text-muted-foreground border-border",
};

function stageColor(stage: string) {
  return STAGE_STYLES[stage.toLowerCase()] ?? "bg-secondary text-secondary-foreground border-border";
}

function normalizeCaseStatus(status: string) {
  return status === "archived" ? "closed" : status;
}

function caseStatusLabel(status: string) {
  return CASE_STATUS_LABELS[status] ?? status;
}

function caseStatusColor(status: string) {
  return statusColor(normalizeCaseStatus(status));
}

function formatDate(value?: string | null) {
  if (!value) return "—";
  return format(new Date(value), "MMM d, yyyy");
}

function initialCaseForm(): NewCaseForm {
  return {
    number: "",
    title: "",
    client: "",
    practice: "",
    stage: "Intake",
    lead: "",
    court: "",
    judge: "",
    hearingDate: "",
    priority: "medium",
    nextDeadline: "",
  };
}

function CasesPage() {
  const { user, isClient } = useAuth();
  const { data: cases, loading } = useApi(() => api.getCases(user!), [user?.id]);
  const { data: tasks } = useApi(() => api.getTasks(user!), [user?.id]);
  const { data: documents } = useApi(() => api.getDocuments(user!), [user?.id]);
  const { data: staff } = useApi(() => api.getStaff(), []);

  const [search, setSearch] = useState("");
  const [practiceFilter, setPracticeFilter] = useState("all");
  const [stageFilter, setStageFilter] = useState("all");
  const [leadFilter, setLeadFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<CaseStatusFilter>("all");
  const [sortKey, setSortKey] = useState<SortKey>("deadline");
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [localCases, setLocalCases] = useState<Case[]>([]);
  const [localTasks, setLocalTasks] = useState<CaseTask[]>([]);
  const [form, setForm] = useState<NewCaseForm>(initialCaseForm());
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof NewCaseForm, string>>>({});
  const [taskDraft, setTaskDraft] = useState({
    template: "",
    assignee: "",
    due: "",
    priority: "medium" as CaseTask["priority"],
    notes: "",
  });

  const mergedCases = useMemo(() => [...localCases, ...(cases ?? [])], [cases, localCases]);

  const practiceOptions = useMemo(
    () => Array.from(new Set(mergedCases.map((item) => item.practice))).sort(),
    [mergedCases],
  );

  const stageOptions = useMemo(
    () => Array.from(new Set(mergedCases.map((item) => item.stage))).sort(),
    [mergedCases],
  );

  const taskTemplates = useMemo(
    () => Array.from(new Set((tasks ?? []).map((item: CaseTask) => item.title))).sort(),
    [tasks],
  );

  const assigneeOptions = useMemo(() => {
    const names = new Set<string>();
    (staff ?? []).forEach((person: any) => names.add(person.name));
    (tasks ?? []).forEach((task: CaseTask) => names.add(task.assignee));
    mergedCases.forEach((item) => names.add(item.lead));
    return Array.from(names).sort();
  }, [mergedCases, staff, tasks]);

  const leadOptions = useMemo(() => Array.from(new Set(mergedCases.map((item) => item.lead))).sort(), [mergedCases]);

  const visibleCases = useMemo(
    () =>
      mergedCases.filter((item) => {
        const searchable = [
          item.number,
          item.title,
          item.client,
          item.practice,
          item.stage,
          item.lead,
          item.priority,
          item.court ?? "",
          item.judge ?? "",
        ]
          .join(" ")
          .toLowerCase();

        const matchesQuery = !search.trim() || searchable.includes(search.trim().toLowerCase());
        const matchesPractice = practiceFilter === "all" || item.practice === practiceFilter;
        const matchesStage = stageFilter === "all" || item.stage === stageFilter;
        const matchesLead = leadFilter === "all" || item.lead === leadFilter;
        const matchesPriority = priorityFilter === "all" || item.priority === priorityFilter;
        const normalizedStatus = normalizeCaseStatus(item.status);
        const matchesStatus = statusFilter === "all" || normalizedStatus === statusFilter;

        return matchesQuery && matchesPractice && matchesStage && matchesLead && matchesPriority && matchesStatus;
      }),
    [leadFilter, mergedCases, practiceFilter, priorityFilter, search, stageFilter, statusFilter],
  );

  const filteredCases = useMemo(() => {
    return [...visibleCases].sort((a, b) => {
      switch (sortKey) {
        case "openedAt":
          return new Date(b.openedAt).getTime() - new Date(a.openedAt).getTime();
        case "billable":
          return b.billable - a.billable;
        case "priority":
          return PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority];
        case "status":
          return CASE_STATUS_ORDER[normalizeCaseStatus(a.status)] - CASE_STATUS_ORDER[normalizeCaseStatus(b.status)];
        case "deadline": {
          const aTime = a.nextDeadline ? new Date(a.nextDeadline).getTime() : Number.POSITIVE_INFINITY;
          const bTime = b.nextDeadline ? new Date(b.nextDeadline).getTime() : Number.POSITIVE_INFINITY;
          return aTime - bTime;
        }
        default:
          return 0;
      }
    });
  }, [sortKey, visibleCases]);

  const allTasks = useMemo(() => {
    const map = new Map<string, CaseTask>();
    (tasks ?? []).forEach((task: CaseTask) => map.set(task.id, task));
    localTasks.forEach((task) => map.set(task.id, task));
    return Array.from(map.values());
  }, [localTasks, tasks]);

  const selectedCase = useMemo(() => {
    if (!filteredCases.length) return null;
    return filteredCases.find((item) => item.id === selectedCaseId) ?? filteredCases[0];
  }, [filteredCases, selectedCaseId]);

  useEffect(() => {
    if (!filteredCases.length) {
      setSelectedCaseId(null);
      return;
    }

    const stillVisible = selectedCaseId && filteredCases.some((item) => item.id === selectedCaseId);
    if (!stillVisible) {
      setSelectedCaseId(filteredCases[0].id);
    }
  }, [filteredCases, selectedCaseId]);

  const selectedTasks = useMemo(
    () => allTasks.filter((item) => item.caseId === selectedCase?.id),
    [allTasks, selectedCase?.id],
  );

  const selectedDocuments = useMemo(
    () => ((documents ?? []) as CaseDocument[]).filter((item) => item.caseId === selectedCase?.id),
    [documents, selectedCase?.id],
  );

  const activeCases = mergedCases.filter((item) => item.status === "active").length;
  const dueSoon = mergedCases.filter((item) => {
    if (!item.nextDeadline) return false;
    const deadline = new Date(item.nextDeadline).getTime();
    const today = Date.now();
    const fourteenDays = 14 * 24 * 60 * 60 * 1000;
    return deadline >= today && deadline <= today + fourteenDays;
  }).length;
  const totalBillable = mergedCases.reduce((sum, item) => sum + item.billable, 0);

  const taskProgress = selectedTasks.length
    ? Math.round((selectedTasks.filter((item) => item.status === "done").length / selectedTasks.length) * 100)
    : 0;

  function resetFilters() {
    setSearch("");
    setPracticeFilter("all");
    setStageFilter("all");
    setLeadFilter("all");
    setPriorityFilter("all");
    setStatusFilter("all");
    setSortKey("deadline");
  }

  function openNewCaseDialog() {
    setForm(initialCaseForm());
    setFormErrors({});
    setIsCreateOpen(true);
  }

  function validateCaseForm() {
    const errors: Partial<Record<keyof NewCaseForm, string>> = {};
    if (!form.number.trim()) errors.number = "Case number is required.";
    if (!form.title.trim()) errors.title = "Case title is required.";
    if (!form.client.trim()) errors.client = "Client name is required.";
    if (!form.practice.trim()) errors.practice = "Practice area is required.";
    if (!form.stage.trim()) errors.stage = "Stage is required.";
    if (!form.lead.trim()) errors.lead = "Lead attorney is required.";
    if (!form.nextDeadline.trim()) {
      errors.nextDeadline = "Deadline helps the team prioritize this matter.";
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }

  function submitCaseForm() {
    if (!validateCaseForm()) return;

    const newCase: Case = {
      id: `local-${Date.now()}`,
      number: form.number.trim(),
      title: form.title.trim(),
      client: form.client.trim(),
      clientId: null,
      practice: form.practice.trim(),
      stage: form.stage.trim(),
      status: "active",
      lead: form.lead.trim(),
      court: form.court.trim() || undefined,
      judge: form.judge.trim() || undefined,
      hearingDate: form.hearingDate || null,
      openedAt: new Date().toISOString().slice(0, 10),
      nextDeadline: form.nextDeadline || null,
      billable: 0,
      priority: form.priority,
    };

    setLocalCases((current) => [newCase, ...current]);
    setSelectedCaseId(newCase.id);
    setIsCreateOpen(false);
  }

  function addWorkflowTask() {
    if (!selectedCase || !taskDraft.template || !taskDraft.assignee || !taskDraft.due) return;

    const template = (tasks ?? []).find((item: CaseTask) => item.title === taskDraft.template);
    const newTask: CaseTask = {
      id: `task-${Date.now()}`,
      caseId: selectedCase.id,
      title: taskDraft.template,
      assignee: taskDraft.assignee,
      due: taskDraft.due,
      status: "todo",
      priority: taskDraft.priority ?? template?.priority ?? "medium",
      notes: taskDraft.notes.trim() || undefined,
    };

    setLocalTasks((current) => [newTask, ...current]);
    setTaskDraft({ template: "", assignee: "", due: "", priority: "medium", notes: "" });
  }

  function updateTaskStatus(taskId: string, status: TaskStatus) {
    setLocalTasks((current) => {
      const existing = current.find((task) => task.id === taskId);
      if (existing) {
        return current.map((task) => (task.id === taskId ? { ...task, status } : task));
      }

      const baseTask = (tasks ?? []).find((task: CaseTask) => task.id === taskId);
      if (!baseTask) return current;

      return [...current, { ...baseTask, status }];
    });
  }

  const { data: initialCases, loading: casesLoading } = useApi(() => api.getCases(user!), [user?.id]);
  const { data: initialDocuments } = useApi(() => api.getDocuments(user!), [user?.id]);

  const [documents, setDocuments] = useState<any[]>([]);
  const [selectedCase, setSelectedCase] = useState<any>(null);
  const [caseDialogOpen, setCaseDialogOpen] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<any>(null);
  const [docDialogOpen, setDocDialogOpen] = useState(false);

  // Sync documents state
  useEffect(() => {
    if (initialDocuments) {
      setDocuments(initialDocuments);
    }
  }, [initialDocuments]);

  const handleSignDocument = (docId: string) => {
    setDocuments(prev => prev.map(d => {
      if (d.id === docId) {
        return { ...d, signed: true };
      }
      return d;
    }));
    setSelectedDoc(prev => prev ? { ...prev, signed: true } : null);
    toast.success("Document signed successfully!");
  };

  const getMockDocumentPages = (docName: string, doc: any): string[] => {
    if (docName.toLowerCase().includes("complaint")) {
      return [
        `IN THE SUPERIOR COURT OF CALIFORNIA\nFOR THE CITY AND COUNTY OF SAN FRANCISCO\n\nJAMES WHITAKER,               )\tCase No. 2026-CIV-0142\n      Plaintiff,              )\t\n                              )\tCOMPLAINT FOR BREACH\nv.                            )\tOF CONTRACT\n                              )\t\nNORTHBRIDGE HOLDINGS,         )\tDEMAND FOR JURY TRIAL\n      Defendant.              )\n______________________________)`,
        `Plaintiff James Whitaker, by and through his counsel Marcus Hale, hereby alleges and complains as follows:\n\n1. PLAINTIFF James Whitaker is an individual residing in San Francisco, California, and at all times mentioned herein was engaged in venture capital operations.\n\n2. DEFENDANT Northbridge Holdings is a corporate entity registered under the laws of the State of Delaware, with its primary corporate offices and principal place of business located at 500 Sansome Street, San Francisco, California.\n\n3. ON OR ABOUT January 10, 2026, Plaintiff and Defendant entered into a written and executed corporate agreement under which Defendant was obligated to deliver specific digital assets and detailed financial portfolios.\n\n4. DEFENDANT failed to deliver the required assets by the contractually mandated deadline, thereby breaching Section 4.2 of said agreement.\n\n5. AS A DIRECT and proximate result of Defendant's breach, Plaintiff suffered substantial financial damages exceeding $150,000, exclusive of interest and legal fees.\n\nWHEREFORE, Plaintiff demands judgment against Defendant for compensatory damages, pre-judgment interest, reasonable attorney fees, and such other relief as the Court deems just and proper.`
      ];
    }
    if (docName.toLowerCase().includes("trust")) {
      return [
        `THE MARTINEZ REVOCABLE TRUST AGREEMENT\n\nThis Revocable Trust Agreement is entered into and executed this 18th day of May, 2026, by and between the following parties:\n\nGRANTOR:\nAna Martinez, an individual residing in Oakland, California.\n\nTRUSTEE:\nAna Martinez, to serve as the initial primary Trustee of the Trust.\n\nCO-TRUSTEE / SUCCESSOR TRUSTEE:\nEleanor Vance, Managing Partner at Casejoy Practice, appointed to act as Successor Trustee upon the resignation or incapacity of the initial Trustee.\n\nESTABLISHMENT OF TRUST:\nThe Grantor hereby transfers, assigns, and delivers to the Trustee the properties described in Schedule A, to be held, administered, and distributed under the terms of this Trust Agreement.`,
        `I. DECLARATION OF TRUST\nThe Grantor hereby declares that all properties described in Schedule A hereto attached are transferred into this Trust for the sole benefit of the named beneficiaries.\n\nII. DISTRIBUTIONS DURING GRANTOR'S LIFETIME\nThe Trustee shall distribute to the Grantor as much of the net income and principal of the trust estate as the Grantor shall direct in writing.\n\nIII. REVOCABILITY AND AMENDMENT\nThe Grantor reserves the absolute right to amend, alter, or revoke this Trust at any time, in whole or in part, by written instrument signed by the Grantor and delivered to the Trustee.\n\nIV. GOVERNING LAW\nThis Trust Agreement shall be governed by, and construed in accordance with, the laws of the State of California.\n\nIN WITNESS WHEREOF, the parties hereto have executed this Martinez Revocable Trust Agreement on the day and year first above written.`
      ];
    }
    if (docName.toLowerCase().includes("patent")) {
      return [
        `UNITED STATES PATENT AND TRADEMARK OFFICE\n\nAPPLICANT: James Whitaker (Whitaker Capital)\nTITLE: SYSTEM FOR AUTOMATED LIQUID DEFI ASSET COLLATERAL\nATTORNEY DOCKET NO: 2026-IP-0021-US\n\nTECHNICAL FIELD:\nThis disclosure relates generally to decentralized blockchain networks, and more particularly to methods and cryptographic protocols for establishing multi-party smart contracts utilizing automated asset collateral balances.\n\nBACKGROUND OF THE INVENTION:\nPrior art collateralization mechanisms fail to evaluate leverage ratios in real-time, frequently leading to premature liquidations or contract failure under sudden market swings and high network latency.\n\nSUMMARY OF THE INVENTION:\nThe present invention resolves liquidity slippages by establishing a dynamic liquidity buffer pool that operates continuously and adjusts collateral thresholds dynamically.`,
        `CLAIMS:\n\nWe claim:\n\n1. A computer-implemented blockchain system comprising a hardware processor, a distributed ledger interface, and memory configured to lock collateral tokens under a first cryptographic condition, evaluate an index feed in real-time, and dynamically deploy buffer reserves.\n\n2. The system of Claim 1, wherein the dynamic buffer pool adjusts liquidity dynamically based on gas price fluctuations.\n\n3. The system of Claim 1, wherein a secondary threshold is monitored continuously via automated oracle inputs.`
      ];
    }
    return [
      `PRIVILEGED LEGAL INSTRUMENT & MEMORANDUM\n\nMatter ID: ${doc?.caseId || "N/A"}\nDocument Type: ${doc?.type?.toUpperCase() || "CONTRACT"}\nUploader: ${doc?.uploadedBy || "Staff Counsel"}\nDate: ${doc?.uploadedAt || "2026-05-30"}\n\nThis privileged internal legal instrument is drafted in accordance with current state regulations and compliance codes.\n\nRECITALS:\nWhereas, the parties hereto wish to formalize their business and legal relations on the terms and conditions set forth in this agreement.`,
      `TERMS & CONDITIONS:\n\n1. Confidentiality: Each party agrees to hold all proprietary information in strict confidence.\n\n2. Jurisdiction: This agreement shall be governed by and construed in accordance with the laws of the State of California.\n\n3. Arbitration: All disputes arising under this agreement shall be resolved via binding arbitration in San Francisco.`
    ];
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={isClient ? "Your matters" : "Cases"}
        description={
          isClient
            ? "Every matter your firm is handling for you."
            : "Search, sort, and manage matters, workflows, and deadlines."
        }
        actions={
          !isClient && (
            <>
              <Button variant="outline" onClick={resetFilters}>
                <Filter className="mr-2 h-4 w-4" /> Filter
              </Button>
              <Button onClick={openNewCaseDialog}>
                <Plus className="mr-2 h-4 w-4" /> New case
              </Button>
            </>
          )
        }
      />
      <div className="grid gap-4 px-6 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total matters" value={mergedCases.length.toString()} hint="Loaded from mock data" />
        <StatCard label="Active matters" value={activeCases.toString()} hint="Currently open files" />
        <StatCard label="Due in 14 days" value={dueSoon.toString()} hint="Deadline watchlist" icon={Clock3} />
        <StatCard
          label="Billable hours"
          value={totalBillable.toFixed(1)}
          hint="Across all visible matters"
          icon={CalendarDays}
        />
      </div>

      <div className="grid gap-6 px-6 pb-6 xl:grid-cols-[1.45fr_0.95fr]">
        <section className="overflow-hidden rounded-lg border border-border bg-card">
          <div className="space-y-4 border-b border-border p-4">
            <div className="grid gap-3 lg:grid-cols-[1.6fr_1fr_1fr_1fr_1fr]">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search matters, clients, leads…"
                  className="h-10 pl-9"
                />
              </div>

              <Select value={practiceFilter} onValueChange={setPracticeFilter}>
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="Practice" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All practices</SelectItem>
                  {practiceOptions.map((practice) => (
                    <SelectItem key={practice} value={practice}>
                      {practice}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={stageFilter} onValueChange={setStageFilter}>
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="Stage" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All stages</SelectItem>
                  {stageOptions.map((stage) => (
                    <SelectItem key={stage} value={stage}>
                      {stage}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={leadFilter} onValueChange={setLeadFilter}>
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="Assigned attorney" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All attorneys</SelectItem>
                  {leadOptions.map((lead) => (
                    <SelectItem key={lead} value={lead}>
                      {lead}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={sortKey} onValueChange={(value) => setSortKey(value as SortKey)}>
                <SelectTrigger className="h-10">
                  <ArrowUpDown className="mr-2 h-4 w-4 text-muted-foreground" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(SORT_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {(Object.keys(STATUS_FILTER_LABELS) as CaseStatusFilter[]).map((status) => (
                <Button
                  key={status}
                  variant={statusFilter === status ? "secondary" : "outline"}
                  size="sm"
                  onClick={() => setStatusFilter(status)}
                >
                  {STATUS_FILTER_LABELS[status]}
                </Button>
              ))}
              <Button
                variant={priorityFilter === "all" ? "secondary" : "outline"}
                size="sm"
                onClick={() => setPriorityFilter("all")}
              >
                All priorities
              </Button>
              <Button
                variant={priorityFilter === "high" ? "secondary" : "outline"}
                size="sm"
                onClick={() => setPriorityFilter("high")}
              >
                High
              </Button>
              <Button
                variant={priorityFilter === "medium" ? "secondary" : "outline"}
                size="sm"
                onClick={() => setPriorityFilter("medium")}
              >
                Medium
              </Button>
              <Button
                variant={priorityFilter === "low" ? "secondary" : "outline"}
                size="sm"
                onClick={() => setPriorityFilter("low")}
              >
                Low
              </Button>
              <div className="ml-auto flex items-center gap-2 text-xs text-muted-foreground">
                <SlidersHorizontal className="h-4 w-4" />
                {filteredCases.length} matter{filteredCases.length === 1 ? "" : "s"} found
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-secondary/60 text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-5 py-3 text-left font-medium">Case number</th>
                  <th className="px-5 py-3 text-left font-medium">Title</th>
                  {!isClient && <th className="px-5 py-3 text-left font-medium">Client</th>}
                  <th className="px-5 py-3 text-left font-medium">Practice</th>
                  <th className="px-5 py-3 text-left font-medium">Stage</th>
                  <th className="px-5 py-3 text-left font-medium">Lead</th>
                  <th className="px-5 py-3 text-left font-medium">
                    <button className="inline-flex items-center gap-1 hover:text-foreground" onClick={() => setSortKey("deadline")}>
                      Deadline <ArrowUpDown className="h-3.5 w-3.5" />
                    </button>
                  </th>
                  <th className="px-5 py-3 text-left font-medium">
                    <button className="inline-flex items-center gap-1 hover:text-foreground" onClick={() => setSortKey("status")}>
                      Status <ArrowUpDown className="h-3.5 w-3.5" />
                    </button>
                  </th>
                  <th className="px-5 py-3 text-left font-medium">
                    <button className="inline-flex items-center gap-1 hover:text-foreground" onClick={() => setSortKey("priority")}>
                      Priority <ArrowUpDown className="h-3.5 w-3.5" />
                    </button>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading && (
                  <tr>
                    <td colSpan={isClient ? 8 : 9} className="px-5 py-10 text-center text-muted-foreground">
                      Loading…
                    </td>
                  </tr>
                )}

                {!loading && filteredCases.length === 0 && (
                  <tr>
                    <td colSpan={isClient ? 8 : 9} className="px-5 py-12 text-center">
                      <div className="mx-auto max-w-sm space-y-2">
                        <p className="font-medium text-foreground">No matters match the current filters.</p>
                        <p className="text-sm text-muted-foreground">
                          Clear the search or filters to return to the full case list.
                        </p>
                        <Button variant="outline" size="sm" onClick={resetFilters}>
                          Clear filters
                        </Button>
                      </div>
                    </td>
                  </tr>
                )}

                {filteredCases.map((item) => {
                  const isSelected = item.id === selectedCase?.id;
                  return (
                    <tr
                      key={item.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => setSelectedCaseId(item.id)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          setSelectedCaseId(item.id);
                        }
                      }}
                      className={`cursor-pointer transition-colors hover:bg-secondary/40 ${
                        isSelected ? "bg-secondary/50" : ""
                      }`}
                    >
                      <td className="px-5 py-3.5 font-mono text-xs text-muted-foreground">{item.number}</td>
                      <td className="px-5 py-3.5 font-medium text-foreground">
                        <span className="truncate">{item.title}</span>
                      </td>
                      {!isClient && <td className="px-5 py-3.5 text-foreground">{item.client}</td>}
                      <td className="px-5 py-3.5 text-muted-foreground">{item.practice}</td>
                      <td className="px-5 py-3.5">
                        <Badge variant="outline" className={stageColor(item.stage)}>
                          {item.stage}
                        </Badge>
                      </td>
                      <td className="px-5 py-3.5 text-muted-foreground">{item.lead}</td>
                      <td className="px-5 py-3.5 text-foreground">{formatDate(item.nextDeadline)}</td>
                      <td className="px-5 py-3.5">
                        <Badge variant="outline" className={caseStatusColor(item.status)}>
                          {caseStatusLabel(item.status)}
                        </Badge>
                      </td>
                      <td className="px-5 py-3.5">
                        <Badge variant="outline" className={statusColor(item.priority)}>
                          {item.priority}
                        </Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        <aside className="overflow-hidden rounded-lg border border-border bg-card">
          {selectedCase ? (
            <div className="flex h-full flex-col">
              <div className="border-b border-border p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-mono text-xs text-muted-foreground">{selectedCase.number}</p>
                    <h2 className="mt-1 truncate text-xl font-semibold tracking-tight text-foreground">
                      {selectedCase.title}
                    </h2>
                    <p className="mt-1 text-sm text-muted-foreground">{selectedCase.client}</p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <Badge variant="outline" className={stageColor(selectedCase.stage)}>
                      {selectedCase.stage}
                    </Badge>
                    <Badge variant="outline" className={caseStatusColor(selectedCase.status)}>
                      {caseStatusLabel(selectedCase.status)}
                    </Badge>
                  </div>
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  <div className="rounded-lg border border-border bg-secondary/30 p-3">
                    <p className="text-xs uppercase tracking-wider text-muted-foreground">Lead</p>
                    <p className="mt-1 font-medium text-foreground">{selectedCase.lead}</p>
                  </div>
                  <div className="rounded-lg border border-border bg-secondary/30 p-3">
                    <p className="text-xs uppercase tracking-wider text-muted-foreground">Deadline</p>
                    <p className="mt-1 font-medium text-foreground">{formatDate(selectedCase.nextDeadline)}</p>
                  </div>
                  <div className="rounded-lg border border-border bg-secondary/30 p-3">
                    <p className="text-xs uppercase tracking-wider text-muted-foreground">Opened</p>
                    <p className="mt-1 font-medium text-foreground">{formatDate(selectedCase.openedAt)}</p>
                  </div>
                  <div className="rounded-lg border border-border bg-secondary/30 p-3">
                    <p className="text-xs uppercase tracking-wider text-muted-foreground">Billable</p>
                    <p className="mt-1 font-medium text-foreground">{selectedCase.billable.toFixed(1)} hrs</p>
                  </div>
                  <div className="rounded-lg border border-border bg-secondary/30 p-3">
                    <p className="text-xs uppercase tracking-wider text-muted-foreground">Court</p>
                    <p className="mt-1 font-medium text-foreground">{selectedCase.court ?? "—"}</p>
                  </div>
                  <div className="rounded-lg border border-border bg-secondary/30 p-3">
                    <p className="text-xs uppercase tracking-wider text-muted-foreground">Judge</p>
                    <p className="mt-1 font-medium text-foreground">{selectedCase.judge ?? "—"}</p>
                  </div>
                </div>
              </div>

              <Tabs defaultValue="overview" className="flex min-h-0 flex-1 flex-col">
                <div className="border-b border-border px-5 pt-4">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="workflow">Workflow</TabsTrigger>
                    <TabsTrigger value="documents">Documents</TabsTrigger>
                  </TabsList>
                </div>

                <TabsContent value="overview" className="m-0 flex-1 overflow-y-auto p-5">
                  <div className="space-y-5">
                    <div>
                      <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                        <Users className="h-4 w-4 text-muted-foreground" /> Team members
                      </div>
                      <div className="mt-3 space-y-2">
                        <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
                          <div>
                            <p className="text-sm font-medium text-foreground">Lead attorney</p>
                            <p className="text-xs text-muted-foreground">Primary matter owner</p>
                          </div>
                          <Badge variant="outline" className="bg-secondary text-secondary-foreground">
                            {selectedCase.lead}
                          </Badge>
                        </div>
                        {Array.from(new Set(selectedTasks.map((item) => item.assignee)))
                          .filter((name) => name !== selectedCase.lead)
                          .map((name) => (
                            <div key={name} className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
                              <div>
                                <p className="text-sm font-medium text-foreground">Assigned team member</p>
                                <p className="text-xs text-muted-foreground">Works active tasks on this matter</p>
                              </div>
                              <Badge variant="outline" className="bg-secondary text-secondary-foreground">
                                {name}
                              </Badge>
                            </div>
                          ))}
                        {selectedTasks.length === 0 && (
                          <p className="text-sm text-muted-foreground">
                            No additional team members are assigned yet.
                          </p>
                        )}
                      </div>
                    </div>

                    <Separator />

                    <div>
                      <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                        <ListTodo className="h-4 w-4 text-muted-foreground" /> Timeline
                      </div>
                      <div className="mt-3 space-y-3">
                        {([
                          { label: "Opened", value: formatDate(selectedCase.openedAt) },
                          { label: "Next deadline", value: formatDate(selectedCase.nextDeadline) },
                          { label: "Hearing date", value: formatDate(selectedCase.hearingDate) },
                          { label: "Current stage", value: selectedCase.stage },
                          { label: "Workflow progress", value: `${taskProgress}% complete` },
                        ] satisfies CaseTimelineItem[]).map((item) => (
                          <div key={item.label} className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
                            <p className="text-sm text-muted-foreground">{item.label}</p>
                            <p className="text-sm font-medium text-foreground">{item.value}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <Separator />

                    <div>
                      <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                        <FileText className="h-4 w-4 text-muted-foreground" /> Quick facts
                      </div>
                      <div className="mt-3 grid gap-3 sm:grid-cols-2">
                        <div className="rounded-lg border border-border p-3">
                          <p className="text-xs uppercase tracking-wider text-muted-foreground">Practice</p>
                          <p className="mt-1 text-sm font-medium text-foreground">{selectedCase.practice}</p>
                        </div>
                        <div className="rounded-lg border border-border p-3">
                          <p className="text-xs uppercase tracking-wider text-muted-foreground">Client</p>
                          <p className="mt-1 text-sm font-medium text-foreground">{selectedCase.client}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="workflow" className="m-0 flex-1 overflow-y-auto p-5">
                  <div className="space-y-5">
                    <div className="rounded-lg border border-border p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-foreground">Task progress</p>
                          <p className="text-xs text-muted-foreground">
                            {selectedTasks.length} task{selectedTasks.length === 1 ? "" : "s"} linked to this matter
                          </p>
                        </div>
                        <Badge variant="outline" className="bg-secondary text-secondary-foreground">
                          {taskProgress}% complete
                        </Badge>
                      </div>
                      <div className="mt-3 h-2 overflow-hidden rounded-full bg-secondary">
                        <div
                          className="h-full rounded-full bg-primary transition-all"
                          style={{ width: `${taskProgress}%` }}
                        />
                      </div>
                    </div>

                    <div className="space-y-3">
                      {selectedTasks.map((task) => (
                        <div key={task.id} className="rounded-lg border border-border p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0 flex-1">
                              <p className="font-medium text-foreground">{task.title}</p>
                                {task.notes && <p className="mt-1 text-xs text-muted-foreground">{task.notes}</p>}
                              <p className="mt-1 text-xs text-muted-foreground">
                                Due {formatDate(task.due)} · {task.assignee}
                              </p>
                            </div>
                            <Badge variant="outline" className={statusColor(task.status)}>
                              {task.status.replace("_", " ")}
                            </Badge>
                          </div>
                          <div className="mt-3 flex items-center gap-2">
                            <Badge variant="outline" className={statusColor(task.priority)}>
                              {task.priority}
                            </Badge>
                            <Badge variant="outline" className="bg-secondary text-secondary-foreground">
                              {task.assignee}
                            </Badge>
                          </div>
                          <div className="mt-3 flex flex-wrap gap-2">
                            <Button
                              variant={task.status === "todo" ? "secondary" : "outline"}
                              size="sm"
                              onClick={() => updateTaskStatus(task.id, "todo")}
                            >
                              To do
                            </Button>
                            <Button
                              variant={task.status === "in_progress" ? "secondary" : "outline"}
                              size="sm"
                              onClick={() => updateTaskStatus(task.id, "in_progress")}
                            >
                              In progress
                            </Button>
                            <Button
                              variant={task.status === "review" ? "secondary" : "outline"}
                              size="sm"
                              onClick={() => updateTaskStatus(task.id, "review")}
                            >
                              Review
                            </Button>
                            <Button
                              variant={task.status === "done" ? "secondary" : "outline"}
                              size="sm"
                              onClick={() => updateTaskStatus(task.id, "done")}
                            >
                              <CheckCircle2 className="mr-2 h-4 w-4" /> Done
                            </Button>
                          </div>
                        </div>
                      ))}

                      {!selectedTasks.length && (
                        <div className="rounded-lg border border-dashed border-border p-6 text-center">
                          <p className="text-sm font-medium text-foreground">No tasks are attached to this matter yet.</p>
                          <p className="mt-1 text-sm text-muted-foreground">
                            Use the form below to add a template task from the firm’s workflow library.
                          </p>
                        </div>
                      )}
                    </div>

                    <Separator />

                    <div className="space-y-4 rounded-lg border border-border bg-secondary/20 p-4">
                      <div>
                        <p className="text-sm font-semibold text-foreground">Add workflow task</p>
                        <p className="text-xs text-muted-foreground">
                          Select a task template, assign it, and set a deadline.
                        </p>
                      </div>

                      <div className="grid gap-3">
                        <Select
                          value={taskDraft.template}
                          onValueChange={(value) => setTaskDraft((current) => ({ ...current, template: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Task template" />
                          </SelectTrigger>
                          <SelectContent>
                            {taskTemplates.map((template) => (
                              <SelectItem key={template} value={template}>
                                {template}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>

                        <div className="grid gap-3 sm:grid-cols-2">
                          <Select
                            value={taskDraft.assignee}
                            onValueChange={(value) => setTaskDraft((current) => ({ ...current, assignee: value }))}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Assignee" />
                            </SelectTrigger>
                            <SelectContent>
                              {assigneeOptions.map((name) => (
                                <SelectItem key={name} value={name}>
                                  {name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>

                          <Input
                            type="date"
                            value={taskDraft.due}
                            onChange={(event) => setTaskDraft((current) => ({ ...current, due: event.target.value }))}
                          />
                        </div>

                        <div className="grid gap-3 sm:grid-cols-[1fr_140px]">
                          <Textarea
                            value={taskDraft.notes}
                            onChange={(event) => setTaskDraft((current) => ({ ...current, notes: event.target.value }))}
                            placeholder="Optional notes or scope"
                            className="min-h-24"
                          />
                          <Select
                            value={taskDraft.priority}
                            onValueChange={(value) =>
                              setTaskDraft((current) => ({ ...current, priority: value as CaseTask["priority"] }))
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Priority" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="low">Low</SelectItem>
                              <SelectItem value="medium">Medium</SelectItem>
                              <SelectItem value="high">High</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <Button onClick={addWorkflowTask} disabled={!taskDraft.template || !taskDraft.assignee || !taskDraft.due}>
                          Add task
                        </Button>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="documents" className="m-0 flex-1 overflow-y-auto p-5">
                  <div className="space-y-3">
                    {selectedDocuments.map((document) => (
                      <div key={document.id} className="rounded-lg border border-border p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <p className="truncate font-medium text-foreground">{document.name}</p>
                            <p className="mt-1 text-xs text-muted-foreground">
                              {document.type} · {document.size} · Uploaded {formatDate(document.uploadedAt)}
                            </p>
                          </div>
                          <Badge variant="outline" className={document.signed ? "bg-success/10 text-success border-success/20" : "bg-muted text-muted-foreground border-border"}>
                            {document.signed ? "Signed" : "Unsigned"}
                          </Badge>
                        </div>
                        <p className="mt-3 text-xs text-muted-foreground">Uploaded by {document.uploadedBy}</p>
                      </div>
                    ))}

                    {!selectedDocuments.length && (
                      <div className="rounded-lg border border-dashed border-border p-6 text-center">
                        <p className="text-sm font-medium text-foreground">No documents linked to this matter.</p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          Once the document management flow is connected, linked files will appear here.
                        </p>
                      </div>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          ) : (
            <div className="flex h-full min-h-[540px] items-center justify-center p-8 text-center">
              <div className="max-w-sm space-y-2">
                <p className="text-lg font-semibold text-foreground">No matter selected</p>
                <p className="text-sm text-muted-foreground">
                  Choose a case from the table to view the matter dashboard, workflow, and linked documents.
                </p>
              </div>
            </div>
          )}
        </aside>
      </div>

      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>New case</DialogTitle>
            <DialogDescription>
              Create a matter shell with validation so the team can immediately work from a clean record.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-2 sm:grid-cols-2">
            <div className="space-y-2">
              <Input
                value={form.number}
                onChange={(event) => setForm((current) => ({ ...current, number: event.target.value }))}
                placeholder="Case number"
              />
              {formErrors.number && <p className="text-xs text-destructive">{formErrors.number}</p>}
            </div>

            <div className="space-y-2">
              <Input
                value={form.client}
                onChange={(event) => setForm((current) => ({ ...current, client: event.target.value }))}
                placeholder="Client name"
              />
              {formErrors.client && <p className="text-xs text-destructive">{formErrors.client}</p>}
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Input
                value={form.title}
                onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
                placeholder="Matter title"
              />
              {formErrors.title && <p className="text-xs text-destructive">{formErrors.title}</p>}
            </div>

            <div className="space-y-2">
              <Select
                value={form.practice}
                onValueChange={(value) => setForm((current) => ({ ...current, practice: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Practice area" />
                </SelectTrigger>
                <SelectContent>
                  {practiceOptions.map((practice) => (
                    <SelectItem key={practice} value={practice}>
                      {practice}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {formErrors.practice && <p className="text-xs text-destructive">{formErrors.practice}</p>}
            </div>

            <div className="space-y-2">
              <Input
                value={form.stage}
                onChange={(event) => setForm((current) => ({ ...current, stage: event.target.value }))}
                placeholder="Stage"
              />
              {formErrors.stage && <p className="text-xs text-destructive">{formErrors.stage}</p>}
            </div>

            <div className="space-y-2">
              <Input
                value={form.lead}
                onChange={(event) => setForm((current) => ({ ...current, lead: event.target.value }))}
                placeholder="Lead attorney"
              />
              {formErrors.lead && <p className="text-xs text-destructive">{formErrors.lead}</p>}
            </div>

            <div className="space-y-2">
              <Input
                value={form.court}
                onChange={(event) => setForm((current) => ({ ...current, court: event.target.value }))}
                placeholder="Court"
              />
            </div>

            <div className="space-y-2">
              <Input
                value={form.judge}
                onChange={(event) => setForm((current) => ({ ...current, judge: event.target.value }))}
                placeholder="Judge"
              />
            </div>

            <div className="space-y-2">
              <Input
                type="date"
                value={form.hearingDate}
                onChange={(event) => setForm((current) => ({ ...current, hearingDate: event.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Select
                value={form.priority}
                onValueChange={(value) => setForm((current) => ({ ...current, priority: value as NewCaseForm["priority"] }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Input
                type="date"
                value={form.nextDeadline}
                onChange={(event) => setForm((current) => ({ ...current, nextDeadline: event.target.value }))}
              />
              {formErrors.nextDeadline && <p className="text-xs text-destructive">{formErrors.nextDeadline}</p>}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </Button>
            <Button onClick={submitCaseForm}>Create case</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
