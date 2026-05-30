import { createFileRoute, Outlet, useNavigate, Link, useRouterState } from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";
import {
  LayoutDashboard,
  Briefcase,
  Users,
  Calendar,
  FileText,
  MessagesSquare,
  Receipt,
  BarChart3,
  Sparkles,
  Settings,
  Scale,
  LogOut,
  Bell,
  Search,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export const Route = createFileRoute("/app")({
  component: AppLayout,
});

type NavItem = { to: string; label: string; icon: typeof Briefcase; roles: string[] };

const NAV: NavItem[] = [
  {
    to: "/app",
    label: "Dashboard",
    icon: LayoutDashboard,
    roles: ["admin", "lawyer", "paralegal", "client"],
  },
  {
    to: "/app/cases",
    label: "Cases",
    icon: Briefcase,
    roles: ["admin", "lawyer", "paralegal", "client"],
  },
  { to: "/app/clients", label: "Clients", icon: Users, roles: ["admin", "lawyer", "paralegal"] },
  {
    to: "/app/calendar",
    label: "Calendar",
    icon: Calendar,
    roles: ["admin", "lawyer", "paralegal", "client"],
  },
  {
    to: "/app/documents",
    label: "Documents",
    icon: FileText,
    roles: ["admin", "lawyer", "paralegal", "client"],
  },
  {
    to: "/app/messages",
    label: "Messages",
    icon: MessagesSquare,
    roles: ["admin", "lawyer", "paralegal", "client"],
  },
  { to: "/app/billing", label: "Billing", icon: Receipt, roles: ["admin", "lawyer", "client"] },
  { to: "/app/analytics", label: "Analytics", icon: BarChart3, roles: ["admin", "lawyer"] },
  { to: "/app/ai", label: "AI Assistant", icon: Sparkles, roles: ["admin", "lawyer", "paralegal"] },
  { to: "/app/settings", label: "Settings", icon: Settings, roles: ["admin"] },
];

function AppLayout() {
  const { user, loading, logout, isClient } = useAuth();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/login" });
  }, [user, loading, navigate]);

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  const items = NAV.filter((i) => i.roles.includes(user.role));

  return (
    <div className="flex min-h-screen w-full bg-background">
      {/* Sidebar */}
      <aside className="hidden w-60 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground lg:flex">
        <div className="flex h-16 items-center gap-3 border-b border-sidebar-border px-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-accent text-accent-foreground">
            <Scale className="h-4 w-4" />
          </div>
          <div className="leading-tight">
            <p className="text-sm font-semibold tracking-wide">VANCE &amp; HALE</p>
            <p className="text-[10px] uppercase tracking-wider text-sidebar-foreground/50">
              {isClient ? "Client Portal" : "Firm Workspace"}
            </p>
          </div>
        </div>

        <nav className="flex-1 space-y-0.5 overflow-y-auto px-2 py-4">
          {items.map((item) => {
            const Icon = item.icon;
            const active = item.to === "/app" ? pathname === "/app" : pathname.startsWith(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                className={[
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                  active
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground/75 hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground",
                ].join(" ")}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-sidebar-border p-3">
          <div className="flex items-center gap-3 rounded-md px-2 py-2">
            <Avatar className="h-9 w-9">
              <AvatarFallback className="bg-accent text-accent-foreground text-xs font-semibold">
                {user.avatar}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{user.name}</p>
              <p className="truncate text-xs text-sidebar-foreground/60">{user.title}</p>
            </div>
            <button
              onClick={() => {
                logout();
                navigate({ to: "/login" });
              }}
              className="rounded-md p-1.5 text-sidebar-foreground/60 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground"
              aria-label="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 items-center gap-4 border-b border-border bg-card px-6">
          <div className="relative hidden max-w-md flex-1 md:block">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={
                isClient ? "Search your cases & documents…" : "Search cases, clients, documents…"
              }
              className="h-9 pl-9"
            />
          </div>
          <div className="ml-auto flex items-center gap-3">
            <Badge variant="secondary" className="hidden capitalize sm:inline-flex">
              {user.role}
            </Badge>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                  <Bell className="h-4 w-4" />
                  <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-accent" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80">
                <DropdownMenuLabel>Notifications</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="flex flex-col items-start gap-1 p-3 cursor-pointer">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-accent" />
                    <p className="text-sm font-medium">New message from Marcus Hale</p>
                  </div>
                  <p className="text-xs text-muted-foreground ml-4">
                    "James — the status conference is confirmed..."
                  </p>
                  <p className="text-[10px] text-muted-foreground ml-4 mt-1">2 hours ago</p>
                </DropdownMenuItem>
                <DropdownMenuItem className="flex flex-col items-start gap-1 p-3 cursor-pointer">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-transparent border border-muted-foreground" />
                    <p className="text-sm font-medium">Document requested</p>
                  </div>
                  <p className="text-xs text-muted-foreground ml-4">
                    Please upload your W-2 for Case C2.
                  </p>
                  <p className="text-[10px] text-muted-foreground ml-4 mt-1">Yesterday</p>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="justify-center text-accent cursor-pointer">
                  View all notifications
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Avatar className="h-8 w-8 lg:hidden">
              <AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">
                {user.avatar}
              </AvatarFallback>
            </Avatar>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2 border-b border-border bg-card px-6 py-6 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">{title}</h1>
        {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}
