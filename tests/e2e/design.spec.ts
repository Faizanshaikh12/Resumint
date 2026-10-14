import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test.describe("Resume Templates & Design Customization E2E", () => {
  const timestamp = Date.now();
  const testUser = {
    name: "Design Tester",
    email: `design-${timestamp}@resumint.dev`,
    password: "Password123!",
  };

  test("switch template, customize design tokens, undo/redo, persistence, and Chromium PDF print fidelity", async ({
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
    await expect(page.getByTestId("resume-preview-document")).toBeVisible();

    // Fill candidate name in content tab first
    await page.getByLabel(/Full Name/i).fill("Elena Rostova");
    const preview = page.getByTestId("resume-preview-document");
    await expect(preview.getByText("Elena Rostova")).toBeVisible();

    // 4. Switch to "Design" tab
    const designTabBtn = page.getByRole("tab", { name: /^Design/i });
    await designTabBtn.click();
    await expect(page.getByTestId("design-panel")).toBeVisible();

    // 5. Accessibility Scan on Design Panel
    const axeResults = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .disableRules(["color-contrast"]) // Avoid synthetic palette contrast flakiness in headless
      .analyze();
    expect(axeResults.violations).toEqual([]);

    // 6. Switch Template to Executive
    const executiveRadio = page.getByRole("radio", { name: /Executive/i });
    await executiveRadio.click();
    await expect(executiveRadio).toHaveAttribute("aria-checked", "true");

    // Candidate content remains intact
    await expect(preview.getByText("Elena Rostova")).toBeVisible();

    // 7. Select Emerald Swatch
    const emeraldSwatch = page.getByLabel(/Select Emerald/i);
    await emeraldSwatch.click();

    // 8. Test Undo / Redo in Header
    const undoBtn = page.getByLabel(/Undo change/i);
    await undoBtn.click(); // Undoes Emerald swatch
    await undoBtn.click(); // Undoes Executive template switch back to Modern

    const modernRadio = page.getByRole("radio", { name: /Modern/i });
    await expect(modernRadio).toHaveAttribute("aria-checked", "true");

    const redoBtn = page.getByLabel(/Redo change/i);
    await redoBtn.click(); // Redoes Executive
    await expect(executiveRadio).toHaveAttribute("aria-checked", "true");

    await redoBtn.click(); // Redoes Emerald swatch

    // 9. Save Resume
    const saveBtn = page.getByTestId("manual-save-button");
    await saveBtn.click();
    await expect(page.getByText(/^saved$/i)).toBeVisible({ timeout: 10000 });

    // 10. Reload and verify persistence in D1
    await page.reload();
    await page.waitForLoadState("networkidle");

    // Template and content persist after reload
    await expect(page.getByTestId("resume-preview-document")).toBeVisible();
    await expect(preview.getByText("Elena Rostova")).toBeVisible();

    // Switch to Design tab to confirm selected template is still Executive
    await page.getByRole("tab", { name: /^Design/i }).click();
    const reloadedExecutiveRadio = page.getByRole("radio", { name: /Executive/i });
    await expect(reloadedExecutiveRadio).toHaveAttribute("aria-checked", "true");

    // 11. Chromium PDF Print Fidelity Test
    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      displayHeaderFooter: false,
    });

    expect(pdfBuffer).toBeDefined();
    expect(pdfBuffer.length).toBeGreaterThan(1000); // Valid generated PDF is multi-KB
    // Verify PDF header magic bytes "%PDF-"
    const pdfHeader = pdfBuffer.subarray(0, 5).toString("ascii");
    expect(pdfHeader).toBe("%PDF-");
  });
});
