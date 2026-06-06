import { Priority } from "@prisma/client";
import { env } from "../../config/env.js";
import { LlmAiAssistant } from "./ai.llm.js";

export type AiMode = "AI_STRICT" | "AI_LIGHT";

export type PertInput = {
  optimistic: number;
  mostLikely: number;
  pessimistic: number;
};

export type PertResult = PertInput & {
  expected: number;
  spread: number;
  confidence: "HIGH" | "MEDIUM" | "LOW";
};

export type AiTaskSuggestionInput = {
  topic: string;
  description?: string;
  deadline?: string | null;
  role?: string;
  mode?: AiMode;
  pert?: Partial<PertInput>;
  freeSlotMinutes?: number;
};

export type AiTaskSuggestion = {
  mode: AiMode;
  title: string;
  improvedDescription: string;
  suggestedPriority: Priority;
  tags: string[];
  deadlineReminder: string;
  pert: PertResult | null;
  summary: string;
  risks: string[];
  dependencies: string[];
  subtasks: string[];
};

export interface AiAssistantService {
  suggestTask(input: AiTaskSuggestionInput): Promise<AiTaskSuggestion>;
  estimatePert(input: PertInput): PertResult;
  buildDeadlineReminder(input: { title: string; deadline?: string | null; priority?: Priority; mode?: AiMode }): Promise<string>;
  reviewScheduleContext(input: {
    title: string;
    mode?: AiMode;
    expectedHours?: number | null;
    freeSlotMinutes?: number;
    deadline?: string | null;
  }): Promise<{ mode: AiMode; recommendation: string; riskLevel: "LOW" | "MEDIUM" | "HIGH" }>;
}

const defaultPert: PertInput = {
  optimistic: 1,
  mostLikely: 2,
  pessimistic: 4
};

class RuleBasedAiAssistant implements AiAssistantService {
  async suggestTask(input: AiTaskSuggestionInput): Promise<AiTaskSuggestion> {
    const mode = input.mode ?? "AI_LIGHT";
    const normalizedTopic = input.topic.trim();
    const topic = normalizedTopic || "учебная задача";
    const priority = this.suggestPriority(input.description ?? topic, input.deadline);
    const pert = this.normalizePert(input.pert);
    const scheduleReview = await this.reviewScheduleContext({
      title: topic,
      mode,
      expectedHours: pert.expected,
      freeSlotMinutes: input.freeSlotMinutes,
      deadline: input.deadline
    });

    return {
      mode,
      title: this.buildTitle(topic),
      improvedDescription: this.expandDescription(topic, input.description, mode),
      suggestedPriority: priority,
      tags: this.extractTags(topic, input.description),
      deadlineReminder: await this.buildDeadlineReminder({ title: topic, deadline: input.deadline, priority, mode }),
      pert,
      summary: this.buildSummary(topic, pert, scheduleReview.recommendation, mode),
      risks: this.buildRisks(topic, input.deadline, pert, input.freeSlotMinutes, mode),
      dependencies: this.buildDependencies(topic, mode),
      subtasks: this.buildSubtasks(topic, mode)
    };
  }

  estimatePert(input: PertInput): PertResult {
    if (input.optimistic <= 0 || input.mostLikely <= 0 || input.pessimistic <= 0) {
      throw new Error("PERT values must be positive");
    }
    if (input.optimistic > input.mostLikely || input.mostLikely > input.pessimistic) {
      throw new Error("PERT values must satisfy optimistic <= mostLikely <= pessimistic");
    }

    const expected = Number(((input.optimistic + 4 * input.mostLikely + input.pessimistic) / 6).toFixed(2));
    const spread = Number((input.pessimistic - input.optimistic).toFixed(2));
    const ratio = spread / expected;
    const confidence = ratio <= 0.35 ? "HIGH" : ratio <= 0.9 ? "MEDIUM" : "LOW";

    return { ...input, expected, spread, confidence };
  }

