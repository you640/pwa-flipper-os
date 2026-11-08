import { afterEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, renderHook } from "@testing-library/react";
import { FunctionsHttpError } from "@supabase/supabase-js";
import { useAiValuation } from "@/hooks/useAiValuation";
const mocks = vi.hoisted(() => ({ invoke: vi.fn(), toast: vi.fn() }));
vi.mock("@/integrations/supabase/client", () => ({ supabase: { functions: { invoke: mocks.invoke } } }));
vi.mock("react-i18next", () => ({ useTranslation: () => ({ t: (key: string) => key }) }));
vi.mock("sonner", () => ({ toast: { error: mocks.toast } }));
afterEach(() => { cleanup(); vi.clearAllMocks(); });
const payload = { name: "Test", github_url: "https://github.com/test/repo", mrr: 0, expenses: 0, niche: "Test", anonymous: true };
describe("valuation HTTP errors", () => {
  it("recognizes the anonymous limit from the actual 429 response", async () => {
    mocks.invoke.mockResolvedValue({ data: null, error: new FunctionsHttpError(new Response(JSON.stringify({ error: "anon_limit" }), { status: 429 })) });
    const { result } = renderHook(() => useAiValuation());
    await act(async () => expect(await result.current.run(payload)).toEqual({ _anonLimit: true }));
    expect(mocks.toast).toHaveBeenCalledWith("landing.anonLimit");
    expect(result.current.loading).toBe(false);
  });
  it("does not mark upstream rate limits as a consumed free audit", async () => {
    mocks.invoke.mockResolvedValue({ data: null, error: new FunctionsHttpError(new Response(JSON.stringify({ error: "rate_limit" }), { status: 429 })) });
    const { result } = renderHook(() => useAiValuation());
    await act(async () => expect(await result.current.run(payload)).toBeNull());
    expect(mocks.toast).toHaveBeenCalledWith("valuation.ai.errors.rateLimit");
  });
});
