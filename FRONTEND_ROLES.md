# Frontend Team Role Division

This document outlines the responsibilities and focus areas for the 6-person frontend team building the Casejoy Hub Legal Practice Management System.

The frontend is built using React 19, Vite, TanStack Router (file-based routing), TanStack Query, Tailwind CSS, and Radix UI components. The workload is divided into functional domains to minimize merge conflicts and encourage ownership of specific features.

## 🧑‍💻 Developer 1: Architecture & Settings (The Foundation)
**Focus Files:** `src/routes/__root.tsx`, `src/routes/app.tsx`, `src/routes/app.settings.tsx`, `src/components/ui/*`, `src/lib/auth-context.tsx`

**Role Overview:**
You are the core architect and the primary maintainer of the design system. You ensure the application shell works flawlessly across all user roles.

**Key Responsibilities:**
*   **App Shell & Navigation:** Maintain the core layout (`app.tsx`), sidebar routing, and top navigation bar. Ensure role-based access control (RBAC) correctly shows/hides navigation items for Admins, Lawyers, Paralegals, and Clients.
*   **Authentication & State:** Manage the global authentication state in `auth-context.tsx` and ensure seamless login/logout flows.
*   **Design System:** Maintain and expand the shared UI component library in `src/components/ui/`. Ensure components like Modals, Data Tables, and Dropdowns are accessible and reusable for the rest of the team.
*   **Settings Module:** Build out the `app.settings.tsx` page. Implement interfaces for administrators to configure firm details, manage user accounts (referencing `users.json`), adjust system preferences, and define roles/permissions.

---

## 🧑‍💻 Developer 2: Cases & Workflows (The Core Engine)
**Focus Files:** `src/routes/app.cases.tsx`, `src/data/cases.json`, `src/data/tasks.json`

**Role Overview:**
You own the core operational engine of the system where legal professionals spend the majority of their time managing matters.

**Key Responsibilities:**
*   **Case List & Filtering:** Enhance the existing cases table in `app.cases.tsx`. Add advanced filtering, sorting, and search capabilities to easily find specific matters.
*   **Case Detail View:** Build a comprehensive Case Detail interface. When a user clicks a case, they should see a detailed dashboard for that specific matter, including case information, assigned team members, timeline, and associated documents.
*   **Workflow Automation:** Build the UI for managing tasks and workflows associated with cases. Allow users to add tasks (from `tasks.json`), set deadlines, assign them to team members, and track progress through different case stages.
*   **Case Creation:** Implement the "New Case" modal/form with validation.

---

## 🧑‍💻 Developer 3: Document Management (DMS) & AI
**Focus Files:** `src/routes/app.documents.tsx`, `src/routes/app.ai.tsx`, `src/data/documents.json`

**Role Overview:**
You are responsible for all file-related interactions, storage UI, and integrating the platform's AI capabilities.

**Key Responsibilities:**
*   **Document Repository:** Build the `app.documents.tsx` page. Create a file explorer interface with folders, list/grid views, and breadcrumb navigation.
*   **File Operations:** Implement UI for drag-and-drop uploads, file downloading, renaming, and deleting.
*   **Document Preview:** Integrate or build a file previewer modal for common legal document types (PDFs, Word docs, images).
*   **AI Integration:** Own the `app.ai.tsx` workspace. Build the interfaces for AI-powered features such as Document Drafting (generating documents from templates), Contract Review (highlighting risks/clauses), and generating Case Summaries.

---

## 🧑‍💻 Developer 4: Client Portal & Communications
**Focus Files:** `src/routes/app.messages.tsx`, `src/routes/app.index.tsx` (ClientDashboard component), `src/data/messages.json`

**Role Overview:**
Your focus is entirely on the client experience and facilitating seamless communication between the firm and its clients.

**Key Responsibilities:**
*   **Client Dashboard:** Expand the `ClientDashboard` in `app.index.tsx`. Ensure clients have a clear, intuitive overview of their active matters, upcoming events, and outstanding balances.
*   **Messaging Hub:** Build the centralized communication hub in `app.messages.tsx`. Create a chat-like interface allowing secure messaging between lawyers, staff, and clients.
*   **Notification System:** Implement the UI for real-time notifications (e.g., a notification dropdown in the top bar) to alert users of new messages, uploaded documents, or approaching deadlines.
*   **Client Self-Service:** Ensure the UI enables clients to easily upload requested documents and view case status updates without needing to call the firm.

---

## 🧑‍💻 Developer 5: Billing & Analytics
**Focus Files:** `src/routes/app.billing.tsx`, `src/routes/app.analytics.tsx`, `src/data/invoices.json`, `src/data/analytics.json`

**Role Overview:**
You manage the financial interfaces and data visualization, providing the firm with critical insights into its operations and revenue.

**Key Responsibilities:**
*   **Billing Management:** Build the `app.billing.tsx` page. Create data tables to track invoices, retainer balances, and payment statuses.
*   **Time Tracking:** Implement UI for lawyers to log billable hours against specific cases.
*   **Invoice Generation:** Build the interface for creating and reviewing invoices before they are sent to clients.
*   **Analytics Dashboard:** Build out `app.analytics.tsx` using the `recharts` library. Create visual graphs, charts, and KPI cards to display practice area profitability, lawyer workload/productivity, and revenue trends.

---

## 🧑‍💻 Developer 6: CRM (Clients) & Calendar
**Focus Files:** `src/routes/app.clients.tsx`, `src/routes/app.calendar.tsx`, `src/data/clients.json`, `src/data/events.json`

**Role Overview:**
You are responsible for managing the firm's schedule, deadlines, and the comprehensive database of client profiles.

**Key Responsibilities:**
*   **Client Directory (CRM):** Build `app.clients.tsx`. Create a searchable directory of all firm clients.
*   **Client Profiles:** Develop detailed client profile views showing contact information, legal history, active/closed cases, and internal notes.
*   **Calendar Interface:** Build `app.calendar.tsx` utilizing `react-day-picker`. Create monthly, weekly, and daily views to track court dates, appointments, and critical case deadlines.
*   **Scheduling:** Implement modals to create new calendar events, set reminders, and link events to specific cases or clients.
*   **AI Recommendations (UI):** Integrate UI elements in the calendar and CRM views to display AI-suggested next actions or deadline warnings.

---

## 🚀 General Development Guidelines for the Team

1.  **Component Reusability:** Always check `src/components/ui/` before building a new UI element. If you need a button, input, dialog, or table, use the existing Radix/Tailwind components. If it doesn't exist, coordinate with Developer 1 to add it to the shared library.
2.  **Mock Data:** Continue using the JSON files in `src/data/` and the `src/lib/api.ts` service to simulate backend responses while the APIs are being developed.
3.  **Routing:** Each major feature has its own route file (e.g., `app.documents.tsx`). Work primarily within your assigned route files to avoid Git merge conflicts with your teammates.
4.  **Styling:** Use Tailwind CSS utility classes. Avoid writing custom CSS unless absolutely necessary.
