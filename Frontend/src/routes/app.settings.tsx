import { createFileRoute } from "@tanstack/react-router";
import React, { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useApi } from "@/lib/use-api";
import { api, type User, type Role } from "@/lib/api";
import { PageHeader } from "@/components/ui-shared";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { DataTable } from "@/components/ui/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { Dropdown } from "@/components/ui/dropdown";
import { toast } from "sonner";

// --- Form State Persistence & Recovery Hook ---
function useFormDraft<T>(key: string, defaultValues: T) {
  const [draft, setDraft] = useState<T | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem(key);
    if (saved) {
      try {
        setDraft(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse draft", e);
      }
    }
  }, [key]);

  const saveDraft = (data: T) => {
    localStorage.setItem(key, JSON.stringify(data));
  };

  const clearDraft = () => {
    localStorage.removeItem(key);
    setDraft(null);
  };

  return { draft, saveDraft, clearDraft };
}

// --- Security & Audit Logging Hook ---
function useAuditLog() {
  const logAction = (action: string, details: Record<string, any>) => {
    // In a real application, send this to the backend API
    console.log(`[AUDIT LOG] ${action}`, { ...details, timestamp: new Date().toISOString() });
  };
  return { logAction };
}

// --- Firm Details Schema ---
const firmDetailsSchema = z.object({
  firmName: z.string().min(2, "Firm name must be at least 2 characters"),
  domain: z.string().url("Must be a valid URL"),
  primaryColor: z.string().regex(/^#([0-9a-f]{3}){1,2}$/i, "Invalid hex color"),
  accentColor: z.string().regex(/^#([0-9a-f]{3}){1,2}$/i, "Invalid hex color"),
});
type FirmDetailsFormValues = z.infer<typeof firmDetailsSchema>;

export const Route = createFileRoute("/app/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  const { user } = useAuth();

  if (user?.role === "admin") {
    return (
      <div className="pb-10 bg-gradient-to-b from-background via-background to-secondary/10 min-h-screen">
        <PageHeader title="Settings" description="Firm profile, team, and configuration." />
        <div className="p-6 flex justify-center">
          <Tabs defaultValue="firm" className="w-full max-w-4xl">
            <div className="flex justify-center mb-8">
              <TabsList className="grid w-full max-w-md grid-cols-3 bg-secondary/50">
                <TabsTrigger value="firm">Firm Details</TabsTrigger>
                <TabsTrigger value="users">User Management</TabsTrigger>
                <TabsTrigger value="permissions">Permissions Matrix</TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="firm" className="flex justify-center">
              <FirmDetailsTab />
            </TabsContent>

            <TabsContent value="users" className="flex justify-center">
              <UserManagementTab />
            </TabsContent>

            <TabsContent value="permissions" className="flex justify-center">
              <PermissionsMatrixTab />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    );
  }

  // Non-admin users see "My Profile"
  return (
    <div className="pb-10 bg-gradient-to-b from-background via-background to-secondary/10">
      <PageHeader title="Profile" description="Manage your account and profile details." />
      <div className="p-6">
        <MyProfileTab />
      </div>
    </div>
  );
}

function MyProfileTab() {
  const { user, refreshSession } = useAuth();
  const [name, setName] = useState(user?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [saving, setSaving] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  if (!user) return null;

  const hasChanges = name !== user.name || email !== user.email || phone !== (user.phone ?? "");

  const handleSaveClick = () => {
    if (!name.trim() || !email.trim()) {
      toast.error("Name and Email are required.");
      return;
    }
    setConfirmOpen(true);
  };

  const handleConfirmSave = async () => {
    setSaving(true);
    try {
      await api.updateUserProfile(user.id, name.trim(), email.trim(), phone.trim());
      refreshSession();
      toast.success("Profile updated successfully!");
      setConfirmOpen(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to update profile.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="flex justify-center items-center min-h-[calc(100vh-200px)] px-4 py-8">
        <div className="w-full max-w-md">
          <div className="rounded-xl border border-border bg-gradient-to-br from-card via-card to-secondary/30 p-8 shadow-lg">
            {/* Profile Avatar */}
            <div className="flex flex-col items-center mb-8">
              <div className="relative mb-4">
                <Avatar className="h-24 w-24 border-4 border-primary/30 shadow-lg bg-gradient-to-br from-primary to-accent">
                  <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-2xl font-bold text-primary-foreground">
                    {user.avatar}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute bottom-0 right-0 h-6 w-6 rounded-full bg-success border-2 border-card"></div>
              </div>
              <h1 className="text-2xl font-bold text-foreground text-center">{user.name}</h1>
              <Badge className="mt-2 bg-primary/20 text-primary border-primary/30 capitalize">
                {user.role === "client" ? "Client" : user.title}
              </Badge>
            </div>

            {/* Divider */}
            <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent mb-8"></div>

            {/* Form Fields */}
            <div className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="profileName" className="text-sm font-semibold text-foreground">
                  Full Name
                </Label>
                <Input
                  id="profileName"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your full name"
                  className="h-10 border-border bg-secondary/40 focus:bg-card transition-colors"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="profileEmail" className="text-sm font-semibold text-foreground">
                  Email Address
                </Label>
                <Input
                  id="profileEmail"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="h-10 border-border bg-secondary/40 focus:bg-card transition-colors"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="profilePhone" className="text-sm font-semibold text-foreground">
                  Phone Number
                </Label>
                <Input
                  id="profilePhone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+251987654321"
                  className="h-10 border-border bg-secondary/40 focus:bg-card transition-colors"
                />
              </div>

              <div className="flex justify-between gap-3 pt-6">
                <Button variant="outline" className="flex-1">
                  Cancel
                </Button>
                <Button 
                  onClick={handleSaveClick} 
                  disabled={!hasChanges || saving}
                  className="flex-1 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
                >
                  {saving ? "Saving…" : "Save Changes"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Dialog */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="sm:max-w-md border-border bg-gradient-to-br from-card to-secondary/20">
          <DialogHeader>
            <DialogTitle className="text-xl text-foreground">Confirm Profile Update</DialogTitle>
            <DialogDescription>
              Please review the changes to your profile below.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-6 border-t border-b border-border">
            {name !== user.name && (
              <div className="flex items-center gap-3 rounded-lg bg-secondary/30 p-3">
                <div className="flex-1">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Name</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-sm line-through text-muted-foreground/60">{user.name}</span>
                    <span className="text-primary font-semibold">→</span>
                    <span className="text-sm font-semibold text-foreground">{name}</span>
                  </div>
                </div>
              </div>
            )}
            {email !== user.email && (
              <div className="flex items-center gap-3 rounded-lg bg-secondary/30 p-3">
                <div className="flex-1">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Email</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-sm line-through text-muted-foreground/60">{user.email}</span>
                    <span className="text-primary font-semibold">→</span>
                    <span className="text-sm font-semibold text-foreground">{email}</span>
                  </div>
                </div>
              </div>
            )}
            {phone !== (user.phone ?? "") && (
              <div className="flex items-center gap-3 rounded-lg bg-secondary/30 p-3">
                <div className="flex-1">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Phone</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-sm line-through text-muted-foreground/60">{user.phone || "—"}</span>
                    <span className="text-primary font-semibold">→</span>
                    <span className="text-sm font-semibold text-foreground">{phone || "—"}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
          <DialogFooter className="flex gap-2 pt-4">
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleConfirmSave} 
              disabled={saving}
              className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
            >
              {saving ? "Saving…" : "Confirm & Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function FirmDetailsTab() {
  const defaultValues = {
    firmName: "Vance & Hale LLP",
    domain: "https://clients.vancehale.law",
    primaryColor: "#1f2a4d",
    accentColor: "#c89a3c",
  };

  const { draft, saveDraft, clearDraft } = useFormDraft<FirmDetailsFormValues>(
    "firm-settings-draft",
    defaultValues,
  );

  const form = useForm<FirmDetailsFormValues>({
    resolver: zodResolver(firmDetailsSchema),
    defaultValues,
  });

  // Restore draft if available
  useEffect(() => {
    if (draft) {
      if (window.confirm("A draft was found from your last session. Restore it?")) {
        form.reset(draft);
      } else {
        clearDraft();
      }
    }
  }, [draft, form, clearDraft]);

  const onSubmit = (data: FirmDetailsFormValues) => {
    console.log("Saving firm details:", data);
    clearDraft();
    alert("Firm details saved successfully.");
  };

  return (
    <div className="w-full max-w-4xl rounded-xl border border-border bg-card/95 backdrop-blur-md p-8 shadow-lg">
      <h2 className="text-xl font-bold text-foreground">Firm Configuration</h2>
      <p className="mt-1 text-sm text-muted-foreground mb-8">
        Branding visible to clients in the portal.
      </p>

      <form
        onSubmit={form.handleSubmit(onSubmit)}
        onChange={() => saveDraft(form.getValues())}
        className="space-y-6"
      >
        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="firmName">Firm name</Label>
            <Input id="firmName" {...form.register("firmName")} />
            {form.formState.errors.firmName && (
              <p className="text-xs text-destructive">{form.formState.errors.firmName.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="domain">Custom domain</Label>
            <Input id="domain" {...form.register("domain")} />
            {form.formState.errors.domain && (
              <p className="text-xs text-destructive">{form.formState.errors.domain.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="primaryColor">Primary color</Label>
            <Input
              id="primaryColor"
              type="color"
              {...form.register("primaryColor")}
              className="h-10 px-2"
            />
            {form.formState.errors.primaryColor && (
              <p className="text-xs text-destructive">
                {form.formState.errors.primaryColor.message}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="accentColor">Accent color</Label>
            <Input
              id="accentColor"
              type="color"
              {...form.register("accentColor")}
              className="h-10 px-2"
            />
            {form.formState.errors.accentColor && (
              <p className="text-xs text-destructive">
                {form.formState.errors.accentColor.message}
              </p>
            )}
          </div>
        </div>

        <div className="border-t border-border pt-6 mt-6">
          <h3 className="text-sm font-semibold mb-4">System Preferences</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Require 2FA</p>
                <p className="text-xs text-muted-foreground">
                  Force all staff members to use Two-Factor Authentication
                </p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Data Retention Policy</p>
                <p className="text-xs text-muted-foreground">
                  Automatically archive cases inactive for 7 years
                </p>
              </div>
              <Switch />
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <Button type="submit">Save changes</Button>
        </div>
      </form>
    </div>
  );
}

function UserManagementTab() {
  const [refreshKey, setRefreshKey] = useState(0);
  const { data: allUsers } = useApi(() => api.getUsers(), [refreshKey]);
  const { logAction } = useAuditLog();

  const handleRoleChange = async (userId: string, newRole: Role) => {
    try {
      await api.updateUserRole(userId, newRole);
      logAction("ROLE_UPDATE", { targetId: userId, newRole });
      toast.success("User role updated successfully!");
      setRefreshKey((prev) => prev + 1);
    } catch (err: any) {
      toast.error(err.message || "Failed to update user role");
    }
  };

  const columns: ColumnDef<User>[] = [
    {
      accessorKey: "name",
      header: "Name",
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">
              {row.original.avatar}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="text-sm font-medium">{row.original.name}</span>
            <span className="text-xs text-muted-foreground">{row.original.email}</span>
          </div>
        </div>
      ),
    },
    {
      accessorKey: "role",
      header: "Role",
      cell: ({ row }) => (
        <Badge
          variant={row.original.role === "admin" ? "default" : "outline"}
          className="capitalize"
        >
          {row.original.role}
        </Badge>
      ),
    },
    {
      accessorKey: "title",
      header: "Title",
    },
    {
      accessorKey: "phone",
      header: "Phone",
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground">{row.original.phone || "—"}</span>
      ),
    },
    {
      id: "actions",
      cell: ({ row }) => {
        return (
          <Dropdown>
            <Dropdown.Trigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0 cursor-pointer">
                <span className="sr-only">Open menu</span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="lucide lucide-more-horizontal"
                >
                  <circle cx="12" cy="12" r="1" />
                  <circle cx="19" cy="12" r="1" />
                  <circle cx="5" cy="12" r="1" />
                </svg>
              </Button>
            </Dropdown.Trigger>
            <Dropdown.Content align="end">
              <Dropdown.Label>Actions</Dropdown.Label>
              <Dropdown.Item
                className="cursor-pointer"
                onClick={() => handleRoleChange(row.original.id, "admin")}
              >
                Make Admin
              </Dropdown.Item>
              <Dropdown.Item
                className="cursor-pointer"
                onClick={() => handleRoleChange(row.original.id, "lawyer")}
              >
                Make Lawyer
              </Dropdown.Item>
              <Dropdown.Item
                className="cursor-pointer"
                onClick={() => handleRoleChange(row.original.id, "paralegal")}
              >
                Make Paralegal
              </Dropdown.Item>
              <Dropdown.Item
                className="cursor-pointer"
                onClick={() => handleRoleChange(row.original.id, "client")}
              >
                Make Client
              </Dropdown.Item>
              <Dropdown.Separator />
              <Dropdown.Item className="text-destructive cursor-pointer">
                Revoke Access
              </Dropdown.Item>
            </Dropdown.Content>
          </Dropdown>
        );
      },
    },
  ];

  return (
    <div className="w-full max-w-4xl rounded-xl border border-border bg-card/95 backdrop-blur-md p-8 shadow-lg">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground">User Management</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Manage roles and access for the firm's staff and registered clients.
          </p>
        </div>
        <Button>Invite member</Button>
      </div>

      {allUsers && <DataTable columns={columns} data={allUsers} searchKey="name" />}
    </div>
  );
}

function PermissionsMatrixTab() {
  const roles = ["Admin", "Lawyer", "Paralegal", "Client"];
  const features = [
    "Manage Firm Settings",
    "Invite New Users",
    "Delete Cases",
    "Create New Cases",
    "View Billing Info",
    "Message Clients",
    "Upload Documents",
  ];

  const defaultMatrix: Record<string, boolean[]> = {
    "Manage Firm Settings": [true, false, false, false],
    "Invite New Users": [true, false, false, false],
    "Delete Cases": [true, true, false, false],
    "Create New Cases": [true, true, true, false],
    "View Billing Info": [true, true, false, true],
    "Message Clients": [true, true, true, true],
    "Upload Documents": [true, true, true, true],
  };

  return (
    <div className="w-full max-w-4xl rounded-xl border border-border bg-card/95 backdrop-blur-md p-8 shadow-lg overflow-x-auto">
      <h2 className="text-xl font-bold text-foreground mb-1">Roles & Permissions Matrix</h2>
      <p className="text-sm text-muted-foreground mb-8">
        Audit and adjust granular permissions across the system roles.
      </p>

      <table className="w-full text-sm text-left">
        <thead className="bg-muted/50 text-muted-foreground">
          <tr>
            <th className="px-4 py-3 font-medium rounded-tl-md">Feature / Capability</th>
            {roles.map((role, i) => (
              <th
                key={role}
                className={`px-4 py-3 font-medium text-center ${i === roles.length - 1 ? "rounded-tr-md" : ""}`}
              >
                {role}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {features.map((feature) => (
            <tr key={feature} className="hover:bg-muted/30 transition-colors">
              <td className="px-4 py-3 font-medium">{feature}</td>
              {roles.map((role, index) => (
                <td key={`${feature}-${role}`} className="px-4 py-3 text-center">
                  <Checkbox
                    defaultChecked={defaultMatrix[feature][index]}
                    disabled={role === "Admin"}
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
