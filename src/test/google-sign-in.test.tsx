import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import Login from "@/pages/Login";

const mocks = vi.hoisted(() => ({ oauth: vi.fn(), getUser: vi.fn(), error: vi.fn(), unsubscribe: vi.fn() }));
vi.mock("@/integrations/lovable/index", () => ({ lovable: { auth: { signInWithOAuth: mocks.oauth } } }));
vi.mock("@/integrations/supabase/client", () => ({ supabase: { auth: {
  getUser: mocks.getUser,
  onAuthStateChange: () => ({ data: { subscription: { unsubscribe: mocks.unsubscribe } } }),
} } }));
vi.mock("sonner", () => ({ toast: { error: mocks.error } }));
vi.mock("@/components/seo/SEO", () => ({ SEO: () => null }));
vi.mock("react-i18next", () => ({ useTranslation: () => ({ t: (key: string) => key }) }));
afterEach(() => { cleanup(); vi.resetAllMocks(); sessionStorage.clear(); });
function mount() {
  render(<MemoryRouter initialEntries={[{ pathname: "/login", state: { from: { pathname: "/portfolio" } } }]}><Routes><Route path="/login" element={<Login />} /><Route path="/portfolio" element={<div>Portfolio destination</div>} /></Routes></MemoryRouter>);
}
describe("Google sign-in", () => {
  it("uses Google with a public same-origin callback and remembers the intended page", async () => {
    mocks.getUser.mockResolvedValue({ data: { user: null } });
    mocks.oauth.mockResolvedValue({ redirected: true });
    mount();
    fireEvent.click(screen.getByRole("button", { name: "auth.continueWithGoogle" }));
    await waitFor(() => expect(mocks.oauth).toHaveBeenCalledWith("google", { redirect_uri: `${window.location.origin}/login` }));
    expect(sessionStorage.getItem("google-sign-in-destination")).toBe("/portfolio");
    expect(screen.queryByText("Portfolio destination")).not.toBeInTheDocument();
  });
  it("shows a safe error and enables retry when the provider fails", async () => {
    mocks.getUser.mockResolvedValue({ data: { user: null } });
    mocks.oauth.mockResolvedValue({ error: new Error("private provider details") });
    mount();
    fireEvent.click(screen.getByRole("button", { name: "auth.continueWithGoogle" }));
    await waitFor(() => expect(mocks.error).toHaveBeenCalledWith("auth.googleFailed"));
    expect(screen.getByRole("button", { name: "auth.continueWithGoogle" })).toBeEnabled();
    expect(sessionStorage.getItem("google-sign-in-destination")).toBeNull();
  });
  it("restores the intended page only for a validated user", async () => {
    sessionStorage.setItem("google-sign-in-destination", "/portfolio");
    mocks.getUser.mockResolvedValue({ data: { user: { id: "verified-user" } } });
    mount();
    expect(await screen.findByText("Portfolio destination")).toBeInTheDocument();
    expect(sessionStorage.getItem("google-sign-in-destination")).toBeNull();
  });
});