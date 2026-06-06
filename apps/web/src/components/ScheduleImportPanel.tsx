import { useState } from "react";
import { Upload } from "lucide-react";
import { useAppStore } from "../store/app-store";

const sampleCsv =
  "startsAt,endsAt,teacherName,room,lessonType,subject,topic\n" +
  "2026-06-10T09:00:00.000Z,2026-06-10T10:30:00.000Z,Ирина Сергеевна,304,LECTURE,Проектирование ИС,PERT и планирование\n" +
  "2026-06-10T10:45:00.000Z,2026-06-10T12:15:00.000Z,Ирина Сергеевна,Лаб. 2,LAB,Web-разработка,Демо MVP";

export function ScheduleImportPanel() {
  const groups = useAppStore((state) => state.groups);
  const importScheduleCsv = useAppStore((state) => state.importScheduleCsv);
  const [open, setOpen] = useState(false);
  const [groupId, setGroupId] = useState("");
  const [csv, setCsv] = useState(sampleCsv);
  const [message, setMessage] = useState<string | null>(null);

  async function handleImport() {
    const targetGroupId = groupId || groups[0]?.id;
    if (!targetGroupId) {
      setMessage("Сначала нужна хотя бы одна группа.");
      return;
    }
    const count = await importScheduleCsv(targetGroupId, csv);
    setMessage(`Импортировано занятий: ${count}`);
  }

  return (
    <section className="mb-4 rounded-md border border-slate-200 bg-white p-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-slate-800">Импорт расписания</h2>
          <p className="text-xs text-slate-500">CSV из таблицы или OCR: startsAt, endsAt, teacherName, room, lessonType, subject, topic.</p>
        </div>
        <button
          className="inline-flex items-center gap-2 rounded-md border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          type="button"
          onClick={() => setOpen((value) => !value)}
        >
          <Upload size={16} aria-hidden />
          {open ? "Скрыть" : "Загрузить CSV"}
        </button>
      </div>

      {open && (
        <div className="mt-3 grid gap-3 lg:grid-cols-[220px_1fr_140px]">
          <select
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
            value={groupId}
            onChange={(event) => setGroupId(event.target.value)}
          >
            <option value="">Группа по умолчанию</option>
            {groups.map((group) => (
              <option key={group.id} value={group.id}>
                {group.code}
              </option>
            ))}
          </select>
          <textarea
            className="min-h-28 rounded-md border border-slate-300 px-3 py-2 text-xs"
            value={csv}
            onChange={(event) => setCsv(event.target.value)}
          />
          <button
            className="rounded-md bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-700"
            type="button"
            onClick={() => void handleImport()}
          >
            Импорт
          </button>
          {message && <p className="lg:col-span-3 rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{message}</p>}
        </div>
      )}
    </section>
  );
}
