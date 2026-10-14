import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { signUpUser } from "./test-utils";

async function assertNoViolations(scan: { violations: any[] }, contextName: string) {
  if (scan.violations && scan.violations.length) {
    console.error(`A11y violations in [${contextName}]:`, JSON.stringify(scan.violations, null, 2));
  }
  expect(scan.violations, `Found a11y violations in ${contextName}`).toEqual([]);
}

test.describe("Phase 10: Comprehensive Accessibility Audit (WCAG 2.2 AA)", () => {
  const timestamp = Date.now();
  const testUser = {
    name: "A11y Tester",
    email: `a11y-${timestamp}@resumint.dev`,
    password: "Password123!",
  };

  test("passes WCAG AA accessibility checks on landing, about, privacy, and terms in light and dark modes", async ({
    page,
  }) => {
    const publicPages = [
      { path: "/", name: "Landing Page" },
      { path: "/about", name: "About Page" },
      { path: "/privacy", name: "Privacy Page" },
      { path: "/terms", name: "Terms Page" },
    ];

    for (const { path, name } of publicPages) {
      // Light Mode Check
      await page.emulateMedia({ colorScheme: "light" });
      await page.goto(path);
      await page.waitForLoadState("networkidle");
      await page.evaluate(() => {
        document.documentElement.classList.remove("dark");
      });
      await expect(page.locator("#main-content")).toBeVisible({ timeout: 10000 });

      const lightScan = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
        .include("body")
        .analyze();
      assertNoViolations(lightScan, `${name} (Light Mode)`);

      // Switch to Dark Mode
      await page.emulateMedia({ colorScheme: "dark" });
      await page.evaluate(() => {
        document.documentElement.classList.add("dark");
      });
      await page.waitForTimeout(150);

      const darkScan = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
        .include("body")
        .analyze();
      assertNoViolations(darkScan, `${name} (Dark Mode)`);

      // Reset
      await page.evaluate(() => {
        document.documentElement.classList.remove("dark");
      });
    }
  });

  test("passes WCAG AA checks on 404 error boundary page", async ({ page }) => {
    await page.goto("/definitely-nonexistent-route-for-404-test");
    await page.waitForLoadState("networkidle");
    await expect(page.getByRole("heading", { name: /404/i })).toBeVisible({ timeout: 10000 });

    const notFoundScan = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .include("body")
      .analyze();
    assertNoViolations(notFoundScan, "404 Not Found Page");
  });

  test("passes WCAG AA checks on editor tabs (Content, Design, Check) and dialogs", async ({
    page,
  }) => {
    await page.goto("/build");
    await page.waitForLoadState("networkidle");
    await expect(page.getByTestId("manual-save-button")).toBeVisible({ timeout: 10000 });

    // 1. Content Tab
    const contentScan = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .include("body")
      .analyze();
    assertNoViolations(contentScan, "Editor (Content Tab)");

    // 2. Design Tab
    const designTab = page.getByRole("tab", { name: /^Design/i });
    await designTab.click();
    await expect(page.getByRole("radio", { name: /Modern/i })).toBeVisible({ timeout: 5000 });

    const designScan = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .include("body")
      .analyze();
    assertNoViolations(designScan, "Editor (Design Tab)");

    // 3. Check Tab
    const checkTab = page.getByRole("tab", { name: /^Check/i });
    await checkTab.click();
    await expect(page.getByTestId("ats-checker-panel")).toBeVisible({ timeout: 5000 });

    const checkScan = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .include("body")
      .analyze();
    assertNoViolations(checkScan, "Editor (Check Tab)");
  });

  test("passes WCAG AA checks on authenticated /settings and delete dialog", async ({
    page,
  }) => {
    // Sign up
    await signUpUser(page, testUser);

    // Visit /settings
    await page.goto("/settings");
    await page.waitForLoadState("networkidle");
    await expect(page.getByRole("heading", { name: /Account Settings/i })).toBeVisible({ timeout: 10000 });

    const settingsScan = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .include("body")
      .analyze();
    assertNoViolations(settingsScan, "Settings Page");

    // Open Delete Account Dialog
    await page.getByTestId("open-delete-account-dialog-button").click();
    await expect(page.getByRole("dialog")).toBeVisible({ timeout: 5000 });

    const deleteDialogScan = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .include('[role="dialog"]')
      .analyze();
    assertNoViolations(deleteDialogScan, "Delete Account Dialog");
  });
});