  async buildDeadlineReminder(input: { title: string; deadline?: string | null; priority?: Priority; mode?: AiMode }) {
    const mode = input.mode ?? "AI_LIGHT";
    if (!input.deadline) {
      return mode === "AI_STRICT"
        ? `Для задачи "${input.title}" дедлайн отсутствует. Это повышает риск потери контроля: задайте срок, контрольную точку и ответственного.`
        : `Добавьте дедлайн для "${input.title}", чтобы задача не потерялась.`;
    }

    const daysLeft = Math.ceil((new Date(input.deadline).getTime() - Date.now()) / 86_400_000);
    if (daysLeft < 0) {
      return mode === "AI_STRICT"
        ? `Задача "${input.title}" просрочена. Нужны пересмотр объема, новый срок, владелец риска и короткий план восстановления.`
        : `"${input.title}" просрочена: сократите объем и поставьте ближайший слот.`;
    }
    if (daysLeft <= 2) {
      return mode === "AI_STRICT"
        ? `До дедлайна "${input.title}" осталось ${daysLeft} дн. Проверьте зависимости, блокеры и резерв времени по PERT.`
        : `До дедлайна ${daysLeft} дн.: берите ближайшее свободное окно.`;
    }

    return mode === "AI_STRICT"
      ? `До дедлайна "${input.title}" осталось ${daysLeft} дн. Запланируйте промежуточную проверку и резерв на пессимистичный сценарий.`
      : `Есть ${daysLeft} дн.: запланируйте первый короткий подход.`;
  }

  async reviewScheduleContext(input: {
    title: string;
    mode?: AiMode;
    expectedHours?: number | null;
    freeSlotMinutes?: number;
    deadline?: string | null;
  }) {
    const mode = input.mode ?? "AI_LIGHT";
    const expectedMinutes = Math.ceil((input.expectedHours ?? defaultPert.mostLikely) * 60);
    const freeSlotMinutes = input.freeSlotMinutes ?? 0;
    const riskLevel: "LOW" | "MEDIUM" | "HIGH" =
      freeSlotMinutes >= expectedMinutes ? "LOW" : freeSlotMinutes >= expectedMinutes * 0.5 ? "MEDIUM" : "HIGH";

    if (mode === "AI_STRICT") {
      return {
        mode,
        riskLevel,
        recommendation:
          riskLevel === "LOW"
            ? `Свободный слот покрывает ожидаемую PERT-оценку ${expectedMinutes} мин. Можно планировать задачу целиком.`
            : `Свободный слот ${freeSlotMinutes} мин не покрывает ожидаемую PERT-оценку ${expectedMinutes} мин. Разбейте "${input.title}" на подзадачи и оставьте резерв.`
      };
    }

    return {
      mode,
      riskLevel,
      recommendation:
        riskLevel === "LOW"
          ? `Слот подходит: можно делать задачу целиком.`
          : `Слота мало: делайте первый кусок и дробите задачу.`
    };
  }

  private normalizePert(input?: Partial<PertInput>): PertResult {
    return this.estimatePert({
      optimistic: input?.optimistic ?? defaultPert.optimistic,
      mostLikely: input?.mostLikely ?? defaultPert.mostLikely,
      pessimistic: input?.pessimistic ?? defaultPert.pessimistic
    });
  }

  private buildTitle(topic: string) {
    const clean = topic.replace(/\s+/g, " ").trim();
    if (/подготов|презентац|защит/i.test(clean)) return `Подготовить защиту: ${clean}`;
    if (/тест|провер/i.test(clean)) return `Проверить и протестировать: ${clean}`;
    if (/дизайн|макет|ui/i.test(clean)) return `Собрать UI-макет: ${clean}`;
    return `Сделать: ${clean}`;
  }

  private expandDescription(topic: string, description: string | undefined, mode: AiMode) {
    const base = description?.trim() || `Нужно выполнить работу по теме "${topic}".`;
    if (mode === "AI_LIGHT") {
      return `${base}\n\nГотово, когда есть результат, проверка и короткий комментарий в задаче.`;
    }
    return `${base}\n\nКритерии готовности: результат доступен команде, задача проверена ответственным, материалы приложены, риски закрыты или описаны, срок соотнесен с расписанием группы.`;
  }

