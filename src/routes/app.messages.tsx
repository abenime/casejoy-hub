import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Send, Search } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useApi } from "@/lib/use-api";
import { api } from "@/lib/api";
import { PageHeader } from "@/components/ui-shared";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export const Route = createFileRoute("/app/messages")({
  component: MessagesPage,
});

function MessagesPage() {
  const { user } = useAuth();
  const { data: messages } = useApi(() => api.getMessages(user!), [user?.id]);
  const [activeCase, setActiveCase] = useState<string | null>(null);
  const [draft, setDraft] = useState("");

  const threads = useMemo(() => {
    const map = new Map<string, typeof messages>();
    (messages ?? []).forEach((m) => {
      const arr = map.get(m.caseId) ?? [];
      arr.push(m);
      map.set(m.caseId, arr);
    });
    return Array.from(map.entries());
  }, [messages]);

  const selected = activeCase ?? threads[0]?.[0] ?? null;
  const thread = threads.find(([k]) => k === selected)?.[1] ?? [];

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col">
      <PageHeader title="Messages" description="Secure communication between your legal team and clients." />
      <div className="flex flex-1 overflow-hidden">
        {/* Threads list */}
        <div className="hidden w-72 shrink-0 flex-col border-r border-border bg-card md:flex">
          <div className="border-b border-border p-3">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search threads…" className="h-9 pl-9" />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {threads.map(([caseId, msgs]) => {
              const last = msgs![msgs!.length - 1];
              const isActive = selected === caseId;
              return (
                <button
                  key={caseId}
                  onClick={() => setActiveCase(caseId)}
                  className={`flex w-full items-start gap-3 border-b border-border px-4 py-3 text-left transition-colors ${
                    isActive ? "bg-secondary" : "hover:bg-secondary/50"
                  }`}
                >
                  <Avatar className="h-9 w-9">
                    <AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">
                      {last.fromName.split(" ").map((n) => n[0]).slice(0, 2).join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">Case {caseId}</p>
                    <p className="truncate text-xs text-muted-foreground">{last.body}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Conversation */}
        <div className="flex flex-1 flex-col bg-background">
          <div className="border-b border-border bg-card px-6 py-4">
            <p className="text-sm font-semibold text-foreground">Conversation · Case {selected}</p>
            <p className="text-xs text-muted-foreground">End-to-end encrypted</p>
          </div>
          <div className="flex-1 space-y-4 overflow-y-auto p-6">
            {thread.map((m) => {
              const mine = m.from === user!.id;
              return (
                <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-md rounded-lg px-4 py-2.5 text-sm ${
                      mine
                        ? "bg-primary text-primary-foreground"
                        : "border border-border bg-card text-foreground"
                    }`}
                  >
                    {!mine && <p className="mb-0.5 text-xs font-semibold opacity-75">{m.fromName}</p>}
                    <p>{m.body}</p>
                    <p className={`mt-1 text-[10px] ${mine ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                      {new Date(m.at).toLocaleString()}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="border-t border-border bg-card p-4">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                setDraft("");
              }}
              className="flex gap-2"
            >
              <Input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="Type a message…"
                className="flex-1"
              />
              <Button type="submit">
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
