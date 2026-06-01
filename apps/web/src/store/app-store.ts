import { create } from "zustand";
import { api, type TaskPayload } from "../lib/api";
import type { Analytics, DeadlineAlert, Group, NotificationItem, Priority, Task, TaskStatus, User } from "../types";

type Filters = {
  assigneeId?: string;
  status?: TaskStatus;
  priority?: Priority;
  groupId?: string;
  deadline?: "overdue" | "today" | "week" | "none";
  mine?: boolean;
};

type AppState = {
  tasks: Task[];
  users: User[];
  groups: Group[];
  analytics: Analytics | null;
  notifications: NotificationItem[];
  deadlineAlerts: DeadlineAlert[];
  filters: Filters;
  loading: boolean;
  error: string | null;
  setFilters: (filters: Partial<Filters>) => void;
  resetFilters: () => void;
  loadDashboard: () => Promise<void>;
  createTask: (payload: TaskPayload) => Promise<Task>;
  updateTask: (id: string, payload: Partial<TaskPayload>) => Promise<Task>;
  deleteTask: (id: string) => Promise<void>;
  addComment: (taskId: string, payload: { body: string; grade?: number | null }) => Promise<void>;
  updateUser: (id: string, payload: Partial<User>) => Promise<void>;
};

export const useAppStore = create<AppState>((set, get) => ({
  tasks: [],
  users: [],
  groups: [],
  analytics: null,
  notifications: [],
  deadlineAlerts: [],
  filters: {},
  loading: false,
  error: null,
  setFilters(filters) {
    set({ filters: { ...get().filters, ...filters } });
  },
  resetFilters() {
    set({ filters: {} });
  },
  async loadDashboard() {
    set({ loading: true, error: null });
    try {
      const filters = get().filters;
      const [{ groups }, { users }, { tasks }, { analytics }, notificationPayload] = await Promise.all([
        api.groups(),
        api.users(),
        api.tasks(filters),
        api.analytics(filters.groupId),
        api.notifications()
      ]);
      set({
        groups,
        users,
        tasks,
        analytics,
        notifications: notificationPayload.notifications,
        deadlineAlerts: notificationPayload.deadlineAlerts,
        loading: false
      });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : "Не удалось загрузить данные", loading: false });
    }
  },
  async createTask(payload) {
    const { task } = await api.createTask(payload);
    set({ tasks: [task, ...get().tasks] });
    void get().loadDashboard();
    return task;
  },
  async updateTask(id, payload) {
    const { task } = await api.updateTask(id, payload);
    set({ tasks: get().tasks.map((item) => (item.id === id ? task : item)) });
    void get().loadDashboard();
    return task;
  },
  async deleteTask(id) {
    await api.deleteTask(id);
    set({ tasks: get().tasks.filter((task) => task.id !== id) });
    void get().loadDashboard();
  },
  async addComment(taskId, payload) {
    await api.addComment(taskId, payload);
    await get().loadDashboard();
  },
  async updateUser(id, payload) {
    const { user } = await api.updateUser(id, payload);
    set({ users: get().users.map((item) => (item.id === id ? user : item)) });
  }
}));
