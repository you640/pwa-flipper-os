import { afterEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { AuthGuard } from "@/components/auth/AuthGuard";
const auth = vi.hoisted(() => ({ getSession: vi.fn(), unsubscribe: vi.fn(), callback: null as null | ((event: string, session: unknown) => void) }));
vi.mock("@/integrations/supabase/client", () => ({ supabase: { auth: {
  getSession: auth.getSession,
  onAuthStateChange: (cb: typeof auth.callback) => { auth.callback = cb; return { data: { subscription: { unsubscribe: auth.unsubscribe } } }; },
} } }));
vi.mock("react-i18next", () => ({ useTranslation: () => ({ t: (key: string) => key }) }));
afterEach(() => { cleanup(); vi.clearAllMocks(); });
function mount() { render(<MemoryRouter initialEntries={["/portfolio"]}><Routes><Route path="/portfolio" element={<AuthGuard><div>Private data</div></AuthGuard>} /><Route path="/login" element={<div>Login required</div>} /></Routes></MemoryRouter>); }
describe("AuthGuard", () => {
  it("redirects a signed-out user", async () => { auth.getSession.mockResolvedValue({ data: { session: null } }); mount(); expect(await screen.findByText("Login required")).toBeInTheDocument(); });
  it("shows authenticated content", async () => { auth.getSession.mockResolvedValue({ data: { session: { user: { id: "test-user" } } } }); mount(); expect(await screen.findByText("Private data")).toBeInTheDocument(); });
  it("fails closed if session lookup rejects", async () => { auth.getSession.mockRejectedValue(new Error("offline")); mount(); expect(await screen.findByText("Login required")).toBeInTheDocument(); });
  it("does not restore an old session after a sign-out event", async () => {
    let finish: (v: unknown) => void = () => {};
    auth.getSession.mockImplementation(() => new Promise(resolve => { finish = resolve; })); mount();
    await act(async () => {
      auth.callback?.("SIGNED_OUT", null);
      finish({ data: { session: { user: { id: "old-user" } } } });
    });
    await waitFor(() => expect(screen.getByText("Login required")).toBeInTheDocument());
    expect(screen.queryByText("Private data")).not.toBeInTheDocument();
  });
});
