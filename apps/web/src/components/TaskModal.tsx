import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Bot, MessageSquarePlus, Save, Trash2, X } from "lucide-react";
import { priorityLabels, statusLabels, statuses } from "../constants";
import { fromDateTimeLocal, formatDateTime, toDateTimeLocal } from "../lib/date";
import { api } from "../lib/api";
import { useAppStore } from "../store/app-store";
import { useAuthStore } from "../store/auth-store";
import type { Priority, Task, TaskStatus } from "../types";
import { Avatar } from "./Avatar";

type Props = {
  open: boolean;
  task: Task | null;
  initialStatus?: TaskStatus;
  onClose: () => void;
};

type FormState = {
  title: string;
  description: string;
  status: TaskStatus;
  priority: Priority;
  deadline: string;
  tags: string;
  estimatedHours: string;
  pertOptimisticHours: string;
  pertMostLikelyHours: string;
  pertPessimisticHours: string;
  scheduledStart: string;
  scheduledEnd: string;
  scheduleLessonId: string;
  groupId: string;
  projectId: string;
  assigneeId: string;
  grade: string;
};

const emptyForm: FormState = {
  title: "",
  description: "",
  status: "BACKLOG",
  priority: "MEDIUM",
  deadline: "",
  tags: "",
  estimatedHours: "",
  pertOptimisticHours: "",
  pertMostLikelyHours: "",
  pertPessimisticHours: "",
  scheduledStart: "",
  scheduledEnd: "",
  scheduleLessonId: "",
  groupId: "",
  projectId: "",
  assigneeId: "",
  grade: ""
};

