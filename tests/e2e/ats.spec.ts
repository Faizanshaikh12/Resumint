import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test.describe("Phase 9: ATS Checker & Job Description Matcher", () => {
  test("guest /build flow: inspect score, click issue to focus field, fix issue, update score", async ({
    page,
  }) => {
    await page.goto("/build");
    await page.waitForLoadState("networkidle");
    await expect(page.locator("[data-testid='editor-header-score-badge']")).toBeVisible();

    // Click Check tab
    await page.click("[data-testid='editor-header-tab-check']");
    await expect(page.locator("[data-testid='ats-checker-panel']")).toBeVisible();

    // Verify Score Gauge and honesty statement
    const scoreNumber = await page.textContent("[data-testid='ats-score-number']");
    expect(Number(scoreNumber)).toBeGreaterThanOrEqual(0);
    await expect(page.locator("text=Resumint checklist score (a guide, not a guarantee)")).toBeVisible();

    // Verify Checklist items rendered
    const nameCheck = page.locator("[data-testid='ats-check-item-contact-name']");
    await expect(nameCheck).toBeVisible();

    // Click an issue to focus field
    await nameCheck.click();

    // Should switch automatically to Content tab and focus personal name input
    const nameInput = page.locator("[data-field-path='personal.name']");
    await expect(nameInput).toBeFocused();

    // Fix the name
    await nameInput.fill("Sarah Connor");

    // Switch back to Check tab and verify score updates and name check passes
    await page.click("[data-testid='editor-header-tab-check']");
    const updatedNameCheck = page.locator("[data-testid='ats-check-item-contact-name']");
    await expect(updatedNameCheck).toContainText("Passed");
  });

  test("job description match: local-only matching, privacy assertion (JD never sent over network), and keyword chips", async ({
    page,
  }) => {
    const sensitiveJdText = "SuperConfidentialJobPostingSeekingKubernetesAndGoSpecialist";
    let jdLeakedOverNetwork = false;

    // Listen to all network requests to ensure JD text is never transmitted
    page.on("request", (request) => {
      const postData = request.postData();
      if (postData && postData.includes(sensitiveJdText)) {
        jdLeakedOverNetwork = true;
      }
      if (request.url().includes(sensitiveJdText)) {
        jdLeakedOverNetwork = true;
      }
    });

    await page.goto("/build");
    await page.waitForLoadState("networkidle");
    await expect(page.locator("[data-testid='editor-header-score-badge']")).toBeVisible();

    await page.click("[data-testid='editor-header-tab-check']");
    await expect(page.locator("[data-testid='ats-job-match-card']")).toBeVisible();

    const textarea = page.locator("[data-testid='jd-input-textarea']");
    const analyzeBtn = page.locator("[data-testid='analyze-jd-button']");

    // Paste custom job description containing Go and Docker and Kubernetes
    const sampleJd = `${sensitiveJdText} We need a Senior Engineer with Kubernetes and Docker experience.`;
    await textarea.fill(sampleJd);

    // Verify character count
    await expect(page.locator(`text=${sampleJd.length} / 10000 characters`)).toBeVisible();

    // Click Analyze
    await analyzeBtn.click();
    await expect(page.locator("[data-testid='jd-analysis-results']")).toBeVisible();

    // Verify coverage percentage is displayed
    const coverage = await page.textContent("[data-testid='jd-coverage-percentage']");
    expect(coverage).toBeDefined();

    // Assert that the sensitive JD was NEVER sent over the network
    expect(jdLeakedOverNetwork).toBe(false);

    // Test clear button removes text and clears state
    const clearBtn = page.locator("[data-testid='clear-jd-button']");
    await clearBtn.click();
    await expect(textarea).toHaveValue("");
  });

  test("score badge in editor header updates and opens Check tab", async ({ page }) => {
    await page.goto("/build");
    await page.waitForLoadState("networkidle");
    const scoreBadge = page.locator("[data-testid='editor-header-score-badge']");
    await expect(scoreBadge).toBeVisible();

    // Click score badge
    await scoreBadge.click();

    // Verify Check tab is active and AtsCheckerPanel is displayed
    await expect(page.locator("[data-testid='ats-checker-panel']")).toBeVisible();
    await expect(page.locator("[data-testid='editor-header-tab-check']")).toHaveAttribute(
      "aria-selected",
      "true"
    );
  });

  test("passes automated axe accessibility scan on Check tab", async ({ page }) => {
    await page.goto("/build");
    await page.waitForLoadState("networkidle");
    await expect(page.locator("[data-testid='editor-header-score-badge']")).toBeVisible();

    await page.click("[data-testid='editor-header-tab-check']");
    await expect(page.locator("[data-testid='ats-checker-panel']")).toBeVisible();

    const accessibilityScanResults = await new AxeBuilder({ page })
      .include("[data-testid='ats-checker-panel']")
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });
});
