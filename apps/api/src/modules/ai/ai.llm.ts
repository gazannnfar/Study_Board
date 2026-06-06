import { Priority } from "@prisma/client";
import { env } from "../../config/env.js";
import type {
  AiAssistantService,
  AiMode,
  AiTaskSuggestion,
  AiTaskSuggestionInput,
  PertInput,
  PertResult
} from "./ai.service.js";

/**
 * OpenAI-compatible LLM adapter (Groq / OpenRouter / OpenAI / local Ollama).
 *
 * Design notes:
 * - Only the *prose* fields are produced by the model. All PERT arithmetic and
 *   schedule risk math stay deterministic in the rule-based fallback, so the
 *   model can never corrupt the numbers shown on a defense.
 * - Every model call is wrapped: on timeout / HTTP error / bad JSON we return
 *   the rule-based result. The app therefore runs identically without a key.
 */

type ChatMessage = { role: "system" | "user" | "assistant"; content: string };

type ChatCompletionResponse = {
  choices?: Array<{ message?: { content?: string } }>;
};

async function chat(messages: ChatMessage[], options?: { json?: boolean }): Promise<string> {
  if (!env.AI_API_KEY) {
    throw new Error("AI_API_KEY is not configured");
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), env.AI_TIMEOUT_MS);

  try {
    const response = await fetch(`${env.AI_BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${env.AI_API_KEY}`
      },
      body: JSON.stringify({
        model: env.AI_MODEL,
        temperature: 0.4,
        messages,
        ...(options?.json ? { response_format: { type: "json_object" } } : {})
      }),
      signal: controller.signal
    });

    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      throw new Error(`LLM HTTP ${response.status}: ${detail.slice(0, 200)}`);
    }

    const data = (await response.json()) as ChatCompletionResponse;
    const content = data.choices?.[0]?.message?.content?.trim();
    if (!content) {
      throw new Error("LLM returned empty content");
    }
    return content;
  } finally {
    clearTimeout(timeout);
  }
}

function logFallback(scope: string, error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  console.warn(`[ai] LLM ${scope} failed, using rule-based fallback: ${message}`);
}

function asStringArray(value: unknown, limit: number): string[] | null {
  if (!Array.isArray(value)) return null;
  const items = value.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
  return items.length ? items.slice(0, limit) : null;
}

function asPriority(value: unknown): Priority | null {
  if (typeof value !== "string") return null;
  const upper = value.toUpperCase();
  return upper in Priority ? (Priority[upper as keyof typeof Priority] as Priority) : null;
}

/**
 * Merge model JSON onto the deterministic base suggestion. Pure and exported so
 * it can be unit-tested without any network call. PERT numbers are never taken
 * from the model — `base.pert` always wins.
 */
export function mergeSuggestion(base: AiTaskSuggestion, llm: unknown): AiTaskSuggestion {
  if (!llm || typeof llm !== "object") return base;
  const data = llm as Record<string, unknown>;

  return {
    ...base,
    title: typeof data.title === "string" && data.title.trim() ? data.title.trim() : base.title,
    improvedDescription:
      typeof data.improvedDescription === "string" && data.improvedDescription.trim()
        ? data.improvedDescription.trim()
        : base.improvedDescription,
    summary: typeof data.summary === "string" && data.summary.trim() ? data.summary.trim() : base.summary,
    deadlineReminder:
      typeof data.deadlineReminder === "string" && data.deadlineReminder.trim()
        ? data.deadlineReminder.trim()
        : base.deadlineReminder,
    suggestedPriority: asPriority(data.suggestedPriority) ?? base.suggestedPriority,
    tags: asStringArray(data.tags, 5) ?? base.tags,
    risks: asStringArray(data.risks, 6) ?? base.risks,
    dependencies: asStringArray(data.dependencies, 6) ?? base.dependencies,
    subtasks: asStringArray(data.subtasks, 8) ?? base.subtasks
    // pert and mode are intentionally kept from `base`.
  };
}

