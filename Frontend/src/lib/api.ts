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
import notificationsData from "@/data/notifications.json";

export type Role = "admin" | "lawyer" | "paralegal" | "client";

export interface User {
  id: string;
  email: string;
  password?: string;
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

export interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  company?: string;
  since?: string;
  activeCases: number;
  outstanding: number;
  retainerBalance: number;
  address?: string;
  notes?: any;
}

export interface Task {
  id: string;
  caseId: string;
  title: string;
  assignee: string;
  due: string;
  status: string;
  priority: string;
  notes?: string;
}

export interface Event {
  id: string;
  caseId: string;
  title: string;
  date: string;
  time?: string;
  type: string;
  location?: string;
  reminder?: string;
  notes?: string;
}

export interface Document {
  id: string;
  caseId: string;
  name: string;
  type: string;
  size: string;
  uploadedBy: string;
  uploadedAt: string;
  signed: boolean;
}

export interface Invoice {
  id: string;
  number: string;
  clientId: string | null;
  client: string;
  caseId: string;
  amount: number;
  status: string;
  issued: string;
  due: string;
}

export interface Message {
  id: string;
  caseId: string;
  from: string;
  fromName: string;
  to: string;
  body: string;
  at: string;
  read: boolean;
}

export interface Analytics {
  [key: string]: any;
}

const fetchApi = async <T>(url: string, options?: RequestInit): Promise<T> => {
  const response = await fetch(`/api${url}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });
  if (!response.ok) {
    if (response.status === 401) return null as T;
    throw new Error(`API error: ${response.statusText}`);
  }
  return response.json();
};

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
    return fetchApi<User | null>("/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
  },

  async signUp(name: string, email: string, password: string, phone?: string): Promise<User> {
    return fetchApi<User>("/signup", {
      method: "POST",
      body: JSON.stringify({ name, email, password, phone }),
    });
  },

  async updateUserRole(userId: string, newRole: Role): Promise<User> {
    const updatedUser = await fetchApi<User>(`/users/${userId}/role`, {
      method: "PUT",
      body: JSON.stringify({ role: newRole }),
    });

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

    return updatedUser;
  },

  async updateUserProfile(userId: string, name: string, email: string, phone: string): Promise<User> {
    const users = getLocalUsers();
    let updatedUser: User | null = null;

    const updated = users.map((u) => {
      if (u.id === userId) {
        updatedUser = {
          ...u,
          name,
          email,
          phone,
          avatar: name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2) || u.avatar,
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
  getUsers: () => fetchApi<User[]>("/users"),
  getStaff: async () => {
    const users = await fetchApi<User[]>("/users");
    return users.filter((u) => u.role !== "client");
  },

  // Cases — scoped by role
  async getCases(user: User) {
    const all = await fetchApi<Case[]>("/cases");
    if (user.role === "client") {
      return all.filter((c) => user.caseIds?.includes(c.id));
    }
    return all;
  },
  getCase: (id: string) => fetchApi<Case | null>(`/cases/${id}`),

  // Clients
  getClients: () => fetchApi<Client[]>("/clients"),

  // Tasks
  async getTasks(user: User) {
    const all = await fetchApi<Task[]>("/tasks");
    if (user.role === "client") {
      const allowed = user.caseIds ?? [];
      return all.filter((t) => allowed.includes(t.caseId));
    }
    return all;
  },

  // Events
  async getEvents(user: User) {
    const all = await fetchApi<Event[]>("/events");
    if (user.role === "client") {
      const allowed = user.caseIds ?? [];
      return all.filter((e) => allowed.includes(e.caseId));
    }
    return all;
  },

  // Documents
  async getDocuments(user: User) {
    const all = await fetchApi<Document[]>("/documents");
    if (user.role === "client") {
      const allowed = user.caseIds ?? [];
      return all.filter((d) => allowed.includes(d.caseId));
    }
    return all;
  },

  // Invoices
  async getInvoices(user: User) {
    const all = await fetchApi<Invoice[]>("/invoices");
    if (user.role === "client") {
      return all.filter((i) => i.clientId === user.id);
    }
    return all;
  },

  // Messages
  async getMessages(user: User) {
    const all = await fetchApi<Message[]>("/messages");
    if (user.role === "client") {
      return all.filter((m) => m.from === user.id || m.to === user.id);
    }
    return all;
  },

  // Analytics — firm only
  getAnalytics: () => fetchApi<Analytics>("/analytics"),

  // Notifications
  async getNotifications(user: User) {
    const all = notificationsData;
    // Note: This relies on local mock data until the backend route is ready
    return delay(all.filter((n) => n.userId === user.id));
  },
};
