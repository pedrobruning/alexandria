import { describe, expect, it, vi } from "vitest";

vi.mock("@openrouter/sdk", () => ({ OpenRouter: vi.fn() }));

import { resolveModelCaller } from "@/domains/generation/infrastructure/resolveModelCaller";
import { callOpenRouter } from "@/domains/generation/infrastructure/openrouter";

describe("resolveModelCaller", () => {
  it("routes every model through the OpenRouter adapter today", () => {
    expect(resolveModelCaller("openai/gpt-5.4-nano")).toBe(callOpenRouter);
    expect(resolveModelCaller("anthropic/claude-3.5")).toBe(callOpenRouter);
  });
});
