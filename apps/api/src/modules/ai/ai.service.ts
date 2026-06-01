import { Priority } from "@prisma/client";

export type AiTaskSuggestionInput = {
  topic: string;
  description?: string;
  deadline?: string | null;
  role?: string;
};

export type AiTaskSuggestion = {
  title: string;
  improvedDescription: string;
  suggestedPriority: Priority;
  tags: string[];
  deadlineReminder: string;
};

export interface AiAssistantService {
  suggestTask(input: AiTaskSuggestionInput): Promise<AiTaskSuggestion>;
  buildDeadlineReminder(input: { title: string; deadline?: string | null; priority?: Priority }): Promise<string>;
}

class RuleBasedAiAssistant implements AiAssistantService {
  async suggestTask(input: AiTaskSuggestionInput): Promise<AiTaskSuggestion> {
    const normalizedTopic = input.topic.trim();
    const topic = normalizedTopic || "учебная задача";
    const priority = this.suggestPriority(input.description ?? topic, input.deadline);

    return {
      title: this.buildTitle(topic),
      improvedDescription: this.expandDescription(topic, input.description),
      suggestedPriority: priority,
      tags: this.extractTags(topic, input.description),
      deadlineReminder: await this.buildDeadlineReminder({ title: topic, deadline: input.deadline, priority })
    };
  }

  async buildDeadlineReminder(input: { title: string; deadline?: string | null; priority?: Priority }) {
    if (!input.deadline) {
      return `Для задачи "${input.title}" стоит добавить дедлайн, чтобы она не потерялась в потоке.`;
    }

    const daysLeft = Math.ceil((new Date(input.deadline).getTime() - Date.now()) / 86_400_000);
    if (daysLeft < 0) {
      return `Задача "${input.title}" уже просрочена. Лучше сразу перевести ее в высокий приоритет и назначить ответственного.`;
    }
    if (daysLeft <= 2) {
      return `До дедлайна задачи "${input.title}" осталось ${daysLeft} дн. Проверьте блокеры сегодня.`;
    }

    return `До дедлайна задачи "${input.title}" осталось ${daysLeft} дн. Запланируйте промежуточную проверку прогресса.`;
  }

  private buildTitle(topic: string) {
    const clean = topic.replace(/\s+/g, " ").trim();
    if (/подготов|презентац/i.test(clean)) return `Подготовить презентацию: ${clean}`;
    if (/тест|провер/i.test(clean)) return `Проверить и протестировать: ${clean}`;
    if (/дизайн|макет|ui/i.test(clean)) return `Собрать UI-макет: ${clean}`;
    return `Сделать: ${clean}`;
  }

  private expandDescription(topic: string, description?: string) {
    const base = description?.trim() || `Нужно выполнить работу по теме "${topic}".`;
    return `${base}\n\nКритерии готовности: есть понятный результат, задача проверена ответственным, материалы приложены в комментариях.`;
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

export const aiAssistant: AiAssistantService = new RuleBasedAiAssistant();
