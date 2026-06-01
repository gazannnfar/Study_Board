import { Filter, RotateCcw } from "lucide-react";
import { priorityLabels, statusLabels } from "../constants";
import { useAppStore } from "../store/app-store";
import type { Priority, TaskStatus } from "../types";

export function FiltersBar() {
  const { filters, users, groups, setFilters, resetFilters } = useAppStore();

  return (
    <div className="mb-4 rounded-md border border-slate-200 bg-white p-3">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
          <Filter size={17} className="text-emerald-600" aria-hidden />
          Фильтры
        </div>
        <button
          className="inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
          type="button"
          title="Сбросить фильтры"
          onClick={resetFilters}
        >
          <RotateCcw size={16} aria-hidden />
        </button>
      </div>

      <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-6">
        <select
          className="rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-500"
          value={filters.groupId ?? ""}
          onChange={(event) => setFilters({ groupId: event.target.value || undefined })}
          aria-label="Группа"
        >
          <option value="">Все группы</option>
          {groups.map((group) => (
            <option key={group.id} value={group.id}>
              {group.code}
            </option>
          ))}
        </select>

        <select
          className="rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-500"
          value={filters.assigneeId ?? ""}
          onChange={(event) => setFilters({ assigneeId: event.target.value || undefined })}
          aria-label="Исполнитель"
        >
          <option value="">Все исполнители</option>
          {users.map((user) => (
            <option key={user.id} value={user.id}>
              {user.name}
            </option>
          ))}
        </select>

        <select
          className="rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-500"
          value={filters.status ?? ""}
          onChange={(event) => setFilters({ status: (event.target.value || undefined) as TaskStatus | undefined })}
          aria-label="Статус"
        >
          <option value="">Все статусы</option>
          {Object.entries(statusLabels).map(([status, label]) => (
            <option key={status} value={status}>
              {label}
            </option>
          ))}
        </select>

        <select
          className="rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-500"
          value={filters.priority ?? ""}
          onChange={(event) => setFilters({ priority: (event.target.value || undefined) as Priority | undefined })}
          aria-label="Приоритет"
        >
          <option value="">Все приоритеты</option>
          {Object.entries(priorityLabels).map(([priority, label]) => (
            <option key={priority} value={priority}>
              {label}
            </option>
          ))}
        </select>

        <select
          className="rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-500"
          value={filters.deadline ?? ""}
          onChange={(event) =>
            setFilters({ deadline: (event.target.value || undefined) as typeof filters.deadline | undefined })
          }
          aria-label="Дедлайн"
        >
          <option value="">Все дедлайны</option>
          <option value="overdue">Просрочены</option>
          <option value="today">Сегодня</option>
          <option value="week">7 дней</option>
          <option value="none">Без дедлайна</option>
        </select>

        <label className="flex items-center gap-2 rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700">
          <input
            className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
            type="checkbox"
            checked={Boolean(filters.mine)}
            onChange={(event) => setFilters({ mine: event.target.checked || undefined })}
          />
          Мои задачи
        </label>
      </div>
    </div>
  );
}
