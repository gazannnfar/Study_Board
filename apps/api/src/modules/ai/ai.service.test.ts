import { describe, expect, it } from "vitest";
import { Priority } from "@prisma/client";
import { aiAssistant } from "./ai.service.js";

describe("AI assistant fallback", () => {
  it("suggests urgent priority for defense-related tasks", async () => {
    const suggestion = await aiAssistant.suggestTask({
      topic: "срочно подготовить защиту проекта",
      description: "Нужно проверить демо и презентацию сегодня"
    });

    expect(suggestion.suggestedPriority).toBe(Priority.URGENT);
    expect(suggestion.tags).toContain("presentation");
    expect(suggestion.improvedDescription).toContain("Готово");
  });

  it("builds a useful reminder for missing deadline", async () => {
    const reminder = await aiAssistant.buildDeadlineReminder({ title: "README" });
    expect(reminder).toContain("дедлайн");
  });

  it("calculates PERT expected value", () => {
    const result = aiAssistant.estimatePert({ optimistic: 2, mostLikely: 5, pessimistic: 14 });
    expect(result.expected).toBe(6);
    expect(result.confidence).toBe("LOW");
  });

  it("returns different depth for strict and light modes", async () => {
    const strict = await aiAssistant.suggestTask({
      topic: "подготовить защиту проекта",
      mode: "AI_STRICT",
      pert: { optimistic: 2, mostLikely: 4, pessimistic: 10 },
      freeSlotMinutes: 60
    });
    const light = await aiAssistant.suggestTask({
      topic: "подготовить защиту проекта",
      mode: "AI_LIGHT",
      pert: { optimistic: 2, mostLikely: 4, pessimistic: 10 },
      freeSlotMinutes: 60
    });

    expect(strict.mode).toBe("AI_STRICT");
    expect(light.mode).toBe("AI_LIGHT");
    expect(strict.subtasks.length).toBeGreaterThan(light.subtasks.length);
    expect(strict.summary.length).toBeGreaterThan(light.summary.length);
  });
});
