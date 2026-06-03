import { beforeEach, describe, expect, it, vi } from "vitest";

const { send, OpenRouterCtor } = vi.hoisted(() => {
  const send = vi.fn();
  const OpenRouterCtor = vi.fn(function () {
    return { chat: { send } };
  });
  return { send, OpenRouterCtor };
});

vi.mock("@openrouter/sdk", () => ({ OpenRouter: OpenRouterCtor }));

import { callOpenRouter } from "@/domains/generation/infrastructure/openrouter";

const params = {
  apiKey: "super-secret-key",
  model: "openai/gpt-5.4-nano",
  messages: [{ role: "user" as const, content: "hi" }],
};

beforeEach(() => {
  send.mockReset();
  OpenRouterCtor.mockClear();
});

describe("callOpenRouter", () => {
  it("returns the assistant content on success", async () => {
    send.mockResolvedValue({ choices: [{ message: { content: "hello" } }] });
    await expect(callOpenRouter(params)).resolves.toBe("hello");
  });

  it("builds the client with the key and forwards model, messages, and signal", async () => {
    send.mockResolvedValue({ choices: [{ message: { content: "hello" } }] });
    const signal = new AbortController().signal;
    await callOpenRouter({ ...params, signal });

    expect(OpenRouterCtor).toHaveBeenCalledWith({ apiKey: "super-secret-key" });
    const chatRequest = send.mock.calls[0][0].chatRequest;
    expect(chatRequest.model).toBe("openai/gpt-5.4-nano");
    expect(chatRequest.messages).toEqual(params.messages);
    expect(chatRequest.stream).toBe(false);
    expect(send.mock.calls[0][1]).toEqual({ signal });
  });

  it("propagates provider errors without leaking the key", async () => {
    send.mockRejectedValue(new Error("OpenRouter request failed (401)"));
    await expect(callOpenRouter(params)).rejects.toThrow(/401/);
    await expect(callOpenRouter(params)).rejects.not.toThrow(/super-secret-key/);
  });

  it("throws when the response has no content", async () => {
    send.mockResolvedValue({ choices: [] });
    await expect(callOpenRouter(params)).rejects.toThrow(/no message content/);
  });
});
