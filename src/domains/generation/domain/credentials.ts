// Resolves which OpenRouter key + model a generation should use, and whether it
// spends the quota-gated shared key. BYOK (Locked Decision 4) bypasses the quota
// and chooses its own model; the server key is pinned to the default model so a
// user can't spend the shared key on a pricier one. Pure — no I/O.

export type GenerationAuth = {
  apiKey: string;
  model: string;
  usedServerKey: boolean;
};

export function resolveGenerationAuth(input: {
  byokKey?: string | null;
  byokModel?: string | null;
  serverKey: string;
  defaultModel: string;
}): GenerationAuth {
  const byokKey = input.byokKey?.trim();
  if (byokKey) {
    const byokModel = input.byokModel?.trim();
    return {
      apiKey: byokKey,
      model: byokModel || input.defaultModel,
      usedServerKey: false,
    };
  }
  return {
    apiKey: input.serverKey,
    model: input.defaultModel,
    usedServerKey: true,
  };
}
