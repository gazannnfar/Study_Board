import { useEffect, useMemo, useState } from "react";
import { BookOpenCheck, LogOut, Plus, RefreshCw } from "lucide-react";
import { roleLabels } from "../constants";
import { useAppStore } from "../store/app-store";
import { useAuthStore } from "../store/auth-store";
import type { Task, TaskStatus } from "../types";
import { AdminPanel } from "./AdminPanel";
import { Avatar } from "./Avatar";
import { FiltersBar } from "./FiltersBar";
import { KanbanBoard } from "./KanbanBoard";
import { ScheduleImportPanel } from "./ScheduleImportPanel";
import { SidePanel } from "./SidePanel";
import { TaskModal } from "./TaskModal";

export function Dashboard() {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const { filters, loading, error, loadDashboard, tasks } = useAppStore();
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [initialStatus, setInitialStatus] = useState<TaskStatus | undefined>();
  const filtersKey = useMemo(() => JSON.stringify(filters), [filters]);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard, filtersKey]);

  function openCreate(status?: TaskStatus) {
    setSelectedTask(null);
    setInitialStatus(status);
    setModalOpen(true);
  }

  function openTask(task: Task) {
    setSelectedTask(task);
    setInitialStatus(undefined);
    setModalOpen(true);
  }

  if (!user) return null;

  return (
    <main className="min-h-screen bg-slate-100">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-[1800px] items-center justify-between gap-4 px-4 py-3">
          <div className="flex min-w-0 items-center gap-3">
            <div className="inline-flex h-10 w-10 items-center justify-center rounded-md bg-slate-950 text-emerald-300">
              <BookOpenCheck size={22} aria-hidden />
            </div>
            <div className="min-w-0">
              <h1 className="truncate text-lg font-semibold text-slate-950">EduKanban</h1>
              <p className="truncate text-xs text-slate-500">
                {user.group?.name ?? "Все учебные группы"} · {roleLabels[user.role]}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 text-slate-600 transition hover:bg-slate-50"
              type="button"
              title="Обновить"
              onClick={() => void loadDashboard()}
            >
              <RefreshCw size={17} aria-hidden />
            </button>
            <button
              className="inline-flex items-center gap-2 rounded-md bg-emerald-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-emerald-700"
              type="button"
              onClick={() => openCreate()}
            >
              <Plus size={17} aria-hidden />
              Задача
            </button>
            <div className="hidden items-center gap-2 rounded-md border border-slate-200 px-2 py-1.5 md:flex">
              <Avatar user={user} size="sm" />
              <span className="max-w-36 truncate text-sm font-medium text-slate-700">{user.name}</span>
            </div>
            <button
              className="inline-flex h-9 w-9 items-center justify-center rounded-md text-slate-500 transition hover:bg-slate-200 hover:text-slate-900"
              type="button"
              title="Выйти"
              onClick={logout}
            >
              <LogOut size={17} aria-hidden />
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-[1800px] px-4 py-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold text-slate-950">Доска задач</h2>
            <p className="text-sm text-slate-500">
              {tasks.length} задач в текущем представлении{loading ? " · обновление..." : ""}
            </p>
          </div>
          {error && <p className="rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}
        </div>

        <FiltersBar />
        <ScheduleImportPanel />

        <div className="grid gap-4 xl:grid-cols-[1fr_340px]">
          <section className="min-w-0">
            <KanbanBoard onOpenTask={openTask} onCreateTask={openCreate} />
            {user.role === "ADMIN" && <AdminPanel />}
          </section>
          <SidePanel />
        </div>
      </div>

      <TaskModal
        open={modalOpen}
        task={selectedTask}
        initialStatus={initialStatus}
        onClose={() => {
          setModalOpen(false);
          setSelectedTask(null);
          setInitialStatus(undefined);
        }}
      />
    </main>
  );
}
