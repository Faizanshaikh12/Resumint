import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

async function assertNoViolations(scan: { violations: any[] }) {
  if (scan.violations && scan.violations.length) {
    console.error("A11y violations:", JSON.stringify(scan.violations, null, 2));
  }
  expect(scan.violations).toEqual([]);
}

test.describe("Authentication Flows & Route Guards", () => {
  const testUser = {
    name: "Playwright User",
    email: `pw-${Date.now()}@resumint.dev`,
    password: "Password123!",
  };

  test("completes full signup -> dashboard -> logout -> login cycle", async ({ page }) => {
    // 1. Visit signup page
    await page.goto("/signup");
    await expect(page).toHaveTitle(/Resumint/i);
    await expect(page.getByRole("heading", { name: /create an account/i })).toBeVisible();
    await page.waitForLoadState("networkidle");

    // 2. Fill in signup details
    await expect(page.locator("#auth-name")).toBeVisible({ timeout: 10000 });
    await page.fill("#auth-name", testUser.name);
    await expect(page.locator("#auth-email")).toBeVisible({ timeout: 5000 });
    await page.fill("#auth-email", testUser.email);
    await expect(page.locator("#auth-password")).toBeVisible({ timeout: 5000 });
    await page.fill("#auth-password", testUser.password);
    await Promise.all([
      page.waitForURL("**/dashboard", { timeout: 30000 }),
      page.click('button[type="submit"]'),
    ]);
    await page.waitForLoadState("networkidle");

    // 3. Lands on /dashboard
    await expect(page.getByRole("heading", { name: new RegExp(`Hello, ${testUser.name}!`, "i") })).toBeVisible({ timeout: 20000 });
    await expect(page.getByText(testUser.email, { exact: true })).toBeVisible({ timeout: 20000 });

    // 4. Logout
    await page.getByRole("button", { name: /sign out/i }).click();

    // 5. Lands on /login
    await page.waitForURL("**/login", { timeout: 10000 });
    await expect(page.getByRole("heading", { name: /welcome back/i })).toBeVisible();
    await page.waitForLoadState("networkidle");

    // 6. Login again
    await expect(page.locator("#auth-email")).toBeVisible({ timeout: 10000 });
    await page.fill("#auth-email", testUser.email);
    await expect(page.locator("#auth-password")).toBeVisible({ timeout: 5000 });
    await page.fill("#auth-password", testUser.password);
    await Promise.all([
      page.waitForURL("**/dashboard", { timeout: 30000 }),
      page.click('button[type="submit"]'),
    ]);
    await page.waitForLoadState("networkidle");

    // 7. Returns to /dashboard
    await expect(page.getByRole("heading", { name: new RegExp(`Hello, ${testUser.name}!`, "i") })).toBeVisible({ timeout: 20000 });
  });

  test("redirects unauthenticated users trying to access /dashboard and returns them after login", async ({
    page,
  }) => {
    // Visit protected dashboard directly
    await page.goto("/dashboard");

    // Automatically redirected to /login?redirectTo=%2Fdashboard
    await page.waitForURL((url) => url.pathname === "/login" && url.searchParams.has("redirectTo"), {
      timeout: 10000,
    });
    expect(page.url()).toContain("redirectTo=%2Fdashboard");

    // Create a new user for this isolated test
    const user = {
      name: "Redirect Tester",
      email: `redirect-${Date.now()}@resumint.dev`,
      password: "Password123!",
    };

    // Click link to sign up inside the main auth card
    await page.locator("main").getByRole("link", { name: /sign up/i }).click();
    await page.waitForURL("**/signup?redirectTo=%2Fdashboard", { timeout: 10000 });

    await expect(page.locator("#auth-name")).toBeVisible({ timeout: 10000 });
    await page.fill("#auth-name", user.name);
    await expect(page.locator("#auth-email")).toBeVisible({ timeout: 5000 });
    await page.fill("#auth-email", user.email);
    await expect(page.locator("#auth-password")).toBeVisible({ timeout: 5000 });
    await page.fill("#auth-password", user.password);
    await Promise.all([
      page.waitForURL("**/dashboard", { timeout: 30000 }),
      page.click('button[type="submit"]'),
    ]);
    await page.waitForLoadState("networkidle");

    // Lands back on /dashboard
    await expect(page.getByRole("heading", { name: new RegExp(`Hello, ${user.name}!`, "i") })).toBeVisible({ timeout: 20000 });
  });

  test("passes axe accessibility standards on /login and /signup", async ({ page }) => {
    // Login page a11y check
    await page.goto("/login");
    await page.waitForLoadState("networkidle");
    await expect(page.locator("#auth-email")).toBeVisible({ timeout: 10000 });
    const loginScan = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa"])
      .include("#main-content")
      .analyze();
    assertNoViolations(loginScan);

    // Signup page a11y check
    await page.goto("/signup");
    await page.waitForLoadState("networkidle");
    await expect(page.locator("#auth-name")).toBeVisible({ timeout: 10000 });
    const signupScan = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa"])
      .include("#main-content")
      .analyze();
    assertNoViolations(signupScan);
  });
});
