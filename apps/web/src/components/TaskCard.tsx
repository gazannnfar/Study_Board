import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { CalendarClock, CheckCircle2, MessageSquare, UserRound } from "lucide-react";
import { priorityClass, priorityLabels } from "../constants";
import { formatDate, isOverdue } from "../lib/date";
import type { Task } from "../types";
import { Avatar } from "./Avatar";

type Props = {
  task: Task;
  onOpen: (task: Task) => void;
};

export function TaskCard({ task, onOpen }: Props) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: task.id,
    data: { status: task.status }
  });

  return (
    <article
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform) }}
      className={`rounded-md border border-slate-200 bg-white p-3 shadow-sm transition ${
        isDragging ? "z-30 opacity-60 shadow-soft" : "hover:border-slate-300"
      }`}
      {...listeners}
      {...attributes}
      onClick={() => onOpen(task)}
    >
      <div className="mb-2 flex items-start justify-between gap-3">
        <h3 className="line-clamp-2 text-sm font-semibold leading-5 text-slate-900">{task.title}</h3>
        {task.status === "DONE" && <CheckCircle2 className="mt-0.5 shrink-0 text-emerald-600" size={18} />}
      </div>

      <p className="mb-3 line-clamp-2 text-xs leading-5 text-slate-500">{task.description}</p>

      <div className="mb-3 flex flex-wrap gap-1.5">
        <span className={`rounded-full border px-2 py-0.5 text-[11px] font-medium ${priorityClass[task.priority]}`}>
          {priorityLabels[task.priority]}
        </span>
        {task.tags.slice(0, 3).map((tag) => (
          <span key={tag} className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] text-slate-600">
            {tag}
          </span>
        ))}
      </div>

      <div className="flex items-center justify-between gap-2 text-xs text-slate-500">
        <span
          className={`inline-flex items-center gap-1 ${isOverdue(task.deadline) && task.status !== "DONE" ? "text-rose-600" : ""}`}
        >
          <CalendarClock size={14} aria-hidden />
          {formatDate(task.deadline)}
        </span>
        <span className="inline-flex items-center gap-1">
          <MessageSquare size={14} aria-hidden />
          {task.comments?.length ?? 0}
        </span>
      </div>

      <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3">
        {task.assignee ? (
          <div className="flex min-w-0 items-center gap-2">
            <Avatar user={task.assignee} size="sm" />
            <span className="truncate text-xs font-medium text-slate-700">{task.assignee.name}</span>
          </div>
        ) : (
          <span className="inline-flex items-center gap-1 text-xs text-slate-400">
            <UserRound size={14} aria-hidden />
            Не назначена
          </span>
        )}
        {task.grade !== null && task.grade !== undefined && (
          <span className="rounded-md bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700">{task.grade}/100</span>
        )}
      </div>
    </article>
  );
}
