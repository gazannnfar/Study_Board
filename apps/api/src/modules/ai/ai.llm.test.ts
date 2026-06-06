import { describe, expect, it } from "vitest";
import { aiAssistant } from "./ai.service.js";
import { mergeSuggestion } from "./ai.llm.js";

describe("LLM suggestion merge", () => {
  it("overrides prose fields but keeps deterministic PERT numbers", async () => {
    const base = await aiAssistant.suggestTask({
      topic: "backend API",
      mode: "AI_STRICT",
      pert: { optimistic: 2, mostLikely: 5, pessimistic: 12 }
    });

    const merged = mergeSuggestion(base, {
      title: "LLM title",
      summary: "LLM summary",
      suggestedPriority: "urgent",
      tags: ["a", "b"],
      subtasks: ["s1", "s2", "s3"]
    });

    expect(merged.title).toBe("LLM title");
    expect(merged.summary).toBe("LLM summary");
    expect(merged.suggestedPriority).toBe("URGENT");
    expect(merged.tags).toEqual(["a", "b"]);
    // PERT must never come from the model.
    expect(merged.pert).toEqual(base.pert);
    expect(merged.pert?.expected).toBe(5.67);
  });

  it("falls back to base values for missing or invalid model output", async () => {
    const base = await aiAssistant.suggestTask({ topic: "qa testing", mode: "AI_LIGHT" });

    expect(mergeSuggestion(base, null)).toEqual(base);
    expect(mergeSuggestion(base, "not an object")).toEqual(base);

    const partial = mergeSuggestion(base, { suggestedPriority: "NONSENSE", tags: [] });
    expect(partial.suggestedPriority).toBe(base.suggestedPriority);
    expect(partial.tags).toEqual(base.tags);
  });
});
