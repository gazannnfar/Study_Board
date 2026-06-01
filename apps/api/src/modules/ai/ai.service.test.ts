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
    expect(suggestion.improvedDescription).toContain("Критерии готовности");
  });

  it("builds a useful reminder for missing deadline", async () => {
    const reminder = await aiAssistant.buildDeadlineReminder({ title: "README" });
    expect(reminder).toContain("дедлайн");
  });
});
