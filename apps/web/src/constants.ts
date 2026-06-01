import type { Priority, Role, TaskStatus } from "./types";

export const statuses: TaskStatus[] = ["BACKLOG", "TODO", "IN_PROGRESS", "REVIEW", "DONE"];

export const statusLabels: Record<TaskStatus, string> = {
  BACKLOG: "Backlog",
  TODO: "To Do",
  IN_PROGRESS: "In Progress",
  REVIEW: "Review",
  DONE: "Done"
};

export const roleLabels: Record<Role, string> = {
  STUDENT: "Student",
  STAROSTA: "Starosta",
  TEACHER: "Teacher",
  PROJECT_MANAGER: "Project Manager",
  TEAM_LEAD: "Team Lead",
  ADMIN: "Admin"
};

export const priorityLabels: Record<Priority, string> = {
  LOW: "Низкий",
  MEDIUM: "Средний",
  HIGH: "Высокий",
  URGENT: "Срочный"
};

export const priorityClass: Record<Priority, string> = {
  LOW: "border-emerald-200 bg-emerald-50 text-emerald-700",
  MEDIUM: "border-sky-200 bg-sky-50 text-sky-700",
  HIGH: "border-amber-200 bg-amber-50 text-amber-700",
  URGENT: "border-rose-200 bg-rose-50 text-rose-700"
};

export const demoAccounts = [
  { label: "Admin", email: "admin@edukanban.local", password: "password123" },
  { label: "Teacher", email: "teacher@edukanban.local", password: "password123" },
  { label: "Project Manager", email: "pm@edukanban.local", password: "password123" },
  { label: "Team Lead", email: "lead@edukanban.local", password: "password123" },
  { label: "Starosta", email: "starosta@edukanban.local", password: "password123" },
  { label: "Student", email: "student@edukanban.local", password: "password123" }
];
