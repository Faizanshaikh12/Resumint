import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { signUpUser } from "./test-utils";
import { goToDashboardViaNav } from "./helpers/navigation";

function assertNoViolations(scan: { violations: any[] }) {
  if (scan.violations && scan.violations.length) {
    console.error("A11y violations:", JSON.stringify(scan.violations, null, 2));
  }
  expect(scan.violations).toEqual([]);
}

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
    await signUpUser(page, userA);

    // 2. Lands on Dashboard with empty state
    await page.waitForURL("**/dashboard", { timeout: 30000 });
    await expect(page.getByRole("heading", { name: /my documents/i })).toBeVisible({ timeout: 20000 });
    await expect(page.getByTestId("dashboard-empty-state")).toBeVisible({ timeout: 20000 });

    // 3. Create blank resume
    const createFirstBtn = page.locator("[data-testid='create-first-resume-button']");
    await expect(createFirstBtn).toBeVisible({ timeout: 20000 });
    await createFirstBtn.click();
    await page.waitForURL("**/resumes/new", { timeout: 10000 });
    await expect(page.getByRole("heading", { name: /create new resume/i })).toBeVisible();

    await page.getByRole("button", { name: /create blank resume/i }).click();

    // 4. Lands on protected editor
    await page.waitForURL(/\/resumes\/[a-zA-Z0-9_-]+\/edit/, { timeout: 15000 });
    await expect(page.getByTestId("manual-save-button")).toBeVisible();
    await expect(page.getByText("Untitled Resume")).toBeVisible();

    // 5. Navigate back to dashboard and verify card is visible
    await goToDashboardViaNav(page);

    const card = page.getByTestId("resume-card");
    await expect(card).toBeVisible();
    await expect(card.getByText("Untitled Resume")).toBeVisible();

    // 6. Create second resume from sample (scoped to main content to avoid header button ambiguity)
    await page.locator("#main-content").getByRole("button", { name: /new resume/i }).click();
    await page.waitForURL("**/resumes/new", { timeout: 10000 });

    await page.getByRole("button", { name: /start with software engineer/i }).click();
    await page.waitForURL(/\/resumes\/[a-zA-Z0-9_-]+\/edit/, { timeout: 15000 });
    await expect(page.getByTestId("manual-save-button")).toBeVisible();
    await expect(page.getByText("Alex Morgan")).toBeVisible();

    // Return to dashboard
    await goToDashboardViaNav(page);

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

    await signUpUser(pageA, {
      name: userA.name,
      email: `isolate-a-${timestamp}@resumint.dev`,
      password: userA.password,
    });

    const createFirstBtnA = pageA.locator("[data-testid='create-first-resume-button']");
    await expect(createFirstBtnA).toBeVisible({ timeout: 20000 });
    await createFirstBtnA.click();
    await pageA.waitForURL("**/resumes/new", { timeout: 30000 });
    await pageA.getByRole("button", { name: /create blank resume/i }).click();

    await pageA.waitForURL(/\/resumes\/([a-zA-Z0-9_-]+)\/edit/, { timeout: 15000 });
    const userAEditUrl = pageA.url();

    // Context 2: User B signs up and attempts to open User A's edit URL directly
    const contextB = await browser.newContext();
    const pageB = await contextB.newPage();

    await signUpUser(pageB, userB);

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
    await signUpUser(page, {
      name: "A11y Auditor",
      email: `a11y-${timestamp}@resumint.dev`,
      password: "Password123!",
    });

    // 1. Dashboard empty state accessibility scan
    await page.waitForURL("**/dashboard", { timeout: 30000 });
    await expect(page.locator('[data-testid="dashboard-main"]')).toBeVisible({ timeout: 20000 });
    const emptyScan = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa"])
      .include("#main-content")
      .analyze();
    assertNoViolations(emptyScan);

    // 2. Create a resume to populate dashboard
    const createFirstBtn = page.locator("[data-testid='create-first-resume-button']");
    await expect(createFirstBtn).toBeVisible({ timeout: 20000 });
    await createFirstBtn.click();
    await page.waitForURL("**/resumes/new", { timeout: 10000 });
    await expect(page.getByRole("heading", { name: /create new resume/i })).toBeVisible({ timeout: 10000 });

    // Scans /resumes/new page
    const newResumeScan = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa"])
      .include("#main-content")
      .analyze();
    assertNoViolations(newResumeScan);

    await page.getByRole("button", { name: /create blank resume/i }).click();
    await page.waitForURL(/\/resumes\/[a-zA-Z0-9_-]+\/edit/, { timeout: 15000 });
    await goToDashboardViaNav(page);

    // 3. Populated Dashboard accessibility scan
    await expect(page.getByTestId("resume-card").first()).toBeVisible({ timeout: 10000 });
    const populatedScan = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa"])
      .include("#main-content")
      .analyze();
    assertNoViolations(populatedScan);

    // 4. Open delete dialog and scan
    const card = page.getByTestId("resume-card").first();
    await card.getByRole("button", { name: /actions for/i }).click();
    await page.getByText(/^delete$/i).click();

    await expect(page.getByRole("dialog")).toBeVisible({ timeout: 5000 });
    const dialogScan = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa"])
      .include('[role="dialog"]')
      .analyze();
    assertNoViolations(dialogScan);
  });
});
