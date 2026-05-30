// Mock API — reads from JSON files. Simulates async to mimic real fetches.
import usersData from "@/data/users.json";
import casesData from "@/data/cases.json";
import clientsData from "@/data/clients.json";
import tasksData from "@/data/tasks.json";
import eventsData from "@/data/events.json";
import documentsData from "@/data/documents.json";
import invoicesData from "@/data/invoices.json";
import messagesData from "@/data/messages.json";
import analyticsData from "@/data/analytics.json";

export type Role = "admin" | "lawyer" | "paralegal" | "client";

export interface User {
  id: string;
  email: string;
  password: string;
  name: string;
  role: Role;
  title: string;
  avatar: string;
  caseIds?: string[];
  phone?: string;
}

export interface Case {
  id: string;
  number: string;
  title: string;
  client: string;
  clientId: string | null;
  practice: string;
  stage: string;
  status: "active" | "pending" | "closed" | "archived";
  lead: string;
  court?: string;
  judge?: string;
  hearingDate?: string | null;
  openedAt: string;
  nextDeadline: string | null;
  billable: number;
  priority: "low" | "medium" | "high";
}

const getLocalUsers = (): User[] => {
  if (typeof window === "undefined") return usersData as User[];
  const stored = typeof window !== "undefined" ? localStorage.getItem("casejoy.users") : null;
  if (!stored) {
    if (typeof window !== "undefined") {
      localStorage.setItem("casejoy.users", JSON.stringify(usersData));
    }
    return usersData as User[];
  }
  try {
    return JSON.parse(stored);
  } catch {
    return usersData as User[];
  }
};

const saveLocalUsers = (users: User[]) => {
  if (typeof window !== "undefined") {
    localStorage.setItem("casejoy.users", JSON.stringify(users));
  }
};

const delay = <T>(value: T, ms = 120): Promise<T> =>
  new Promise((resolve) => setTimeout(() => resolve(value), ms));

export const api = {
  // Auth
  async login(email: string, password: string): Promise<User | null> {
    const user = getLocalUsers().find(
      (u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password,
    );
    return delay(user ?? null, 250);
  },

  async signUp(name: string, email: string, password: string, phone?: string): Promise<User> {
    const users = getLocalUsers();
    const exists = users.some((u) => u.email.toLowerCase() === email.toLowerCase());
    if (exists) {
      throw new Error("Email already registered");
    }

    const initials = name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "U";

    const newUser: User = {
      id: `u-${Date.now()}`,
      email,
      password,
      name,
      role: "client",
      title: "Client",
      avatar: initials,
      caseIds: [],
      phone,
    };

    const updated = [...users, newUser];
    saveLocalUsers(updated);
    return delay(newUser, 250);
  },

  async updateUserRole(userId: string, newRole: Role): Promise<User> {
    const users = getLocalUsers();
    let updatedUser: User | null = null;

    const titleMap: Record<Role, string> = {
      admin: "Managing Partner",
      lawyer: "Attorney",
      paralegal: "Paralegal",
      client: "Client",
    };

    const updated = users.map((u) => {
      if (u.id === userId) {
        updatedUser = {
          ...u,
          role: newRole,
          title: titleMap[newRole] || u.title,
        };
        return updatedUser;
      }
      return u;
    });

    if (!updatedUser) {
      throw new Error("User not found");
    }

    saveLocalUsers(updated);

    // Sync session if updating current logged in user
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("lawfirm.auth.user");
      if (stored) {
        try {
          const currentSession = JSON.parse(stored) as User;
          if (currentSession.id === userId) {
            localStorage.setItem("lawfirm.auth.user", JSON.stringify(updatedUser));
          }
        } catch {
          // Ignore
        }
      }
    }

    return delay(updatedUser, 120);
  },

  // Users
  getUsers: () => delay(getLocalUsers()),
  getStaff: () => delay(getLocalUsers().filter((u) => u.role !== "client")),

  // Cases — scoped by role
  async getCases(user: User) {
    const all = casesData as Case[];
    if (user.role === "client") {
      return delay(all.filter((c) => user.caseIds?.includes(c.id)));
    }
    return delay(all);
  },
  getCase: (id: string) => delay((casesData as Case[]).find((c) => c.id === id) ?? null),

  // Clients
  getClients: () => delay(clientsData),

  // Tasks
  async getTasks(user: User) {
    const all = tasksData;
    if (user.role === "client") {
      const allowed = user.caseIds ?? [];
      return delay(all.filter((t) => allowed.includes(t.caseId)));
    }
    return delay(all);
  },

  // Events
  async getEvents(user: User) {
    const all = eventsData;
    if (user.role === "client") {
      const allowed = user.caseIds ?? [];
      return delay(all.filter((e) => allowed.includes(e.caseId)));
    }
    return delay(all);
  },

  // Documents
  async getDocuments(user: User) {
    const all = documentsData;
    if (user.role === "client") {
      const allowed = user.caseIds ?? [];
      return delay(all.filter((d) => allowed.includes(d.caseId)));
    }
    return delay(all);
  },

  // Invoices
  async getInvoices(user: User) {
    const all = invoicesData;
    if (user.role === "client") {
      return delay(all.filter((i) => i.clientId === user.id));
    }
    return delay(all);
  },

  // Messages
  async getMessages(user: User) {
    const all = messagesData;
    if (user.role === "client") {
      return delay(all.filter((m) => m.from === user.id || m.to === user.id));
    }
    return delay(all);
  },

  // Analytics — firm only
  getAnalytics: () => delay(analyticsData),
};
