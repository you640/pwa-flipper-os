import { expect, test } from "@playwright/test";

test.beforeEach(async ({ context }) => {
  // Allow only the local build. Every backend interaction must be stubbed explicitly.
  await context.route("**/*", async route => {
    if (new URL(route.request().url()).origin === "http://127.0.0.1:4175") {
      await route.continue();
    } else {
      await route.abort();
    }
  });
});

test("anonymous visitor is redirected from admin to login", async ({ page }) => {
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.locator("#email")).toBeVisible();
});

test("signup deep link selects the registration tab", async ({ page }) => {
  await page.goto("/login?signup=1");
  await expect(page.getByRole("tab", { name: /sign up/i })).toHaveAttribute("aria-selected", "true");
});

test("invalid credentials keep the visitor on login and surface the error", async ({ page }) => {
  await page.route("https://flipper-e2e.invalid/auth/v1/token?grant_type=password", route =>
    route.fulfill({
      status: 400,
      json: { code: "invalid_credentials", message: "Invalid login credentials" },
    }),
  );
  await page.goto("/login");
  await page.locator("#email").fill("tester@example.invalid");
  await page.locator("#password").fill("synthetic-password");
  await page.getByRole("button", { name: "Sign In", exact: true }).click();
  await expect(page.getByText("Invalid login credentials")).toBeVisible();
  await expect(page).toHaveURL(/\/login$/);
});

test("password recovery requests a callback on the same frontend", async ({ page }) => {
  await page.route("https://flipper-e2e.invalid/auth/v1/recover?**", route =>
    route.fulfill({ json: {} }),
  );
  await page.goto("/reset-password");
  await page.locator("#recovery-email").fill("tester@example.invalid");
  const [request] = await Promise.all([
    page.waitForRequest(req => req.url().startsWith("https://flipper-e2e.invalid/auth/v1/recover") && req.method() === "POST"),
    page.getByRole("button", { name: "Send recovery link" }).click(),
  ]);
  expect(new URL(request.url()).searchParams.get("redirect_to")).toBe("http://127.0.0.1:4175/reset-password");
  expect(request.postDataJSON()).toMatchObject({ email: "tester@example.invalid" });
  await expect(page.getByText(/a recovery link will arrive shortly/)).toBeVisible();
});
