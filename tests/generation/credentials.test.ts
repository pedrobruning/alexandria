import { describe, expect, it } from "vitest";
import { resolveGenerationAuth } from "@/domains/generation/domain/credentials";

const SERVER = { serverKey: "sk-server", defaultModel: "openai/gpt-5.4-nano" };

describe("resolveGenerationAuth", () => {
  it("uses the server key + default model when no BYOK key is given", () => {
    expect(resolveGenerationAuth({ ...SERVER })).toEqual({
      apiKey: "sk-server",
      model: "openai/gpt-5.4-nano",
      usedServerKey: true,
    });
  });

  it("ignores the model picker on the server key (pinned to default)", () => {
    expect(resolveGenerationAuth({ ...SERVER, byokModel: "anthropic/claude" })).toEqual({
      apiKey: "sk-server",
      model: "openai/gpt-5.4-nano",
      usedServerKey: true,
    });
  });

  it("uses the BYOK key + chosen model and marks it non-server", () => {
    expect(
      resolveGenerationAuth({ ...SERVER, byokKey: "sk-or-user", byokModel: "anthropic/claude" }),
    ).toEqual({
      apiKey: "sk-or-user",
      model: "anthropic/claude",
      usedServerKey: false,
    });
  });

  it("falls back to the default model when BYOK has a key but no model", () => {
    expect(resolveGenerationAuth({ ...SERVER, byokKey: "sk-or-user" })).toEqual({
      apiKey: "sk-or-user",
      model: "openai/gpt-5.4-nano",
      usedServerKey: false,
    });
  });

  it("treats a blank/whitespace BYOK key as absent", () => {
    expect(resolveGenerationAuth({ ...SERVER, byokKey: "   ", byokModel: "anthropic/claude" })).toEqual({
      apiKey: "sk-server",
      model: "openai/gpt-5.4-nano",
      usedServerKey: true,
    });
  });

  it("trims a BYOK key and a chosen model", () => {
    expect(
      resolveGenerationAuth({ ...SERVER, byokKey: "  sk-or-user  ", byokModel: "  anthropic/claude  " }),
    ).toEqual({
      apiKey: "sk-or-user",
      model: "anthropic/claude",
      usedServerKey: false,
    });
  });
});
