import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
const ownerId = "a2c92111-c2a3-4ab2-91dc-3d1abc84cc33";
const mocks = vi.hoisted(() => ({ getUser: vi.fn(), getClaims:vi.fn(), signInWithPassword: vi.fn(), signOut: vi.fn(), configured: true }));
vi.mock("server-only", () => ({}));
vi.mock("next/navigation", () => ({ redirect: (url: string) => { throw new Error(`redirect:${url}`); } }));
vi.mock("@/lib/env", () => ({ getAuthConfig: () => mocks.configured ? {} : null }));
vi.mock("@/lib/supabase/server", () => ({ createAuthClient: async () => ({ auth: mocks }) }));
import { requireCustomer,withCustomerRequest } from "../../src/features/auth/server";
import { signIn, signOut } from "../../src/features/auth/actions";

beforeEach(() => {
  vi.resetAllMocks();
  mocks.configured = true;
  vi.stubEnv('PLUTO_REQUIRE_MFA','false');
  vi.stubEnv("PLUTO_OWNER_ID", ownerId);
  mocks.signOut.mockResolvedValue({ error: null });
});
afterEach(() => vi.unstubAllEnvs());
describe("server owner boundary", () => {
  it('requires AAL2 for verified factors and for mandatory enrollment, failing closed on claim errors',async()=>{mocks.getUser.mockResolvedValue({data:{user:{id:ownerId,email_confirmed_at:"2026-01-01T00:00:00Z",factors:[{id:'factor',status:'verified'}]}},error:null});mocks.getClaims.mockResolvedValue({data:{claims:{sub:ownerId,aal:'aal1'}},error:null});await expect(requireCustomer()).rejects.toThrow('redirect:/mfa');mocks.getClaims.mockResolvedValue({data:{claims:{sub:ownerId,aal:'aal2'}},error:null});expect((await requireCustomer()).id).toBe(ownerId);mocks.getClaims.mockResolvedValue({data:null,error:{code:'invalid'}});await expect(requireCustomer()).rejects.toThrow('redirect:/mfa');mocks.getUser.mockResolvedValue({data:{user:{id:ownerId,email_confirmed_at:"2026-01-01T00:00:00Z"}},error:null});vi.stubEnv('PLUTO_REQUIRE_MFA','true');await expect(requireCustomer()).rejects.toThrow('redirect:/mfa');});
  it('shares verification only inside an explicitly verified request and rechecks the next request',async()=>{
    mocks.getUser.mockResolvedValue({data:{user:{id:ownerId,email_confirmed_at:"2026-01-01T00:00:00Z"}},error:null});await withCustomerRequest(async()=>{expect((await requireCustomer()).id).toBe(ownerId);expect((await requireCustomer()).id).toBe(ownerId)});expect(mocks.getUser).toHaveBeenCalledTimes(1);mocks.getUser.mockResolvedValue({data:{user:null},error:{code:'revoked'}});await expect(withCustomerRequest(async()=>requireCustomer())).rejects.toThrow('unauthorized');expect(mocks.getUser).toHaveBeenCalledTimes(2);
  });
  it("does not call Supabase without complete configuration", async () => {
    mocks.configured = false;
    await expect(requireCustomer()).rejects.toThrow("redirect:/login?status=configuration");
    expect(mocks.getUser).not.toHaveBeenCalled();
  });
  it("accepts an owner returned by the verified Supabase getUser call", async () => {
    mocks.getUser.mockResolvedValue({ data: { user: { id: ownerId,email_confirmed_at:"2026-01-01T00:00:00Z" } }, error: null });
    expect((await requireCustomer()).id).toBe(ownerId);
  });
  it.each([
    { data: { user: null }, error: null },
    { data: { user: { id: "b2c92111-c2a3-4ab2-91dc-3d1abc84cc33" } }, error: null },
    { data: { user: { id: ownerId,email_confirmed_at:"2026-01-01T00:00:00Z" } }, error: { code: "session_not_found" } },
    { data: { user: null }, error: { code: "bad_jwt" } }
  ])("rejects absent, unverified, revoked and invalid sessions", async result => {
    mocks.getUser.mockResolvedValue(result);
    await expect(requireCustomer()).rejects.toThrow("redirect:/login?status=unauthorized");
  });
});
describe("password actions", () => {
  const form = () => { const input = new FormData(); input.set("email", "synthetic@example.invalid"); input.set("password", "Synthetic test input only"); return input; };
  it("rejects malformed form data before contacting auth", async () => {
    await expect(signIn(new FormData())).rejects.toThrow("redirect:/login?status=invalid");
    expect(mocks.signInWithPassword).not.toHaveBeenCalled();
  });
  it("clears sessions for successful authentication as an unapproved user", async () => {
    mocks.signInWithPassword.mockResolvedValue({ data: { user: { id: "b2c92111-c2a3-4ab2-91dc-3d1abc84cc33" } }, error: null });
    await expect(signIn(form())).rejects.toThrow("redirect:/login?status=invalid");
    expect(mocks.signOut).toHaveBeenCalledOnce();
  });
  it("uses a generic response for wrong passwords", async () => {
    mocks.signInWithPassword.mockResolvedValue({ data: { user: null }, error: { code: "invalid_credentials" } });
    await expect(signIn(form())).rejects.toThrow("redirect:/login?status=invalid");
  });
  it("redirects the approved owner to the dashboard", async () => {
    mocks.signInWithPassword.mockResolvedValue({ data: { user: { id: ownerId,email_confirmed_at:"2026-01-01T00:00:00Z" } }, error: null });
    await expect(signIn(form())).rejects.toThrow("redirect:/");
    expect(mocks.signOut).not.toHaveBeenCalled();
  });
  it("does not report sign-out success when Supabase rejects it", async () => {
    mocks.signOut.mockResolvedValue({ error: { code: "unexpected_failure" } });
    await expect(signOut()).rejects.toThrow("Sign out failed");
  });
});

it('accepts a second independent verified customer',async()=>{mocks.getUser.mockResolvedValue({data:{user:{id:'b2c92111-c2a3-4ab2-91dc-3d1abc84cc33',email_confirmed_at:'2026-01-01T00:00:00Z'}},error:null});expect((await requireCustomer()).id).toBe('b2c92111-c2a3-4ab2-91dc-3d1abc84cc33')});
