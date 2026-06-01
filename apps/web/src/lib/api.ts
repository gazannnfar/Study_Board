import type {
  Analytics,
  Comment,
  DeadlineAlert,
  Group,
  NotificationItem,
  Priority,
  Task,
  TaskStatus,
  User
} from "../types";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:4000/api";

type ApiError = {
  error: string;
  message: string;
};

async function request<T>(path: string, options: RequestInit = {}) {
  const token = localStorage.getItem("edukanban.token");
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers
    }
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as ApiError | null;
    throw new Error(payload?.message ?? "API request failed");
  }

  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export type TaskPayload = {
  title: string;
  description: string;
  status?: TaskStatus;
  priority?: Priority;
  deadline?: string | null;
  tags?: string[];
  estimatedHours?: number | null;
  groupId?: string;
  projectId?: string | null;
  assigneeId?: string | null;
  grade?: number | null;
};

export const api = {
  login: (email: string, password: string) =>
    request<{ token: string; user: User }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password })
    }),
  me: () => request<{ user: User }>("/auth/me"),
  users: () => request<{ users: User[] }>("/users"),
  createUser: (payload: Partial<User> & { password: string }) =>
    request<{ user: User }>("/users", { method: "POST", body: JSON.stringify(payload) }),
  updateUser: (id: string, payload: Partial<User> & { password?: string }) =>
    request<{ user: User }>(`/users/${id}`, { method: "PATCH", body: JSON.stringify(payload) }),
  groups: () => request<{ groups: Group[] }>("/groups"),
  tasks: (query: Record<string, string | boolean | undefined>) => {
    const params = new URLSearchParams();
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== "") params.set(key, String(value));
    });
    return request<{ tasks: Task[] }>(`/tasks?${params.toString()}`);
  },
  createTask: (payload: TaskPayload) =>
    request<{ task: Task }>("/tasks", { method: "POST", body: JSON.stringify(payload) }),
  updateTask: (id: string, payload: Partial<TaskPayload>) =>
    request<{ task: Task }>(`/tasks/${id}`, { method: "PATCH", body: JSON.stringify(payload) }),
  deleteTask: (id: string) => request<void>(`/tasks/${id}`, { method: "DELETE" }),
  addComment: (taskId: string, payload: { body: string; grade?: number | null }) =>
    request<{ comment: Comment }>(`/tasks/${taskId}/comments`, { method: "POST", body: JSON.stringify(payload) }),
  analytics: (groupId?: string) =>
    request<{ analytics: Analytics }>(`/analytics/overview${groupId ? `?groupId=${groupId}` : ""}`),
  notifications: () =>
    request<{ notifications: NotificationItem[]; deadlineAlerts: DeadlineAlert[] }>("/notifications"),
  aiSuggest: (payload: { topic: string; description?: string; deadline?: string | null; role?: string }) =>
    request<{
      suggestion: {
        title: string;
        improvedDescription: string;
        suggestedPriority: Priority;
        tags: string[];
        deadlineReminder: string;
      };
    }>("/ai/task-suggestions", { method: "POST", body: JSON.stringify(payload) })
};
