import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Scale, Loader2, ArrowLeft } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

const DEMO_ACCOUNTS = [
  { label: "Managing Partner", email: "admin@firm.com", password: "admin" },
  { label: "Senior Associate", email: "lawyer@firm.com", password: "lawyer" },
  { label: "Paralegal", email: "paralegal@firm.com", password: "paralegal" },
  { label: "Client Portal - James", email: "client@firm.com", password: "client" },
  { label: "Client Portal - Ana", email: "client2@firm.com", password: "client" },
];

function LoginPage() {
  const { user, login, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("admin@firm.com");
  const [password, setPassword] = useState("admin");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!authLoading && user) navigate({ to: "/app" });
  }, [user, authLoading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const result = await login(email, password);
    setSubmitting(false);
    if (result) {
      toast.success(`Welcome back, ${result.name.split(" ")[0]}`);
      navigate({ to: "/app" });
    } else {
      toast.error("Invalid credentials");
    }
  };

  const quickFill = (acc: (typeof DEMO_ACCOUNTS)[number]) => {
    setEmail(acc.email);
    setPassword(acc.password);
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 p-6 sm:p-12 relative">
      <div className="absolute top-4 left-4 sm:top-8 sm:left-8">
        <Button
          variant="ghost"
          onClick={() => navigate({ to: "/" })}
          className="gap-2 text-slate-600 hover:text-slate-900 hover:bg-slate-200/50"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Home
        </Button>
      </div>

      <div className="w-full max-w-sm space-y-8 bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex flex-col items-center text-center space-y-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-900 text-white shadow-sm">
            <Scale className="h-6 w-6" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold tracking-tight text-slate-900">Sign in</h2>
            <p className="text-sm text-slate-500">
              Access your firm workspace or client portal.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-slate-700">Work email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              className="border-slate-300 focus-visible:ring-slate-900"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password" className="text-slate-700">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              className="border-slate-300 focus-visible:ring-slate-900"
            />
          </div>
          <Button type="submit" className="w-full bg-slate-900 hover:bg-slate-800 text-white h-10" disabled={submitting}>
            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Sign in
          </Button>
        </form>

        <div className="text-center text-sm">
          <span className="text-slate-500">Don't have an account? </span>
          <button
            type="button"
            className="font-semibold text-slate-900 hover:underline bg-transparent border-none p-0 cursor-pointer"
            onClick={() => navigate({ to: "/signup" })}
          >
            Sign up
          </button>
        </div>

        <div className="space-y-3 pt-4 border-t border-slate-100">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 text-center">
            Demo accounts
          </p>
          <div className="grid grid-cols-2 gap-2">
            {DEMO_ACCOUNTS.map((acc) => (
              <button
                key={acc.email}
                type="button"
                onClick={() => quickFill(acc)}
                className="rounded-lg border border-slate-200 bg-slate-50 p-2 text-left text-xs transition-colors hover:border-slate-300 hover:bg-slate-100"
              >
                <p className="font-medium text-slate-900">{acc.label}</p>
                <p className="truncate text-slate-500">{acc.email}</p>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
