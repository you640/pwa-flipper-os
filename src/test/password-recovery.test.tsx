import { afterEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import PasswordRecovery from "@/pages/PasswordRecovery";
const auth = vi.hoisted(() => ({ getSession: vi.fn(), resetPasswordForEmail: vi.fn(), updateUser: vi.fn(), listener: null as null | ((event: string, session: unknown) => void) }));
vi.mock("@/integrations/supabase/client", () => ({ supabase: { auth: { ...auth, onAuthStateChange: (callback: typeof auth.listener) => { auth.listener = callback; return { data: { subscription: { unsubscribe: vi.fn() } } }; } } } }));
vi.mock("react-i18next", () => ({ useTranslation: () => ({ t: (key: string) => key }) }));
afterEach(() => { cleanup(); vi.clearAllMocks(); });
function mount(session: unknown) {
  auth.getSession.mockResolvedValue({ data: { session } });
  render(<MemoryRouter><PasswordRecovery /></MemoryRouter>);
}
describe("Password recovery", () => {
  it("requests a link to the dedicated callback and shows an enumeration-safe response", async () => {
    auth.resetPasswordForEmail.mockResolvedValue({ error: null }); mount(null);
    fireEvent.change(await screen.findByLabelText("auth.email"), { target: { value: "test@example.invalid" } });
    fireEvent.click(screen.getByRole("button", { name: "recovery.send" }));
    await screen.findByText("recovery.sent");
    expect(auth.resetPasswordForEmail).toHaveBeenCalledWith("test@example.invalid", { redirectTo: `${window.location.origin}/reset-password` });
  });
  it("refuses mismatched passwords without calling the backend", async () => {
    mount({ user: { id: "fixture" } });
    fireEvent.change(await screen.findByLabelText("recovery.newPassword"), { target: { value: "new-test-password" } });
    fireEvent.change(screen.getByLabelText("recovery.confirm"), { target: { value: "different-password" } });
    fireEvent.click(screen.getByRole("button", { name: "recovery.save" }));
    expect(await screen.findByText("recovery.passwordRule")).toBeInTheDocument(); expect(auth.updateUser).not.toHaveBeenCalled();
  });
  it("updates a password using the authenticated recovery session", async () => {
    auth.updateUser.mockResolvedValue({ error: null }); mount({ user: { id: "fixture" } });
    fireEvent.change(await screen.findByLabelText("recovery.newPassword"), { target: { value: "new-test-password" } });
    fireEvent.change(screen.getByLabelText("recovery.confirm"), { target: { value: "new-test-password" } });
    fireEvent.click(screen.getByRole("button", { name: "recovery.save" }));
    expect(await screen.findByText("recovery.updated")).toBeInTheDocument(); expect(auth.updateUser).toHaveBeenCalledWith({ password: "new-test-password" });
  });
  it("leaves loading state when session lookup rejects", async () => {
    auth.getSession.mockRejectedValue(new Error("offline"));
    render(<MemoryRouter><PasswordRecovery /></MemoryRouter>);
    await waitFor(() => expect(screen.getByText("recovery.failed")).toBeInTheDocument());
    expect(screen.getByLabelText("auth.email")).toBeInTheDocument();
  });
  it("does not restore a stale recovery session after sign-out", async () => {
    let finish: (value: unknown) => void = () => {};
    auth.getSession.mockImplementation(() => new Promise(resolve => { finish = resolve; }));
    render(<MemoryRouter><PasswordRecovery /></MemoryRouter>);
    await act(async () => {
      auth.listener?.("SIGNED_OUT", null);
      finish({ data: { session: { user: { id: "old-user" } } } });
    });
    expect(screen.getByLabelText("auth.email")).toBeInTheDocument();
    expect(screen.queryByLabelText("recovery.newPassword")).not.toBeInTheDocument();
  });

});
