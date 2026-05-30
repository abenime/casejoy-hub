import { createFileRoute } from "@tanstack/react-router";
import { Sparkles, FileText, Search, Calendar, Scale, MessageSquare } from "lucide-react";
import { PageHeader } from "@/components/ui-shared";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/app/ai")({
  component: AIPage,
});

const TOOLS = [
  {
    icon: MessageSquare,
    title: "Client intake assistant",
    desc: "Auto-screen new clients with tailored questionnaires.",
  },
  {
    icon: FileText,
    title: "Document drafting",
    desc: "Generate contracts, motions, and letters from templates.",
  },
  {
    icon: Scale,
    title: "Contract review",
    desc: "Flag risky clauses and missing provisions in seconds.",
  },
  {
    icon: Search,
    title: "Legal research",
    desc: "Find precedent, statutes, and citations across jurisdictions.",
  },
  {
    icon: Sparkles,
    title: "Case summaries",
    desc: "Distill long case files into briefable executive summaries.",
  },
  {
    icon: Calendar,
    title: "Deadline recommender",
    desc: "Suggest filing deadlines based on case type and jurisdiction.",
  },
];

function AIPage() {
  return (
    <div>
      <PageHeader
        title="AI Assistant"
        description="Augment your practice with built-in legal AI tools."
      />
      <div className="space-y-6 p-6">
        <div className="rounded-lg border border-border bg-gradient-to-br from-card to-secondary p-6">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-accent" />
            <h2 className="text-base font-semibold text-foreground">Ask anything</h2>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Get answers, draft documents, summarize matters, or research case law.
          </p>
          <Textarea
            className="mt-4 min-h-24 bg-card"
            placeholder='e.g. "Summarize the Whitaker v. Northbridge discovery so far and list the open items."'
          />
          <div className="mt-3 flex justify-end">
            <Button>
              <Sparkles className="mr-2 h-4 w-4" /> Generate
            </Button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {TOOLS.map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.title}
                className="rounded-lg border border-border bg-card p-5 text-left transition-all hover:border-accent hover:shadow-sm"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-md bg-accent/10 text-accent">
                  <Icon className="h-5 w-5" />
                </div>
                <p className="mt-4 font-medium text-foreground">{t.title}</p>
                <p className="mt-1 text-sm text-muted-foreground">{t.desc}</p>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
