import type {
  Analytics,
  Comment,
  DeadlineAlert,
  FreeSlot,
  LessonType,
  Group,
  NotificationItem,
  Priority,
  ScheduleLesson,
  Task,
  TaskRecommendation,
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
  pertOptimisticHours?: number | null;
  pertMostLikelyHours?: number | null;
  pertPessimisticHours?: number | null;
  scheduledStart?: string | null;
  scheduledEnd?: string | null;
  scheduleLessonId?: string | null;
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
  schedule: (query: Record<string, string | undefined> = {}) => {
    const params = new URLSearchParams();
    Object.entries(query).forEach(([key, value]) => {
      if (value) params.set(key, value);
    });
    return request<{ lessons: ScheduleLesson[] }>(`/schedule?${params.toString()}`);
  },
  importSchedule: (payload: {
    format: "json" | "csv";
    source?: string;
    groupId?: string;
    lessons?: Array<{
      groupId: string;
      startsAt: string;
      endsAt: string;
      teacherName: string;
      room: string;
      lessonType?: LessonType;
      subject: string;
      topic?: string | null;
    }>;
    csv?: string;
  }) => request<{ imported: number; lessons: ScheduleLesson[] }>("/schedule/import", { method: "POST", body: JSON.stringify(payload) }),
  freeSlots: (query: Record<string, string | number | undefined> = {}) => {
    const params = new URLSearchParams();
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== "") params.set(key, String(value));
    });
    return request<{ slots: FreeSlot[] }>(`/planning/free-slots?${params.toString()}`);
  },
  taskRecommendations: (query: Record<string, string | number | undefined> = {}) => {
    const params = new URLSearchParams();
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== "") params.set(key, String(value));
    });
    return request<{ recommendations: TaskRecommendation[] }>(`/planning/task-recommendations?${params.toString()}`);
  },
  assignSlot: (payload: { taskId: string; scheduledStart: string; scheduledEnd: string; scheduleLessonId?: string | null }) =>
    request<{ task: Task }>("/planning/assign-slot", { method: "POST", body: JSON.stringify(payload) }),
  aiSuggest: (payload: {
    topic: string;
    description?: string;
    deadline?: string | null;
    role?: string;
    mode?: "AI_STRICT" | "AI_LIGHT";
    pert?: { optimistic?: number; mostLikely?: number; pessimistic?: number };
    freeSlotMinutes?: number;
  }) =>
    request<{
      suggestion: {
        mode: "AI_STRICT" | "AI_LIGHT";
        title: string;
        improvedDescription: string;
        suggestedPriority: Priority;
        tags: string[];
        deadlineReminder: string;
        summary: string;
        risks: string[];
        dependencies: string[];
        subtasks: string[];
        pert: {
          optimistic: number;
          mostLikely: number;
          pessimistic: number;
          expected: number;
          spread: number;
          confidence: "HIGH" | "MEDIUM" | "LOW";
        } | null;
      };
    }>("/ai/task-suggestions", { method: "POST", body: JSON.stringify(payload) })
};
