import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { useSettings } from "@/lib/settings-context";
import { Scale, ShieldCheck, MessageSquareCode, CalendarDays, FileCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  const { user, loading: authLoading } = useAuth();
  const { settings, loading: settingsLoading } = useSettings();
  const navigate = useNavigate();

  const loading = authLoading || settingsLoading;

  useEffect(() => {
    if (loading) return;
    if (user) {
      navigate({ to: "/app" });
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-900 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans relative overflow-hidden">
      {/* Decorative ambient background - Subdued for professional look */}
      <div className="absolute top-0 left-0 w-full h-[60vh] bg-gradient-to-b from-slate-200/50 to-transparent pointer-events-none" />

      {/* Navigation Header */}
      <header className="sticky top-0 z-50 pt-4">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3 select-none">
            {settings.logo_url ? (
              <img src={settings.logo_url} alt="Firm Logo" className="h-10 object-contain rounded-md" />
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-slate-900 text-white border border-slate-800">
                <Scale className="h-5 w-5" />
              </div>
            )}
            <div>
              <p className="text-sm font-bold tracking-widest text-slate-900 uppercase font-serif">
                {settings.firm_name || "Vance & Hale"}
              </p>
              <p className="text-[10px] text-slate-500 tracking-wider font-semibold uppercase">
                {settings.firm_subtitle || "Attorneys at Law"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate({ to: "/login" })}
              className="text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
            >
              Sign In
            </button>
            <Button
              onClick={() => navigate({ to: "/signup" })}
              className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-4 h-9"
            >
              Create Account
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-12 md:py-24 relative z-10 max-w-5xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-slate-200 bg-white text-slate-600 text-[10px] tracking-widest uppercase font-bold mb-6 shadow-sm">
          <ShieldCheck className="h-3.5 w-3.5 text-slate-900" /> SECURE LEGAL PORTAL
        </div>

        <h1 className="text-4xl sm:text-5xl md:text-6xl font-semibold tracking-tight text-slate-900 max-w-4xl leading-[1.15] font-serif">
          {settings.hero_title || "State-of-the-Art Advocacy."}
          <br />
          <span className="text-slate-700">
            {settings.hero_subtitle || "Unified Client Practice Management."}
          </span>
        </h1>

        <p className="mt-6 text-sm sm:text-base text-slate-600 max-w-2xl leading-relaxed whitespace-pre-wrap">
          {settings.hero_description ||
            "Welcome to the Vance & Hale legal platform. Access real-time case analytics, securely review and sign legal pleadings on our multi-page reader desk, exchange encrypted communications, and manage trust accounts."}
        </p>

        <div className="mt-10 flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
          <Button
            size="lg"
            onClick={() => navigate({ to: "/signup" })}
            className="bg-slate-900 hover:bg-slate-800 text-white text-sm font-bold px-8 h-12 shadow-md cursor-pointer"
          >
            Create Account
          </Button>
          <Button
            size="lg"
            variant="outline"
            onClick={() => navigate({ to: "/login" })}
            className="border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-sm font-bold px-8 h-12 cursor-pointer shadow-sm"
          >
            Sign In
          </Button>
        </div>

        {/* Feature Grid */}
        <section className="mt-20 md:mt-32 grid gap-6 sm:grid-cols-3 text-left w-full border-t border-slate-200 pt-16">
          <div className="bg-white border border-slate-200 p-6 rounded-xl hover:border-slate-300 transition-colors shadow-sm hover:shadow-md">
            <div className="h-10 w-10 flex items-center justify-center rounded-lg bg-slate-50 text-slate-700 border border-slate-100 mb-4">
              <FileCheck className="h-5 w-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
              Dynamic Document Vault
            </h3>
            <p className="mt-2 text-xs text-slate-600 leading-relaxed">
              Review pleading briefs on simulated A4 paper sheets, authorize filings with legally
              compliant electronic signatures, and transfer files via our drag-and-drop portal.
            </p>
          </div>

          <div className="bg-white border border-slate-200 p-6 rounded-xl hover:border-slate-300 transition-colors shadow-sm hover:shadow-md">
            <div className="h-10 w-10 flex items-center justify-center rounded-lg bg-slate-50 text-slate-700 border border-slate-100 mb-4">
              <MessageSquareCode className="h-5 w-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
              Encrypted Channels
            </h3>
            <p className="mt-2 text-xs text-slate-600 leading-relaxed">
              Message your senior associates, paralegals, or clients directly inside secure,
              real-time consultation feeds with full notification delivery and updates.
            </p>
          </div>

          <div className="bg-white border border-slate-200 p-6 rounded-xl hover:border-slate-300 transition-colors shadow-sm hover:shadow-md">
            <div className="h-10 w-10 flex items-center justify-center rounded-lg bg-slate-50 text-slate-700 border border-slate-100 mb-4">
              <CalendarDays className="h-5 w-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
              Caseload Calendar
            </h3>
            <p className="mt-2 text-xs text-slate-600 leading-relaxed">
              Track court deadlines, deposition timings, and scheduled mediation events.
              Auto-resolve conflict conflicts utilizing real-time date filters.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}