  private buildSummary(topic: string, pert: PertResult, scheduleRecommendation: string, mode: AiMode) {
    if (mode === "AI_LIGHT") {
      return `Оценка: ${pert.expected} ч. ${scheduleRecommendation}`;
    }
    return `Формальная оценка "${topic}": O=${pert.optimistic} ч, M=${pert.mostLikely} ч, P=${pert.pessimistic} ч, E=${pert.expected} ч, уверенность=${pert.confidence}. ${scheduleRecommendation}`;
  }

  private buildRisks(topic: string, deadline?: string | null, pert?: PertResult, freeSlotMinutes?: number, mode: AiMode = "AI_LIGHT") {
    const risks: string[] = [];
    if (!deadline) risks.push("Нет дедлайна, контроль срока слабый.");
    if (pert && pert.confidence === "LOW") risks.push("Большой разброс PERT, оценка нестабильна.");
    if (pert && freeSlotMinutes !== undefined && freeSlotMinutes < pert.expected * 60) risks.push("Свободное окно меньше ожидаемой длительности.");
    if (/интеграц|api|backend|database/i.test(topic)) risks.push("Есть риск зависимостей от backend/API/данных.");
    if (risks.length === 0) risks.push(mode === "AI_STRICT" ? "Критичных рисков не видно, но нужен контрольный чек-пойнт." : "Серьезных рисков не видно.");
    return mode === "AI_LIGHT" ? risks.slice(0, 2) : risks;
  }

  private buildDependencies(topic: string, mode: AiMode) {
    const dependencies = ["ответственный исполнитель", "актуальный дедлайн"];
    if (/дизайн|ui|frontend/i.test(topic)) dependencies.push("макет или UX-решение");
    if (/backend|api|database|база/i.test(topic)) dependencies.push("контракт API и доступ к данным");
    if (/презентац|защит/i.test(topic)) dependencies.push("готовый демо-сценарий");
    return mode === "AI_LIGHT" ? dependencies.slice(0, 2) : dependencies;
  }

  private buildSubtasks(topic: string, mode: AiMode) {
    const subtasks = mode === "AI_LIGHT"
      ? ["Уточнить результат", "Сделать первый проход", "Проверить и закрыть"]
      : [
          "Уточнить критерии готовности",
          "Проверить зависимости и входные материалы",
          "Выполнить основную работу",
          "Провести самопроверку",
          "Передать на review и зафиксировать результат"
        ];

    if (/презентац|защит/i.test(topic) && mode === "AI_STRICT") {
      subtasks.push("Подготовить резервный сценарий демонстрации");
    }
    return subtasks;
  }

  private suggestPriority(text: string, deadline?: string | null) {
    const lower = text.toLowerCase();
    if (/(срочно|экзамен|защита|критич|сегодня)/i.test(lower)) return Priority.URGENT;
    if (deadline) {
      const daysLeft = Math.ceil((new Date(deadline).getTime() - Date.now()) / 86_400_000);
      if (daysLeft <= 2) return Priority.HIGH;
      if (daysLeft <= 5) return Priority.MEDIUM;
    }
    if (/(исслед|аналит|архитект|backend|frontend)/i.test(lower)) return Priority.HIGH;
    return Priority.MEDIUM;
  }

  private extractTags(topic: string, description?: string) {
    const text = `${topic} ${description ?? ""}`.toLowerCase();
    const tags = new Set<string>();
    if (/backend|api|сервер|database|база/.test(text)) tags.add("backend");
    if (/frontend|ui|react|интерфейс|дизайн/.test(text)) tags.add("frontend");
    if (/презентац|защита|доклад/.test(text)) tags.add("presentation");
    if (/тест|qa|провер/.test(text)) tags.add("qa");
    if (/аналит|kpi|метрик/.test(text)) tags.add("analytics");
    if (tags.size === 0) tags.add("study");
    return [...tags].slice(0, 4);
  }
}

export { RuleBasedAiAssistant };

function createAiAssistant(): AiAssistantService {
  const ruleBased = new RuleBasedAiAssistant();
  // Lazy import avoids a require cycle at module-eval time; ai.llm only needs types here.
  if (env.AI_PROVIDER === "llm" && env.AI_API_KEY) {
    return new LlmAiAssistant(ruleBased);
  }
  return ruleBased;
}

export const aiAssistant: AiAssistantService = createAiAssistant();
