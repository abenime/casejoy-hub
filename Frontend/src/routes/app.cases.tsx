import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Plus, Filter, AlertTriangle, FileText, FileCheck, Check, Clock, CalendarDays, Briefcase, Eye } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useApi } from "@/lib/use-api";
import { api } from "@/lib/api";
import { PageHeader, statusColor } from "@/components/ui-shared";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";

export const Route = createFileRoute("/app/cases")({
  component: CasesPage,
});

function CasesPage() {
  const { user, isClient } = useAuth();
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
    <div>
      <PageHeader
        title={isClient ? "Your matters" : "Cases"}
        description={isClient ? "Every matter your firm is handling for you. Click any case row to inspect records." : "All matters across the firm. Click any case row to inspect records."}
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
        <div className="overflow-hidden rounded-lg border border-border bg-card shadow-2xs">
          <table className="w-full text-sm">
            <thead className="bg-secondary/60 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-5 py-3 text-left font-medium">Case number</th>
                <th className="px-5 py-3 text-left font-medium">Title</th>
                {!isClient && <th className="px-5 py-3 text-left font-medium">Client</th>}
                <th className="px-5 py-3 text-left font-medium">Practice</th>
                <th className="px-5 py-3 text-left font-medium">Stage</th>
                <th className="px-5 py-3 text-left font-medium">Lead Counsel</th>
                <th className="px-5 py-3 text-left font-medium">Deadline</th>
                <th className="px-5 py-3 text-left font-medium">Priority</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {casesLoading && (
                <tr>
                  <td colSpan={8} className="px-5 py-10 text-center text-muted-foreground">
                    Loading matters...
                  </td>
                </tr>
              )}
              {!casesLoading && (initialCases ?? []).length === 0 && (
                <tr>
                  <td colSpan={8} className="px-5 py-10 text-center text-muted-foreground">
                    No active case files found.
                  </td>
                </tr>
              )}
              {(initialCases ?? []).map((c) => (
                <tr 
                  key={c.id} 
                  onClick={() => {
                    setSelectedCase(c);
                    setCaseDialogOpen(true);
                  }}
                  className="transition-colors hover:bg-muted/40 cursor-pointer font-medium"
                >
                  <td className="px-5 py-3.5 font-mono text-xs text-primary font-bold">{c.number}</td>
                  <td className="px-5 py-3.5 font-semibold text-foreground">{c.title}</td>
                  {!isClient && <td className="px-5 py-3.5 text-foreground">{c.client}</td>}
                  <td className="px-5 py-3.5 text-muted-foreground">{c.practice}</td>
                  <td className="px-5 py-3.5">
                    <Badge variant="outline" className={`font-semibold capitalize ${statusColor(c.status)}`}>
                      {c.stage}
                    </Badge>
                  </td>
                  <td className="px-5 py-3.5 text-muted-foreground">{c.lead}</td>
                  <td className="px-5 py-3.5 text-foreground font-semibold">
                    {c.nextDeadline ? (
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5 text-destructive shrink-0" /> {c.nextDeadline}
                      </span>
                    ) : "—"}
                  </td>
                  <td className="px-5 py-3.5">
                    <Badge variant="outline" className={`font-semibold ${statusColor(c.priority)}`}>
                      {c.priority}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* CASE DETAILS DIALOG */}
      {selectedCase && (
        <Dialog open={caseDialogOpen} onOpenChange={setCaseDialogOpen}>
          <DialogContent className="sm:max-w-[550px]">
            <DialogHeader>
              <div className="flex items-center justify-between pr-4">
                <Badge variant="outline" className={`text-[9px] font-bold uppercase tracking-wider py-0.5 px-2 ${statusColor(selectedCase.status)}`}>
                  {selectedCase.status.toUpperCase()}
                </Badge>
                <span className="text-[10px] text-muted-foreground font-semibold">Opened: {selectedCase.openedAt}</span>
              </div>
              <DialogTitle className="text-base font-bold text-foreground mt-1.5 flex items-center gap-2">
                <Briefcase className="h-4.5 w-4.5 text-muted-foreground" /> {selectedCase.number} — {selectedCase.title}
              </DialogTitle>
              <DialogDescription>
                Detailed overview of legal file records.
              </DialogDescription>
            </DialogHeader>

            <div className="grid grid-cols-2 gap-4 border-y border-border py-4 text-xs">
              <div className="space-y-3">
                <div>
                  <p className="font-semibold text-muted-foreground text-[10px] uppercase tracking-wider">Practice Specialty</p>
                  <p className="text-foreground font-bold mt-0.5 text-sm">{selectedCase.practice}</p>
                </div>
                <div>
                  <p className="font-semibold text-muted-foreground text-[10px] uppercase tracking-wider">Matter Client</p>
                  <p className="text-foreground font-medium mt-0.5">{selectedCase.client}</p>
                </div>
                <div>
                  <p className="font-semibold text-muted-foreground text-[10px] uppercase tracking-wider">Next Filing Deadline</p>
                  <p className="text-destructive font-semibold mt-0.5 flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" /> {selectedCase.nextDeadline || "No pending deadlines"}
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <p className="font-semibold text-muted-foreground text-[10px] uppercase tracking-wider">Lead Counsel</p>
                  <p className="text-foreground font-medium mt-0.5">{selectedCase.lead}</p>
                </div>
                <div>
                  <p className="font-semibold text-muted-foreground text-[10px] uppercase tracking-wider">Milestone Stage</p>
                  <p className="text-foreground font-medium mt-0.5">{selectedCase.stage}</p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <p className="font-semibold text-muted-foreground text-[10px] uppercase tracking-wider">Billable Hours</p>
                    <p className="text-foreground font-bold mt-0.5 tabular-nums">{selectedCase.billable} hrs</p>
                  </div>
                  <div>
                    <p className="font-semibold text-muted-foreground text-[10px] uppercase tracking-wider">Caseload Priority</p>
                    <Badge variant="outline" className={`mt-0.5 text-[9px] py-0 px-2 ${statusColor(selectedCase.priority)}`}>
                      {selectedCase.priority.toUpperCase()}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>

            {/* Documents linked directly inside Case Details Dialog */}
            <div className="space-y-2.5 pt-2">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Matter Documents & Vault Files</p>
              {documents.filter(d => d.caseId === selectedCase.id).length === 0 ? (
                <p className="text-xs text-muted-foreground italic">No document uploads registered on this case record.</p>
              ) : (
                <div className="max-h-36 overflow-y-auto space-y-1.5 pr-2">
                  {documents.filter(d => d.caseId === selectedCase.id).map(d => (
                    <div 
                      key={d.id} 
                      onClick={() => {
                        setCaseDialogOpen(false);
                        setSelectedDoc(d);
                        setDocDialogOpen(true);
                      }}
                      className="p-2.5 border border-border/80 rounded-md bg-muted/20 hover:bg-primary/5 transition-colors flex items-center justify-between text-xs cursor-pointer group"
                    >
                      <span className="font-semibold text-foreground group-hover:text-primary transition-colors flex items-center gap-1.5">
                        <FileText className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary shrink-0" />
                        {d.name}
                      </span>
                      <div className="flex items-center gap-2">
                        {d.signed ? (
                          <Badge variant="outline" className="text-[8px] bg-success/10 text-success border-success/20 font-bold py-0">SIGNED</Badge>
                        ) : (
                          <Badge variant="outline" className="text-[8px] bg-amber-500/10 text-amber-600 border-amber-500/20 font-bold py-0">PENDING</Badge>
                        )}
                        <span className="text-[9px] text-muted-foreground font-semibold uppercase">{d.type}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" onClick={() => setCaseDialogOpen(false)} className="text-xs bg-primary text-primary-foreground hover:bg-primary/95">
                Close Case Profile
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* DOCUMENT PREVIEW DIALOG */}
      {selectedDoc && (
        <Dialog open={docDialogOpen} onOpenChange={setDocDialogOpen}>
          <DialogContent className="sm:max-w-[620px]">
            <DialogHeader>
              <div className="flex items-center justify-between pr-4">
                <Badge variant="outline" className="text-[9px] font-bold uppercase tracking-wider py-0.5 px-2 bg-secondary text-secondary-foreground">
                  {selectedDoc.type.toUpperCase()}
                </Badge>
                <span className="text-[10px] text-muted-foreground font-semibold">Size: {selectedDoc.size}</span>
              </div>
              <DialogTitle className="text-base font-bold text-foreground mt-1">
                {selectedDoc.name}
              </DialogTitle>
              <DialogDescription>
                Uploaded by {selectedDoc.uploadedBy} on {selectedDoc.uploadedAt}
              </DialogDescription>
            </DialogHeader>

            {/* Mock legal text document container - A4 paper type */}
            <div className="space-y-3 pt-1">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">File Content Preview (A4 Page)</p>
              <div className="rounded-lg bg-slate-200/70 dark:bg-slate-900 border border-border max-h-[500px] overflow-y-auto p-6 flex flex-col items-center gap-6 shadow-inner">
                {getMockDocumentPages(selectedDoc.name, selectedDoc).map((pageText, index, arr) => {
                  const isPleading = selectedDoc.name.toLowerCase().includes("complaint") || selectedDoc.type?.toLowerCase() === "pleading";
                  const isTrust = selectedDoc.name.toLowerCase().includes("trust") || selectedDoc.name.toLowerCase().includes("agreement");
                  const isPatent = selectedDoc.name.toLowerCase().includes("patent");

                  return (
                    <div
                      key={index}
                      className="w-full max-w-[460px] min-h-[600px] bg-white text-slate-900 shadow-md border border-slate-200/80 relative select-text text-left flex flex-col justify-between overflow-hidden"
                    >
                      {/* Pleading style: numbers 1 to 28 down the left side */}
                      {isPleading && (
                        <div className="absolute left-0 top-0 bottom-0 w-9 border-r-2 border-double border-red-300/80 select-none flex flex-col pt-10 pb-10 font-mono text-[8px] text-red-400/50 text-right pr-2">
                          {Array.from({ length: 28 }, (_, i) => (
                            <div key={i} style={{ height: '18px' }} className="flex items-center justify-end">
                              {i + 1}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Page Content */}
                      <div className={`flex-1 pt-10 pb-8 ${isPleading ? 'pl-12 pr-6 font-serif text-[10px] leading-[18px]' : 'px-8 md:px-10 font-serif text-[10px] leading-relaxed'}`}>
                        {/* Letterhead / Header */}
                        {!isPleading && (
                          <div className="border-b border-slate-100 pb-1.5 mb-4 flex justify-between text-[7px] uppercase tracking-widest text-slate-400 font-sans select-none">
                            <span>CaseJoy Practice Group</span>
                            <span>Confidential Legal Doc</span>
                          </div>
                        )}

                        {/* Dynamic Watermark for Patents */}
                        {isPatent && (
                          <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.03] select-none rotate-12">
                            <span className="text-3xl font-extrabold tracking-widest text-slate-900 border-4 border-slate-900 p-3">USPTO PATENT</span>
                          </div>
                        )}

                        {/* Text */}
                        <div className="whitespace-pre-wrap">{pageText}</div>
                      </div>

                      {/* Footer */}
                      <div className={`px-8 pb-3 flex justify-between items-center text-[7px] text-slate-400 font-sans border-t border-slate-50 pt-1.5 select-none ${isPleading ? 'pl-12' : ''}`}>
                        <span className="truncate max-w-[180px]">{selectedDoc.name}</span>
                        <span>Page {index + 1} of {arr.length}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <DialogFooter className="pt-4 flex flex-row items-center justify-between sm:justify-between gap-2 border-t border-border/60">
              {/* E-sign Button */}
              {!selectedDoc.signed ? (
                <Button
                  type="button"
                  onClick={() => handleSignDocument(selectedDoc.id)}
                  className="cursor-pointer bg-emerald-600 hover:bg-emerald-700 text-white border border-emerald-500 text-xs py-1.5 h-8 font-semibold flex items-center gap-1"
                >
                  <FileCheck className="h-3.5 w-3.5" /> Sign & Authorize
                </Button>
              ) : (
                <div className="flex items-center gap-1 text-emerald-600 font-bold text-xs select-none">
                  <Check className="h-4 w-4 bg-emerald-100 rounded-full p-0.5" /> Authorized & E-Signed
                </div>
              )}
              <Button type="button" onClick={() => setDocDialogOpen(false)} className="text-xs h-8 px-4 bg-primary text-primary-foreground hover:bg-primary/95">
                Close Preview
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
