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
}

export interface Case {
  id: string;
  number: string;
  title: string;
  client: string;
  clientId: string | null;
  practice: string;
  stage: string;
  status: "active" | "archived";
  lead: string;
  openedAt: string;
  nextDeadline: string | null;
  billable: number;
  priority: "low" | "medium" | "high";
}

const delay = <T>(value: T, ms = 120): Promise<T> =>
  new Promise((resolve) => setTimeout(() => resolve(value), ms));

export const api = {
  // Auth
  async login(email: string, password: string): Promise<User | null> {
    const user = (usersData as User[]).find(
      (u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password,
    );
    return delay(user ?? null, 250);
  },

  // Users
  getUsers: () => delay(usersData as User[]),
  getStaff: () =>
    delay((usersData as User[]).filter((u) => u.role !== "client")),

  // Cases — scoped by role
  async getCases(user: User) {
    const all = casesData as Case[];
    if (user.role === "client") {
      return delay(all.filter((c) => user.caseIds?.includes(c.id)));
    }
    return delay(all);
  },
  getCase: (id: string) =>
    delay((casesData as Case[]).find((c) => c.id === id) ?? null),

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
