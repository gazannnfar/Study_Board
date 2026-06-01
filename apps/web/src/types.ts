export type Role = "STUDENT" | "STAROSTA" | "TEACHER" | "PROJECT_MANAGER" | "TEAM_LEAD" | "ADMIN";
export type TaskStatus = "BACKLOG" | "TODO" | "IN_PROGRESS" | "REVIEW" | "DONE";
export type Priority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

export type User = {
  id: string;
  email: string;
  name: string;
  role: Role;
  avatarColor: string;
  active: boolean;
  lastLoginAt?: string | null;
  groupId?: string | null;
  group?: Pick<Group, "id" | "name" | "code"> | null;
};

export type Group = {
  id: string;
  name: string;
  code: string;
  description: string;
  teacherId?: string | null;
  teacher?: Pick<User, "id" | "name" | "email"> | null;
  users?: User[];
  projects?: Project[];
};

export type Project = {
  id: string;
  name: string;
  description: string;
  groupId?: string;
  managerId?: string | null;
  teamLeadId?: string | null;
};

export type Comment = {
  id: string;
  body: string;
  grade?: number | null;
  createdAt: string;
  author: Pick<User, "id" | "name" | "email" | "role" | "avatarColor">;
};

export type Task = {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: Priority;
  deadline?: string | null;
  tags: string[];
  estimatedHours?: number | null;
  grade?: number | null;
  completedAt?: string | null;
  groupId: string;
  projectId?: string | null;
  assigneeId?: string | null;
  creatorId: string;
  createdAt: string;
  updatedAt: string;
  assignee?: Pick<User, "id" | "name" | "email" | "role" | "avatarColor"> | null;
  creator?: Pick<User, "id" | "name" | "email" | "role" | "avatarColor">;
  group?: Pick<Group, "id" | "name" | "code">;
  project?: Pick<Project, "id" | "name"> | null;
  comments?: Comment[];
};

export type Analytics = {
  totalTasks: number;
  doneTasks: number;
  activeUsers: number;
  overdueTasks: number;
  onTimeCompletionPercent: number;
  averageCloseTimeDays: number;
  satisfaction: number | null;
  statusDistribution: Array<{ status: TaskStatus; count: number; share: number }>;
  groupSummaries: Array<{ id: string; name: string; code: string; _count: { users: number; tasks: number } }>;
};

export type NotificationItem = {
  id: string;
  title: string;
  body: string;
  type: string;
  readAt?: string | null;
  createdAt: string;
  task?: Pick<Task, "id" | "title" | "deadline" | "priority"> | null;
};

export type DeadlineAlert = Pick<Task, "id" | "title" | "deadline" | "priority" | "status">;
