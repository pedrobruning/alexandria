import { describe, expect, it } from "vitest";
import en from "../../messages/en.json";
import ptBR from "../../messages/pt-BR.json";

// Flattens nested message objects to dotted key paths for set comparison.
function keyPaths(obj: unknown, prefix = ""): string[] {
  if (obj === null || typeof obj !== "object") return [prefix];
  return Object.entries(obj as Record<string, unknown>).flatMap(([k, v]) =>
    keyPaths(v, prefix ? `${prefix}.${k}` : k),
  );
}

describe("landing message parity", () => {
  it("en and pt-BR define the same landing keys", () => {
    const enKeys = keyPaths(en.landing).sort();
    const ptKeys = keyPaths(ptBR.landing).sort();
    expect(ptKeys).toEqual(enKeys);
  });
});
