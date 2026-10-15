import { expect, type Page } from "@playwright/test";

/**
 * Robust sign up and navigation helper that waits explicitly for
 * URL transition and ensures dashboard is ready.
 */
export async function signUpUser(
  page: Page,
  user: { name: string; email: string; password: string }
) {
  await page.goto("/signup");
  await page.waitForLoadState("networkidle");
  await expect(page.getByLabel(/Full Name/i)).toBeVisible({ timeout: 15000 });
  await page.getByLabel(/Full Name/i).fill(user.name);
  await expect(page.getByLabel(/Email Address/i)).toBeVisible({ timeout: 10000 });
  await page.getByLabel(/Email Address/i).fill(user.email);
  await expect(page.getByLabel(/^Password/i)).toBeVisible({ timeout: 10000 });
  await page.getByLabel(/^Password/i).fill(user.password);

  await Promise.all([
    page.waitForURL("**/dashboard", { timeout: 30000 }),
    page.click('button[type="submit"]'),
  ]);
  await page.waitForLoadState("networkidle");
}

/**
 * Resilient helper to open a new blank resume from dashboard or anywhere.
 * Handles slow network, race conditions between empty state and header buttons,
 * and ensures editor is fully mounted and ready before returning.
 */
export async function openNewBlankResume(page: Page) {
  // If not already on dashboard or /resumes/new, wait for or go to dashboard
  if (!page.url().includes("/dashboard") && !page.url().includes("/resumes/new")) {
    await page.waitForURL("**/dashboard", { timeout: 30000 });
  }

  if (!page.url().includes("/resumes/new")) {
    const createFirstBtn = page.locator("[data-testid='create-first-resume-button']");
    const roleCreateBtn = page.getByRole("button", { name: /create (your first )?resume/i });
    const headerNewBtn = page.getByRole("button", { name: /new resume|create resume|create/i });

    // Wait up to 20s for any of these states or the resume grid to appear
    await Promise.race([
      createFirstBtn.waitFor({ state: "visible", timeout: 20000 }).catch(() => null),
      roleCreateBtn.waitFor({ state: "visible", timeout: 20000 }).catch(() => null),
      headerNewBtn.waitFor({ state: "visible", timeout: 20000 }).catch(() => null),
      page.waitForSelector('[data-testid="resume-card"]', { state: "visible", timeout: 20000 }).catch(() => null),
    ]);

    if (await createFirstBtn.isVisible().catch(() => false)) {
      await createFirstBtn.click();
    } else if (await headerNewBtn.isVisible().catch(() => false)) {
      await headerNewBtn.click();
    } else if (await roleCreateBtn.isVisible().catch(() => false)) {
      await roleCreateBtn.click();
    } else {
      const anyCreate = page.locator("button", { hasText: /create|new/i }).first();
      await anyCreate.click();
    }

    await page.waitForURL("**/resumes/new", { timeout: 30000 });
  }

  // On /resumes/new page, select blank resume
  const createBlankBtn = page.getByRole("button", { name: /create blank resume/i });
  await expect(createBlankBtn).toBeVisible({ timeout: 20000 });
  await createBlankBtn.click();

  // Wait for editor navigation and readiness
  await page.waitForURL(/\/resumes\/[a-zA-Z0-9_-]+\/edit/, { timeout: 30000 });
  await expect(page.getByTestId("manual-save-button")).toBeVisible({ timeout: 20000 });
}
