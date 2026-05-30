import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Scale, Loader2, ArrowLeft } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export const Route = createFileRoute("/signup")({
  component: SignupPage,
});

function SignupPage() {
  const { user, login, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!authLoading && user) {
      navigate({ to: "/app" });
    }
  }, [user, authLoading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setSubmitting(true);
    try {
      // Create user account (defaults to 'client' role)
      await api.signUp(name, email, password, phone);

      // Automatically log them in
      const loggedIn = await login(email, password);
      if (loggedIn) {
        toast.success("Account created successfully!");
        navigate({ to: "/app" });
      } else {
        toast.error("Failed to authenticate after signup");
      }
    } catch (err: any) {
      toast.error(err.message || "Signup failed");
    } finally {
      setSubmitting(false);
    }
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
            <h2 className="text-2xl font-semibold tracking-tight text-slate-900">Create an account</h2>
            <p className="text-sm text-slate-500">Register for your client account.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-slate-700">Full Name</Label>
            <Input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="John Doe"
              className="border-slate-300 focus-visible:ring-slate-900"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email" className="text-slate-700">Email address</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="name@example.com"
              autoComplete="email"
              className="border-slate-300 focus-visible:ring-slate-900"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone" className="text-slate-700">Phone number</Label>
            <Input
              id="phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
              placeholder="+1 (555) 000-0000"
              autoComplete="tel"
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
              autoComplete="new-password"
              className="border-slate-300 focus-visible:ring-slate-900"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword" className="text-slate-700">Confirm Password</Label>
            <Input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              autoComplete="new-password"
              className="border-slate-300 focus-visible:ring-slate-900"
            />
          </div>
          <Button type="submit" className="w-full bg-slate-900 hover:bg-slate-800 text-white h-10 mt-2" disabled={submitting}>
            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create account
          </Button>
        </form>

        <div className="text-center text-sm pt-2">
          <span className="text-slate-500">Already have an account? </span>
          <button
            type="button"
            className="font-semibold text-slate-900 hover:underline bg-transparent border-none p-0 cursor-pointer"
            onClick={() => navigate({ to: "/login" })}
          >
            Sign in
          </button>
        </div>
      </div>
    </div>
  );
}
