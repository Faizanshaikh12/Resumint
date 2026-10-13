import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test.describe("Dashboard & Resume Management E2E", () => {
  const timestamp = Date.now();
  const userA = {
    name: "User Alpha",
    email: `usera-${timestamp}@resumint.dev`,
    password: "Password123!",
  };
  const userB = {
    name: "User Beta",
    email: `userb-${timestamp}@resumint.dev`,
    password: "Password123!",
  };

  test("runs full resume lifecycle: signup -> blank resume -> sample resume -> rename -> duplicate -> search -> delete", async ({
    page,
  }) => {
    // 1. Sign up User Alpha with full networkidle hydration
    await page.goto("/signup");
    await page.waitForLoadState("networkidle");
    await expect(page.locator("#auth-name")).toBeVisible();

    await page.fill("#auth-name", userA.name);
    await page.fill("#auth-email", userA.email);
    await page.fill("#auth-password", userA.password);
    await page.click('button[type="submit"]');

    // 2. Lands on Dashboard with empty state
    await page.waitForURL("**/dashboard", { timeout: 15000 });
    await expect(page.getByRole("heading", { name: /my documents/i })).toBeVisible();
    await expect(page.getByTestId("dashboard-empty-state")).toBeVisible();

    // 3. Create blank resume
    await page.getByRole("button", { name: /create your first resume/i }).click();
    await page.waitForURL("**/resumes/new", { timeout: 10000 });
    await expect(page.getByRole("heading", { name: /create new resume/i })).toBeVisible();

    await page.getByRole("button", { name: /create blank resume/i }).click();

    // 4. Lands on protected editor placeholder
    await page.waitForURL(/\/resumes\/[a-zA-Z0-9_-]+\/edit/, { timeout: 15000 });
    await expect(page.getByRole("heading", { name: /editor arrives in phase 5/i })).toBeVisible();
    await expect(page.getByText("Untitled Resume")).toBeVisible();

    // 5. Navigate back to dashboard and verify card is visible
    await page.getByRole("button", { name: /back to dashboard/i }).click();
    await page.waitForURL("**/dashboard", { timeout: 10000 });

    const card = page.getByTestId("resume-card");
    await expect(card).toBeVisible();
    await expect(card.getByText("Untitled Resume")).toBeVisible();

    // 6. Create second resume from sample
    await page.getByRole("button", { name: /new resume/i }).click();
    await page.waitForURL("**/resumes/new", { timeout: 10000 });

    await page.getByRole("button", { name: /start with software engineer/i }).click();
    await page.waitForURL(/\/resumes\/[a-zA-Z0-9_-]+\/edit/, { timeout: 15000 });
    await expect(page.getByRole("heading", { name: /software engineer/i })).toBeVisible();

    // Return to dashboard
    await page.getByRole("button", { name: /back to dashboard/i }).click();
    await page.waitForURL("**/dashboard", { timeout: 10000 });

    const cards = page.getByTestId("resume-card");
    await expect(cards).toHaveCount(2);

    // 7. Rename the Untitled Resume
    const firstCard = cards.filter({ hasText: "Untitled Resume" });
    await firstCard.getByRole("button", { name: /actions for untitled resume/i }).click();
    await page.getByText(/^rename$/i).click();

    await expect(page.getByRole("heading", { name: /rename resume/i })).toBeVisible();
    const renameInput = page.locator("#resume-rename-input");
    await renameInput.fill("Principal Cloud Architect");
    await page.getByRole("button", { name: /save title/i }).click();

    await expect(page.getByText(/resume renamed/i)).toBeVisible();
    await expect(page.getByText("Principal Cloud Architect")).toBeVisible();

    // 8. Duplicate the resume
    const architectCard = page.getByTestId("resume-card").filter({ hasText: "Principal Cloud Architect" });
    await architectCard.getByRole("button", { name: /actions for principal cloud architect/i }).click();
    await page.getByText(/duplicate/i).click();

    await expect(page.getByText(/resume duplicated/i)).toBeVisible();
    await expect(page.getByText("Principal Cloud Architect (Copy)")).toBeVisible();
    await expect(page.getByTestId("resume-card")).toHaveCount(3);

    // 9. Search filtering
    const searchInput = page.locator("#dashboard-search-input");
    await searchInput.fill("Principal");
    // Wait for debounced sync
    await page.waitForURL(/q=Principal/, { timeout: 5000 });
    await expect(page.getByTestId("resume-card")).toHaveCount(2);

    // Clear search
    await page.getByRole("button", { name: /clear search/i }).click();
    await page.waitForURL((url) => !url.searchParams.has("q"), { timeout: 5000 });
    await expect(page.getByTestId("resume-card")).toHaveCount(3);

    // 10. Delete a resume with confirmation dialog
    const copyCard = page.getByTestId("resume-card").filter({ hasText: "Principal Cloud Architect (Copy)" });
    await copyCard.getByRole("button", { name: /actions for principal cloud architect \(copy\)/i }).click();
    await page.getByText(/^delete$/i).click();

    await expect(page.getByRole("heading", { name: /delete “Principal Cloud Architect \(Copy\)”\?/i })).toBeVisible();
    await page.getByRole("button", { name: /^delete resume$/i }).click();

    await expect(page.getByText(/resume deleted/i)).toBeVisible();
    await expect(page.getByTestId("resume-card")).toHaveCount(2);
  });

  test("isolates authorization: user B receives 404 attempting to open user A's resume", async ({
    browser,
  }) => {
    // Context 1: User A creates a resume
    const contextA = await browser.newContext();
    const pageA = await contextA.newPage();

    await pageA.goto("/signup");
    await pageA.waitForLoadState("networkidle");
    await expect(pageA.locator("#auth-name")).toBeVisible();

    await pageA.fill("#auth-name", userA.name);
    await pageA.fill("#auth-email", `isolate-a-${timestamp}@resumint.dev`);
    await pageA.fill("#auth-password", userA.password);
    await pageA.click('button[type="submit"]');

    await pageA.waitForURL("**/dashboard", { timeout: 15000 });
    await pageA.getByRole("button", { name: /create your first resume/i }).click();
    await pageA.waitForURL("**/resumes/new", { timeout: 10000 });
    await pageA.getByRole("button", { name: /create blank resume/i }).click();

    await pageA.waitForURL(/\/resumes\/([a-zA-Z0-9_-]+)\/edit/, { timeout: 15000 });
    const userAEditUrl = pageA.url();

    // Context 2: User B signs up and attempts to open User A's edit URL directly
    const contextB = await browser.newContext();
    const pageB = await contextB.newPage();

    await pageB.goto("/signup");
    await pageB.waitForLoadState("networkidle");
    await expect(pageB.locator("#auth-name")).toBeVisible();

    await pageB.fill("#auth-name", userB.name);
    await pageB.fill("#auth-email", userB.email);
    await pageB.fill("#auth-password", userB.password);
    await pageB.click('button[type="submit"]');

    await pageB.waitForURL("**/dashboard", { timeout: 15000 });

    // User B attempts to open User A's resume URL
    await pageB.goto(userAEditUrl);

    // Expect friendly 404 page (never 403 or data leak)
    await expect(pageB.getByRole("heading", { name: /resume not found/i })).toBeVisible();
    await expect(
      pageB.getByText(/does not exist or you do not have permission to access it/i)
    ).toBeVisible();

    await contextA.close();
    await contextB.close();
  });

  test("passes WCAG 2.1 AA accessibility checks on dashboard, /resumes/new, and delete dialog", async ({
    page,
  }) => {
    // Sign up a clean user
    await page.goto("/signup");
    await page.waitForLoadState("networkidle");
    await expect(page.locator("#auth-name")).toBeVisible();

    await page.fill("#auth-name", "A11y Auditor");
    await page.fill("#auth-email", `a11y-${timestamp}@resumint.dev`);
    await page.fill("#auth-password", "Password123!");
    await page.click('button[type="submit"]');

    // 1. Dashboard empty state accessibility scan
    await page.waitForURL("**/dashboard", { timeout: 15000 });
    const emptyScan = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa"])
      .analyze();
    expect(emptyScan.violations).toEqual([]);

    // 2. Create a resume to populate dashboard
    await page.getByRole("button", { name: /create your first resume/i }).click();
    await page.waitForURL("**/resumes/new", { timeout: 10000 });

    // Scans /resumes/new page
    const newResumeScan = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa"])
      .analyze();
    expect(newResumeScan.violations).toEqual([]);

    await page.getByRole("button", { name: /create blank resume/i }).click();
    await page.waitForURL(/\/resumes\/[a-zA-Z0-9_-]+\/edit/, { timeout: 15000 });
    await page.getByRole("button", { name: /back to dashboard/i }).click();
    await page.waitForURL("**/dashboard", { timeout: 10000 });

    // 3. Populated Dashboard accessibility scan
    const populatedScan = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa"])
      .analyze();
    expect(populatedScan.violations).toEqual([]);

    // 4. Open delete dialog and scan
    const card = page.getByTestId("resume-card").first();
    await card.getByRole("button", { name: /actions for/i }).click();
    await page.getByText(/^delete$/i).click();

    await expect(page.getByRole("heading", { name: /delete “/i })).toBeVisible();
    const dialogScan = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa"])
      .analyze();
    expect(dialogScan.violations).toEqual([]);
  });
});
