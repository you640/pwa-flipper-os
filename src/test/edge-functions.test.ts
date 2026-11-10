// @vitest-environment node
// Run actual handlers with isolated service stubs: never calls a live project or AI.
import { readFileSync } from "node:fs";
import ts from "typescript";
import { z } from "zod";
import { describe, expect, it, vi } from "vitest";
function load(name: string, client: unknown) {
  let handler: (req: Request) => Promise<Response>;
  const source = readFileSync(`supabase/functions/${name}/index.ts`, "utf8").replace(/^import .*;\n/gm, "");
  const js = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.None } }).outputText;
  new Function("createClient", "z", "Deno", js)(() => client, z, { env: { get: () => "test-only" }, serve: (fn: typeof handler) => { handler = fn; } });
  return (req: Request) => handler(req);
}
describe("Edge handlers without live services", () => {
  for (const name of ["valuate-pwa", "draft-outreach", "delete-account"]) {
    it(`${name} refuses GET`, async () => expect((await load(name, {}) (new Request("https://test.invalid"))).status).toBe(405));
    it(`${name} allows CORS preflight`, async () => expect((await load(name, {}) (new Request("https://test.invalid", { method: "OPTIONS" }))).status).toBe(200));
  }
  it("valuation rejects malformed JSON", async () => expect((await load("valuate-pwa", {})(new Request("https://test.invalid", { method: "POST", body: "{" }))).status).toBe(400));
  it("outreach refuses missing JWT", async () => expect((await load("draft-outreach", {})(new Request("https://test.invalid", { method: "POST", body: "{}" }))).status).toBe(401));
  it("deletion refuses invalid identity before any privileged operation", async () => {
    const deleteUser = vi.fn();
    const handler = load("delete-account", { auth: { getUser: async () => ({ data: {}, error: new Error("invalid") }), admin: { deleteUser } } });
    const res = await handler(new Request("https://test.invalid", { method: "POST", headers: { Authorization: "Bearer invalid" } }));
    expect(res.status).toBe(401); expect(deleteUser).not.toHaveBeenCalled();
  });
});

describe("valuation quota fails closed", () => {
  const body = { anonymous: true, name: "Test", github_url: "https://github.com/test/repo", mrr: 0, expenses: 0, niche: "B2B" };
  it("requires a gateway-owned IP header before any service call", async () => {
    const rpc = vi.fn();
    const res = await load("valuate-pwa", { rpc })(new Request("https://test.invalid", { method: "POST", body: JSON.stringify(body) }));
    expect(res.status).toBe(503); expect(rpc).not.toHaveBeenCalled();
  });
  it("rejects a spent reservation without fetching a repository or AI", async () => {
    const rpc = vi.fn().mockResolvedValue({ data: false, error: null });
    const res = await load("valuate-pwa", { rpc })(new Request("https://test.invalid", { method: "POST", headers: { "test-only": "192.0.2.1" }, body: JSON.stringify(body) }));
    expect(res.status).toBe(429); expect(await res.json()).toEqual({ error: "anon_limit" });
    expect(rpc).toHaveBeenCalledWith("reserve_ai_audit", expect.objectContaining({ _limit: 1 }));
  });
  it("hides quota storage errors", async () => {
    const rpc = vi.fn().mockResolvedValue({ data: null, error: new Error("private-db-detail") });
    const res = await load("valuate-pwa", { rpc })(new Request("https://test.invalid", { method: "POST", headers: { "test-only": "192.0.2.1" }, body: JSON.stringify(body) }));
    expect(res.status).toBe(500); expect(await res.json()).toEqual({ error: "internal_error" });
  });
});

describe("account deletion sequencing", () => {
  it("revokes sessions and cleans avatars before deleting identity", async () => {
    const events: string[] = [];
    const client = {
      auth: { getUser: async () => ({ data: { user: { id: "verified-user" } }, error: null }), admin: {
        signOut: async () => { events.push("revoke"); return { error: null }; },
        deleteUser: async (id: string) => { events.push(`delete:${id}`); return { error: null }; },
      } },
      storage: { from: () => ({ list: async (prefix: string) => { events.push(`list:${prefix}`); return { data: [{ id: "object", name: "avatar.png" }], error: null }; },
        remove: async (paths: string[]) => { events.push(`remove:${paths.join()}`); return { error: null }; } }) },
    };
    const res = await load("delete-account", client)(new Request("https://test.invalid", { method: "POST", headers: { Authorization: "Bearer test-token" } }));
    expect(res.status).toBe(200);
    expect(events).toEqual(["revoke", "list:verified-user", "remove:verified-user/avatar.png", "delete:verified-user"]);
  });
  it("keeps identity if session revocation fails", async () => {
    const deleteUser = vi.fn();
    const client = { auth: { getUser: async () => ({ data: { user: { id: "verified-user" } }, error: null }), admin: { signOut: async () => ({ error: new Error("fail") }), deleteUser } } };
    const res = await load("delete-account", client)(new Request("https://test.invalid", { method: "POST", headers: { Authorization: "Bearer test-token" } }));
    expect(res.status).toBe(500); expect(deleteUser).not.toHaveBeenCalled();
  });
});
