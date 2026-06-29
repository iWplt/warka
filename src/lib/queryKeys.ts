/**
 * Central TanStack Query keys for server state.
 */
export const queryKeys = {
  orders: {
    all: ["orders"] as const,
    list: (filters?: Record<string, unknown>) =>
      ["orders", "list", filters ?? {}] as const,
    detail: (id: string) => ["orders", "detail", id] as const,
  },
  users: {
    all: ["users"] as const,
    list: (role?: string) => ["users", "list", role ?? "all"] as const,
    detail: (id: string) => ["users", "detail", id] as const,
  },
  students: {
    all: ["students"] as const,
    byRepresentative: (repId: string) =>
      ["students", "representative", repId] as const,
  },
  designs: {
    all: ["designs"] as const,
    templates: (type?: string) => ["designs", "templates", type ?? "all"] as const,
  },
  notifications: {
    all: ["notifications"] as const,
    unreadCount: ["notifications", "unread-count"] as const,
  },
  payments: {
    all: ["payments"] as const,
    summary: ["payments", "summary"] as const,
  },
  reports: {
    orders: (range: { from: string; to: string }) =>
      ["reports", "orders", range] as const,
    revenue: (range: { from: string; to: string }) =>
      ["reports", "revenue", range] as const,
  },
  dashboard: {
    admin: ["dashboard", "admin"] as const,
    representative: (id: string) => ["dashboard", "representative", id] as const,
    student: (id: string) => ["dashboard", "student", id] as const,
  },
} as const;
