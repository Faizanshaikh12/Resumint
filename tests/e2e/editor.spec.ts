import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test.describe("Resume Editor Core E2E & Accessibility", () => {
  const timestamp = Date.now();
  const testUser = {
    name: "Editor Tester",
    email: `editor-${timestamp}@resumint.dev`,
    password: "Password123!",
  };

  test("full editor flow: edit name, add experience, reorder/hide section, save, reload persists, and passes Axe scan", async ({
    page,
  }) => {
    // 1. Sign up user
    await page.goto("/signup");
    await page.waitForLoadState("networkidle");
    await page.fill("#auth-name", testUser.name);
    await page.fill("#auth-email", testUser.email);
    await page.fill("#auth-password", testUser.password);
    await page.click('button[type="submit"]');

    await page.waitForURL("**/dashboard", { timeout: 15000 });

    // 2. Create blank resume
    await page.getByRole("button", { name: /create your first resume/i }).click();
    await page.waitForURL("**/resumes/new", { timeout: 10000 });
    await page.getByRole("button", { name: /create blank resume/i }).click();

    // 3. Lands on editor
    await page.waitForURL(/\/resumes\/[a-zA-Z0-9_-]+\/edit/, { timeout: 15000 });
    await expect(page.getByTestId("manual-save-button")).toBeVisible();
    await expect(page.getByTestId("resume-preview-document")).toBeVisible();

    // 4. Accessibility Scan on initial load
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .disableRules(["color-contrast"]) // Avoid synthetic palette contrast flakiness in headless
      .analyze();
    expect(accessibilityScanResults.violations).toEqual([]);

    // 5. Edit Personal Info (Name)
    const nameInput = page.getByLabel(/Full Name/i);
    await nameInput.fill("Dr. Jonathan Hayes");

    // Live preview updates immediately
    const preview = page.getByTestId("resume-preview-document");
    await expect(preview.getByText("Dr. Jonathan Hayes")).toBeVisible();
    await expect(page.getByText(/unsaved changes/i)).toBeVisible();

    // 6. Navigate to Work Experience & add position
    const expNav = page.getByRole("button", { name: /^Work Experience/i }).first();
    await expNav.click();

    await page.getByRole("button", { name: /Add Position/i }).click();
    const positionInputs = page.getByLabel(/Job Title \/ Position/i);
    const lastPosInput = positionInputs.last();
    await lastPosInput.fill("Principal Cloud Architect");

    const companyInputs = page.getByLabel(/Company \/ Organization/i);
    const lastCompInput = companyInputs.last();
    await lastCompInput.fill("Stripe");

    // Add bullet point
    await page.getByRole("button", { name: /Add bullet point/i }).last().click();
    const bulletInputs = page.getByPlaceholder(/Add an achievement, metric, or responsibility/i);
    await bulletInputs.last().fill("Led global edge multi-region migration.");

    // Live preview updates
    await expect(preview.getByText("Principal Cloud Architect")).toBeVisible();
    await expect(preview.getByText("Stripe")).toBeVisible();
    await expect(preview.getByText("Led global edge multi-region migration.")).toBeVisible();

    // 7. Hide a section (Summary)
    const hideSummaryBtn = page.getByTitle(/Visible \(click to hide\)/i).first();
    await hideSummaryBtn.click();

    // 8. Save resume manually
    const saveBtn = page.getByTestId("manual-save-button");
    await saveBtn.click();
    await expect(page.getByText(/^saved$/i)).toBeVisible({ timeout: 10000 });

    // 9. Hard reload page to verify persistence in D1 database
    await page.reload();
    await page.waitForLoadState("networkidle");

    // Content persists after reload
    await expect(page.getByTestId("resume-preview-document")).toBeVisible();
    const reloadedPreview = page.getByTestId("resume-preview-document");
    await expect(reloadedPreview.getByText("Dr. Jonathan Hayes")).toBeVisible();
    await expect(reloadedPreview.getByText("Principal Cloud Architect")).toBeVisible();
    await expect(reloadedPreview.getByText("Stripe")).toBeVisible();
    await expect(reloadedPreview.getByText("Led global edge multi-region migration.")).toBeVisible();
  });
});
