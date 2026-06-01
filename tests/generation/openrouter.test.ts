import { afterEach, describe, expect, it, vi } from "vitest";
import { callOpenRouter } from "@/domains/generation/infrastructure/openrouter";

const params = {
  apiKey: "super-secret-key",
  model: "openai/gpt-5.4-nano",
  messages: [{ role: "user" as const, content: "hi" }],
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("callOpenRouter", () => {
  it("returns the assistant content on success", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        new Response(JSON.stringify({ choices: [{ message: { content: "hello" } }] }), {
          status: 200,
        }),
      ),
    );
    await expect(callOpenRouter(params)).resolves.toBe("hello");
  });

  it("sends the bearer token but never leaks the key in errors", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response("nope", { status: 401 })));
    await expect(callOpenRouter(params)).rejects.toThrow(/401/);
    await expect(callOpenRouter(params)).rejects.not.toThrow(/super-secret-key/);
  });

  it("throws when the response has no content", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(JSON.stringify({ choices: [] }), { status: 200 })),
    );
    await expect(callOpenRouter(params)).rejects.toThrow(/no message content/);
  });
});
