import { DndContext, PointerSensor, useDroppable, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { Plus } from "lucide-react";
import { statusLabels, statuses } from "../constants";
import { useAppStore } from "../store/app-store";
import type { Task, TaskStatus } from "../types";
import { TaskCard } from "./TaskCard";

type Props = {
  onOpenTask: (task: Task) => void;
  onCreateTask: (status?: TaskStatus) => void;
};

function Column({
  status,
  tasks,
  onOpenTask,
  onCreateTask
}: {
  status: TaskStatus;
  tasks: Task[];
  onOpenTask: (task: Task) => void;
  onCreateTask: (status?: TaskStatus) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status });

  return (
    <section
      ref={setNodeRef}
      className={`flex min-h-[620px] min-w-[272px] flex-1 flex-col rounded-md border bg-slate-50 transition ${
        isOver ? "border-emerald-400 bg-emerald-50" : "border-slate-200"
      }`}
    >
      <div className="flex h-12 items-center justify-between border-b border-slate-200 px-3">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold text-slate-800">{statusLabels[status]}</h2>
          <span className="rounded-full bg-white px-2 py-0.5 text-xs font-medium text-slate-500">{tasks.length}</span>
        </div>
        <button
          className="inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-500 transition hover:bg-white hover:text-slate-900"
          type="button"
          title="Создать задачу в колонке"
          onClick={() => onCreateTask(status)}
        >
          <Plus size={17} aria-hidden />
        </button>
      </div>
      <div className="scrollbar-thin flex flex-1 flex-col gap-3 overflow-y-auto p-3">
        {tasks.map((task) => (
          <TaskCard key={task.id} task={task} onOpen={onOpenTask} />
        ))}
        {tasks.length === 0 && (
          <button
            className="rounded-md border border-dashed border-slate-300 px-3 py-8 text-sm text-slate-400 transition hover:border-emerald-300 hover:bg-white hover:text-slate-700"
            type="button"
            onClick={() => onCreateTask(status)}
          >
            Добавить задачу
          </button>
        )}
      </div>
    </section>
  );
}

export function KanbanBoard({ onOpenTask, onCreateTask }: Props) {
  const tasks = useAppStore((state) => state.tasks);
  const updateTask = useAppStore((state) => state.updateTask);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const grouped = statuses.reduce<Record<TaskStatus, Task[]>>(
    (acc, status) => {
      acc[status] = tasks.filter((task) => task.status === status);
      return acc;
    },
    { BACKLOG: [], TODO: [], IN_PROGRESS: [], REVIEW: [], DONE: [] }
  );

  async function handleDragEnd(event: DragEndEvent) {
    const taskId = String(event.active.id);
    const nextStatus = event.over?.id as TaskStatus | undefined;
    const task = tasks.find((item) => item.id === taskId);

    if (!task || !nextStatus || task.status === nextStatus) return;
    await updateTask(task.id, { status: nextStatus });
  }

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <div className="scrollbar-thin flex gap-3 overflow-x-auto pb-3">
        {statuses.map((status) => (
          <Column
            key={status}
            status={status}
            tasks={grouped[status]}
            onOpenTask={onOpenTask}
            onCreateTask={onCreateTask}
          />
        ))}
      </div>
    </DndContext>
  );
}