export function TaskModal({ open, task, initialStatus, onClose }: Props) {
  const user = useAuthStore((state) => state.user);
  const { groups, users, createTask, updateTask, deleteTask, addComment } = useAppStore();
  const lessons = useAppStore((state) => state.lessons);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [comment, setComment] = useState("");
  const [commentGrade, setCommentGrade] = useState("");
  const [aiReminder, setAiReminder] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const selectedGroup = groups.find((group) => group.id === form.groupId);
  const assigneeOptions = users.filter((item) => !form.groupId || item.groupId === form.groupId || item.role === "TEACHER");
  const projectOptions = selectedGroup?.projects ?? [];
  const lessonOptions = lessons.filter((lesson) => lesson.groupId === form.groupId);
  const canGrade = user?.role === "TEACHER";
  const defaultGroupId = user?.groupId ?? groups[0]?.id ?? "";

  const title = task ? "Задача" : "Новая задача";

  useEffect(() => {
    if (!open) return;
    if (task) {
      setForm({
        title: task.title,
        description: task.description,
        status: task.status,
        priority: task.priority,
        deadline: toDateTimeLocal(task.deadline),
        tags: task.tags.join(", "),
        estimatedHours: task.estimatedHours ? String(task.estimatedHours) : "",
        pertOptimisticHours: task.pertOptimisticHours ? String(task.pertOptimisticHours) : "",
        pertMostLikelyHours: task.pertMostLikelyHours ? String(task.pertMostLikelyHours) : "",
        pertPessimisticHours: task.pertPessimisticHours ? String(task.pertPessimisticHours) : "",
        scheduledStart: toDateTimeLocal(task.scheduledStart),
        scheduledEnd: toDateTimeLocal(task.scheduledEnd),
        scheduleLessonId: task.scheduleLessonId ?? "",
        groupId: task.groupId,
        projectId: task.projectId ?? "",
        assigneeId: task.assigneeId ?? "",
        grade: task.grade !== null && task.grade !== undefined ? String(task.grade) : ""
      });
    } else {
      setForm({
        ...emptyForm,
        status: initialStatus ?? "BACKLOG",
        groupId: defaultGroupId
      });
    }
    setComment("");
    setCommentGrade("");
    setAiReminder(null);
    setError(null);
  }, [open, task, initialStatus, defaultGroupId]);

  const payload = useMemo(
    () => ({
      title: form.title.trim(),
      description: form.description.trim(),
      status: form.status,
      priority: form.priority,
      deadline: fromDateTimeLocal(form.deadline),
      tags: form.tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
      estimatedHours: form.estimatedHours ? Number(form.estimatedHours) : null,
      pertOptimisticHours: form.pertOptimisticHours ? Number(form.pertOptimisticHours) : null,
      pertMostLikelyHours: form.pertMostLikelyHours ? Number(form.pertMostLikelyHours) : null,
      pertPessimisticHours: form.pertPessimisticHours ? Number(form.pertPessimisticHours) : null,
      scheduledStart: fromDateTimeLocal(form.scheduledStart),
      scheduledEnd: fromDateTimeLocal(form.scheduledEnd),
      scheduleLessonId: form.scheduleLessonId || null,
      groupId: form.groupId,
      projectId: form.projectId || null,
      assigneeId: form.assigneeId || null,
    }),
    [form]
  );

  if (!open) return null;

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const submitPayload = canGrade ? { ...payload, grade: form.grade ? Number(form.grade) : null } : payload;
      if (task) {
        await updateTask(task.id, submitPayload);
      } else {
        await createTask(submitPayload);
      }
      onClose();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Не удалось сохранить задачу");
    } finally {
      setSaving(false);
    }
  }

  async function handleAiImprove() {
    setSaving(true);
    setError(null);
    try {
      const { suggestion } = await api.aiSuggest({
        topic: form.title || form.description || "учебная задача",
        description: form.description,
        deadline: fromDateTimeLocal(form.deadline),
        role: user?.role,
        mode: "AI_STRICT",
        pert: {
          optimistic: form.pertOptimisticHours ? Number(form.pertOptimisticHours) : undefined,
          mostLikely: form.pertMostLikelyHours ? Number(form.pertMostLikelyHours) : undefined,
          pessimistic: form.pertPessimisticHours ? Number(form.pertPessimisticHours) : undefined
        }
      });
      setForm((current) => ({
        ...current,
        title: suggestion.title,
        description: suggestion.improvedDescription,
        priority: suggestion.suggestedPriority,
        tags: suggestion.tags.join(", "),
        pertOptimisticHours: String(suggestion.pert?.optimistic ?? current.pertOptimisticHours),
        pertMostLikelyHours: String(suggestion.pert?.mostLikely ?? current.pertMostLikelyHours),
        pertPessimisticHours: String(suggestion.pert?.pessimistic ?? current.pertPessimisticHours)
      }));
      setAiReminder(`${suggestion.summary}\n${suggestion.deadlineReminder}`);
    } catch (aiError) {
      setError(aiError instanceof Error ? aiError.message : "AI-помощник недоступен");
    } finally {
      setSaving(false);
    }
  }

  async function handleComment() {
    if (!task || !comment.trim()) return;
    await addComment(task.id, {
      body: comment.trim(),
      grade: canGrade && commentGrade ? Number(commentGrade) : undefined
    });
    setComment("");
    setCommentGrade("");
    onClose();
  }

  async function handleDelete() {
    if (!task) return;
    const confirmed = window.confirm("Удалить задачу?");
    if (!confirmed) return;
    await deleteTask(task.id);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 px-4 py-6">
      <section className="max-h-[92vh] w-full max-w-4xl overflow-hidden rounded-lg bg-white shadow-soft">
        <header className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-950">{title}</h2>
            {task && <p className="text-sm text-slate-500">Создана {formatDateTime(task.createdAt)}</p>}
          </div>
          <button
            className="inline-flex h-9 w-9 items-center justify-center rounded-md text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
            type="button"
            title="Закрыть"
            onClick={onClose}
          >
            <X size={18} aria-hidden />
          </button>
        </header>

        <div className="grid max-h-[calc(92vh-73px)] overflow-y-auto lg:grid-cols-[1fr_300px]">
          <form className="space-y-4 p-5" onSubmit={handleSubmit}>
            {error && <p className="rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}

            <label className="block">
              <span className="mb-1 block text-sm font-medium text-slate-700">Название</span>
              <input
                className="w-full rounded-md border border-slate-300 px-3 py-2 outline-none focus:border-emerald-500"
                value={form.title}
                onChange={(event) => setForm({ ...form, title: event.target.value })}
                required
              />
            </label>

            <label className="block">
              <span className="mb-1 block text-sm font-medium text-slate-700">Описание</span>
              <textarea
                className="min-h-32 w-full resize-y rounded-md border border-slate-300 px-3 py-2 outline-none focus:border-emerald-500"
                value={form.description}
                onChange={(event) => setForm({ ...form, description: event.target.value })}
                required
              />
            </label>

            <div className="grid gap-3 md:grid-cols-2">
              <label className="block">
                <span className="mb-1 block text-sm font-medium text-slate-700">Статус</span>
                <select
                  className="w-full rounded-md border border-slate-300 px-3 py-2"
                  value={form.status}
                  onChange={(event) => setForm({ ...form, status: event.target.value as TaskStatus })}
                >
                  {statuses.map((status) => (
                    <option key={status} value={status}>
                      {statusLabels[status]}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="mb-1 block text-sm font-medium text-slate-700">Приоритет</span>
                <select
                  className="w-full rounded-md border border-slate-300 px-3 py-2"
                  value={form.priority}
                  onChange={(event) => setForm({ ...form, priority: event.target.value as Priority })}
                >
                  {Object.entries(priorityLabels).map(([priority, label]) => (
                    <option key={priority} value={priority}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="mb-1 block text-sm font-medium text-slate-700">Группа</span>
                <select
                  className="w-full rounded-md border border-slate-300 px-3 py-2"
                  value={form.groupId}
                  onChange={(event) => setForm({ ...form, groupId: event.target.value, projectId: "", assigneeId: "" })}
                >
                  {groups.map((group) => (
                    <option key={group.id} value={group.id}>
                      {group.code} · {group.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="mb-1 block text-sm font-medium text-slate-700">Проект</span>
                <select
                  className="w-full rounded-md border border-slate-300 px-3 py-2"
                  value={form.projectId}
                  onChange={(event) => setForm({ ...form, projectId: event.target.value })}
                >
                  <option value="">Без проекта</option>
                  {projectOptions.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="mb-1 block text-sm font-medium text-slate-700">Исполнитель</span>
                <select
                  className="w-full rounded-md border border-slate-300 px-3 py-2"
                  value={form.assigneeId}
                  onChange={(event) => setForm({ ...form, assigneeId: event.target.value })}
                >
                  <option value="">Не назначен</option>
                  {assigneeOptions.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="mb-1 block text-sm font-medium text-slate-700">Дедлайн</span>
                <input
                  className="w-full rounded-md border border-slate-300 px-3 py-2"
                  value={form.deadline}
                  onChange={(event) => setForm({ ...form, deadline: event.target.value })}
                  type="datetime-local"
                />
              </label>

              <label className="block">
                <span className="mb-1 block text-sm font-medium text-slate-700">Теги</span>
                <input
                  className="w-full rounded-md border border-slate-300 px-3 py-2"
                  value={form.tags}
                  onChange={(event) => setForm({ ...form, tags: event.target.value })}
                  placeholder="frontend, demo"
                />
              </label>

              <label className="block">
                <span className="mb-1 block text-sm font-medium text-slate-700">Оценка</span>
                <input
                  className="w-full rounded-md border border-slate-300 px-3 py-2"
                  value={form.grade}
                  onChange={(event) => setForm({ ...form, grade: event.target.value })}
                  min={0}
                  max={100}
                  type="number"
                  disabled={!canGrade}
                />
              </label>
            </div>

            <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
              <h3 className="mb-3 text-sm font-semibold text-slate-800">PERT и локальное планирование</h3>
              <div className="grid gap-3 md:grid-cols-3">
                <label className="block">
                  <span className="mb-1 block text-xs font-medium text-slate-600">Optimistic, ч</span>
                  <input
                    className="w-full rounded-md border border-slate-300 px-3 py-2"
                    value={form.pertOptimisticHours}
                    onChange={(event) => setForm({ ...form, pertOptimisticHours: event.target.value })}
                    min={0.5}
                    step={0.5}
                    type="number"
                  />
                </label>
                <label className="block">
                  <span className="mb-1 block text-xs font-medium text-slate-600">Most likely, ч</span>
                  <input
                    className="w-full rounded-md border border-slate-300 px-3 py-2"
                    value={form.pertMostLikelyHours}
                    onChange={(event) => setForm({ ...form, pertMostLikelyHours: event.target.value })}
                    min={0.5}
                    step={0.5}
                    type="number"
                  />
                </label>
                <label className="block">
                  <span className="mb-1 block text-xs font-medium text-slate-600">Pessimistic, ч</span>
                  <input
                    className="w-full rounded-md border border-slate-300 px-3 py-2"
                    value={form.pertPessimisticHours}
                    onChange={(event) => setForm({ ...form, pertPessimisticHours: event.target.value })}
                    min={0.5}
                    step={0.5}
                    type="number"
                  />
                </label>
                <label className="block">
                  <span className="mb-1 block text-xs font-medium text-slate-600">Начать</span>
                  <input
                    className="w-full rounded-md border border-slate-300 px-3 py-2"
                    value={form.scheduledStart}
                    onChange={(event) => setForm({ ...form, scheduledStart: event.target.value })}
                    type="datetime-local"
                  />
                </label>
                <label className="block">
                  <span className="mb-1 block text-xs font-medium text-slate-600">Закончить</span>
                  <input
                    className="w-full rounded-md border border-slate-300 px-3 py-2"
                    value={form.scheduledEnd}
                    onChange={(event) => setForm({ ...form, scheduledEnd: event.target.value })}
                    type="datetime-local"
                  />
                </label>
                <label className="block">
                  <span className="mb-1 block text-xs font-medium text-slate-600">Привязка к паре</span>
                  <select
                    className="w-full rounded-md border border-slate-300 px-3 py-2"
                    value={form.scheduleLessonId}
                    onChange={(event) => setForm({ ...form, scheduleLessonId: event.target.value })}
                  >
                    <option value="">Без пары</option>
                    {lessonOptions.map((lesson) => (
                      <option key={lesson.id} value={lesson.id}>
                        {lesson.subject} · {formatDateTime(lesson.startsAt)}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              {task?.pertExpectedHours && (
                <p className="mt-2 text-xs text-slate-500">Expected PERT: {task.pertExpectedHours} ч</p>
              )}
            </div>

            {aiReminder && <p className="rounded-md bg-violet-50 px-3 py-2 text-sm text-violet-800">{aiReminder}</p>}

            <div className="flex flex-wrap items-center gap-2">
              <button
                className="inline-flex items-center gap-2 rounded-md bg-slate-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800 disabled:opacity-60"
                type="submit"
                disabled={saving}
              >
                <Save size={16} aria-hidden />
                Сохранить
              </button>
              <button
                className="inline-flex items-center gap-2 rounded-md border border-violet-200 px-4 py-2 text-sm font-medium text-violet-700 transition hover:bg-violet-50"
                type="button"
                onClick={handleAiImprove}
                disabled={saving}
              >
                <Bot size={16} aria-hidden />
                AI улучшить
              </button>
              {task && (
                <button
                  className="ml-auto inline-flex items-center gap-2 rounded-md border border-rose-200 px-4 py-2 text-sm font-medium text-rose-700 transition hover:bg-rose-50"
                  type="button"
                  onClick={handleDelete}
                >
                  <Trash2 size={16} aria-hidden />
                  Удалить
                </button>
              )}
            </div>
          </form>

          <aside className="border-t border-slate-200 bg-slate-50 p-5 lg:border-l lg:border-t-0">
            <h3 className="mb-3 text-sm font-semibold text-slate-800">Комментарии</h3>
            <div className="mb-4 space-y-3">
              {task?.comments?.map((item) => (
                <div key={item.id} className="rounded-md border border-slate-200 bg-white p-3">
                  <div className="mb-2 flex items-center gap-2">
                    <Avatar user={item.author} size="sm" />
                    <div className="min-w-0">
                      <div className="truncate text-xs font-semibold text-slate-800">{item.author.name}</div>
                      <div className="text-[11px] text-slate-400">{formatDateTime(item.createdAt)}</div>
                    </div>
                    {item.grade !== null && item.grade !== undefined && (
                      <span className="ml-auto rounded-md bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700">
                        {item.grade}
                      </span>
                    )}
                  </div>
                  <p className="text-sm leading-5 text-slate-600">{item.body}</p>
                </div>
              ))}
              {!task && <p className="text-sm text-slate-500">Комментарии появятся после создания задачи.</p>}
              {task?.comments?.length === 0 && <p className="text-sm text-slate-500">Комментариев пока нет.</p>}
            </div>

            {task && (
              <div className="space-y-2">
                <textarea
                  className="min-h-24 w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-500"
                  value={comment}
                  onChange={(event) => setComment(event.target.value)}
                  placeholder="Комментарий"
                />
                {canGrade && (
                  <input
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                    value={commentGrade}
                    onChange={(event) => setCommentGrade(event.target.value)}
                    min={0}
                    max={100}
                    type="number"
                    placeholder="Оценка, если нужна"
                  />
                )}
                <button
                  className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-emerald-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-emerald-700"
                  type="button"
                  onClick={handleComment}
                >
                  <MessageSquarePlus size={16} aria-hidden />
                  Добавить комментарий
                </button>
              </div>
            )}
          </aside>
        </div>
      </section>
    </div>
  );
}