function suggestSystemPrompt(mode: AiMode): string {
  if (mode === "AI_STRICT") {
    return [
      "Ты — строгий, педантичный тимлид учебного проекта. Отвечай по-русски.",
      "Давай формальную, детальную декомпозицию: критерии готовности, риски, зависимости, подзадачи.",
      "Будь осторожен в оценках и явно упоминай резерв времени.",
      "Верни СТРОГО JSON-объект с полями: title (string), improvedDescription (string),",
      "summary (string), deadlineReminder (string), suggestedPriority (LOW|MEDIUM|HIGH|URGENT),",
      "tags (string[]), risks (string[]), dependencies (string[]), subtasks (string[] из 5-7 пунктов).",
      "Не считай числа PERT — они даются готовыми, просто упомяни их в summary."
    ].join(" ");
  }
  return [
    "Ты — лёгкий, практичный помощник студента. Отвечай по-русски, коротко и по делу.",
    "Давай быстрый ответ: что сделать в первую очередь и сколько примерно займёт.",
    "Верни СТРОГО JSON-объект с полями: title (string), improvedDescription (string),",
    "summary (короткая string), deadlineReminder (короткая string), suggestedPriority (LOW|MEDIUM|HIGH|URGENT),",
    "tags (string[] до 3), risks (string[] до 2), dependencies (string[] до 2), subtasks (string[] из 2-3 пунктов).",
    "Не считай числа PERT — используй готовые из контекста."
  ].join(" ");
}

function suggestUserPrompt(input: AiTaskSuggestionInput, base: AiTaskSuggestion): string {
  const pert = base.pert;
  const lines = [
    `Тема задачи: ${input.topic}`,
    input.description ? `Текущее описание: ${input.description}` : "Описание не задано.",
    `Дедлайн: ${input.deadline ?? "не задан"}`,
    input.role ? `Роль автора: ${input.role}` : "",
    pert
      ? `PERT (готовые числа, не меняй): оптимистично=${pert.optimistic}ч, наиболее вероятно=${pert.mostLikely}ч, пессимистично=${pert.pessimistic}ч, ожидаемо=${pert.expected}ч, уверенность=${pert.confidence}.`
      : "",
    input.freeSlotMinutes !== undefined ? `Доступное свободное окно: ${input.freeSlotMinutes} мин.` : ""
  ].filter(Boolean);
  return lines.join("\n");
}

function deadlineSystemPrompt(mode: AiMode): string {
  return mode === "AI_STRICT"
    ? "Ты строгий тимлид. Дай ОДНО формальное напоминание о дедлайне на русском: упомяни контроль, резерв и риск срыва. Только текст, без префиксов."
    : "Ты лёгкий помощник студента. Дай ОДНО короткое практичное напоминание о дедлайне на русском. Только текст, без префиксов.";
}

export class LlmAiAssistant implements AiAssistantService {
  constructor(private readonly fallback: AiAssistantService) {}

  // Deterministic math — never delegated to the model.
  estimatePert(input: PertInput): PertResult {
    return this.fallback.estimatePert(input);
  }

  reviewScheduleContext(input: Parameters<AiAssistantService["reviewScheduleContext"]>[0]) {
    return this.fallback.reviewScheduleContext(input);
  }

  async buildDeadlineReminder(input: Parameters<AiAssistantService["buildDeadlineReminder"]>[0]) {
    const baseline = await this.fallback.buildDeadlineReminder(input);
    try {
      const mode = input.mode ?? "AI_LIGHT";
      const content = await chat([
        { role: "system", content: deadlineSystemPrompt(mode) },
        {
          role: "user",
          content: `Задача: "${input.title}". Дедлайн: ${input.deadline ?? "не задан"}. Приоритет: ${input.priority ?? "не задан"}.`
        }
      ]);
      return content || baseline;
    } catch (error) {
      logFallback("buildDeadlineReminder", error);
      return baseline;
    }
  }

  async suggestTask(input: AiTaskSuggestionInput): Promise<AiTaskSuggestion> {
    const base = await this.fallback.suggestTask(input);
    try {
      const mode = input.mode ?? "AI_LIGHT";
      const raw = await chat(
        [
          { role: "system", content: suggestSystemPrompt(mode) },
          { role: "user", content: suggestUserPrompt(input, base) }
        ],
        { json: true }
      );
      return mergeSuggestion(base, JSON.parse(raw));
    } catch (error) {
      logFallback("suggestTask", error);
      return base;
    }
  }
}
