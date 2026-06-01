import { useState } from "react";
import { Bell, Bot, CalendarClock, Gauge, Send, TrendingUp } from "lucide-react";
import { statusLabels } from "../constants";
import { fromDateTimeLocal, formatDateTime } from "../lib/date";
import { api } from "../lib/api";
import { useAppStore } from "../store/app-store";

export function SidePanel() {
  const { analytics, notifications, deadlineAlerts } = useAppStore();
  const [topic, setTopic] = useState("подготовить защиту проекта");
  const [deadline, setDeadline] = useState("");
  const [suggestion, setSuggestion] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleAiSuggest() {
    setLoading(true);
    try {
      const response = await api.aiSuggest({ topic, deadline: fromDateTimeLocal(deadline) });
      setSuggestion(
        `${response.suggestion.title}\n${response.suggestion.suggestedPriority} · ${response.suggestion.tags.join(", ")}\n${response.suggestion.deadlineReminder}`
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <aside className="space-y-4">
      <section className="rounded-md border border-slate-200 bg-white p-4">
        <div className="mb-4 flex items-center gap-2">
          <Gauge size={18} className="text-emerald-600" aria-hidden />
          <h2 className="text-sm font-semibold text-slate-800">KPI</h2>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Kpi label="В срок" value={`${analytics?.onTimeCompletionPercent ?? 0}%`} />
          <Kpi label="Активные" value={analytics?.activeUsers ?? 0} />
          <Kpi label="Просрочены" value={analytics?.overdueTasks ?? 0} tone="danger" />
          <Kpi label="Закрытие" value={`${analytics?.averageCloseTimeDays ?? 0} дн.`} />
          <Kpi label="Готово" value={`${analytics?.doneTasks ?? 0}/${analytics?.totalTasks ?? 0}`} />
          <Kpi label="Оценка" value={analytics?.satisfaction ? `${analytics.satisfaction}/10` : "—"} />
        </div>
      </section>

      <section className="rounded-md border border-slate-200 bg-white p-4">
        <div className="mb-3 flex items-center gap-2">
          <TrendingUp size={18} className="text-sky-600" aria-hidden />
          <h2 className="text-sm font-semibold text-slate-800">Статусы</h2>
        </div>
        <div className="space-y-3">
          {analytics?.statusDistribution.map((item) => (
            <div key={item.status}>
              <div className="mb-1 flex justify-between text-xs text-slate-600">
                <span>{statusLabels[item.status]}</span>
                <span>{item.share}%</span>
              </div>
              <div className="h-2 rounded-full bg-slate-100">
                <div className="h-2 rounded-full bg-emerald-500" style={{ width: `${item.share}%` }} />
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-md border border-slate-200 bg-white p-4">
        <div className="mb-3 flex items-center gap-2">
          <Bell size={18} className="text-amber-600" aria-hidden />
          <h2 className="text-sm font-semibold text-slate-800">Уведомления</h2>
        </div>
        <div className="space-y-2">
          {deadlineAlerts.slice(0, 3).map((alert) => (
            <div key={alert.id} className="rounded-md border border-amber-200 bg-amber-50 p-2 text-xs text-amber-900">
              <div className="font-semibold">{alert.title}</div>
              <div className="mt-1 inline-flex items-center gap-1">
                <CalendarClock size={13} aria-hidden />
                {formatDateTime(alert.deadline)}
              </div>
            </div>
          ))}
          {notifications.slice(0, 4).map((notification) => (
            <div key={notification.id} className="rounded-md border border-slate-200 p-2 text-xs text-slate-600">
              <div className="font-semibold text-slate-800">{notification.title}</div>
              <div>{notification.body}</div>
            </div>
          ))}
          {deadlineAlerts.length === 0 && notifications.length === 0 && (
            <p className="text-sm text-slate-500">Новых уведомлений нет.</p>
          )}
        </div>
      </section>

      <section className="rounded-md border border-slate-200 bg-white p-4">
        <div className="mb-3 flex items-center gap-2">
          <Bot size={18} className="text-violet-600" aria-hidden />
          <h2 className="text-sm font-semibold text-slate-800">AI-помощник</h2>
        </div>
        <div className="space-y-2">
          <input
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-500"
            value={topic}
            onChange={(event) => setTopic(event.target.value)}
            placeholder="Тема задачи"
          />
          <input
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-500"
            value={deadline}
            onChange={(event) => setDeadline(event.target.value)}
            type="datetime-local"
          />
          <button
            className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-slate-950 px-3 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
            type="button"
            onClick={handleAiSuggest}
            disabled={loading}
          >
            <Send size={15} aria-hidden />
            {loading ? "Генерирую..." : "Получить подсказку"}
          </button>
          {suggestion && <pre className="whitespace-pre-wrap rounded-md bg-slate-50 p-3 text-xs text-slate-700">{suggestion}</pre>}
        </div>
      </section>
    </aside>
  );
}

function Kpi({ label, value, tone = "default" }: { label: string; value: string | number; tone?: "default" | "danger" }) {
  return (
    <div className={`rounded-md border p-3 ${tone === "danger" ? "border-rose-200 bg-rose-50" : "border-slate-200 bg-slate-50"}`}>
      <div className="text-xs text-slate-500">{label}</div>
      <div className={`mt-1 text-xl font-semibold ${tone === "danger" ? "text-rose-700" : "text-slate-950"}`}>{value}</div>
    </div>
  );
}
