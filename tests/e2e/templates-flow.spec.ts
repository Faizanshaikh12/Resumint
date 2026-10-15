import { test, expect } from "@playwright/test";
import { signUpUser, openNewBlankResume } from "./test-utils";

test.describe("DB-Driven Templates & Duplication Flow E2E", () => {
  const timestamp = Date.now();
  const testUser = {
    name: "Template Flow Tester",
    email: `template-flow-${timestamp}@resumint.dev`,
    password: "Password123!",
  };

  test("blank resume UX, template gallery modal, copy-on-apply, and duplication workflow", async ({
    page,
  }) => {
    // 1. Sign up user & navigate to blank resume
    await signUpUser(page, testUser);
    await openNewBlankResume(page);

    // 2. Verify pristine blank canvas & "Start filling" ATS badge
    await expect(page.getByTestId("blank-resume-canvas")).toBeVisible();
    await expect(page.getByText("Start filling")).toBeVisible();

    // 3. Load Sample Content
    const loadSampleBtn = page.getByTestId("load-sample-content-button");
    await expect(loadSampleBtn).toBeVisible();
    await loadSampleBtn.click();

    // Verify populated content in preview
    const preview = page.getByTestId("resume-preview-document");
    await expect(preview.getByText("Alex Morgan")).toBeVisible();
    await expect(preview.getByText("Apex Cloud Technologies")).toBeVisible();

    // 4. Switch to Design tab & open Live Template Gallery Modal
    const designTab = page.getByRole("tab", { name: /^Design/i });
    await designTab.click();
    await expect(page.getByTestId("design-panel")).toBeVisible();

    const browseAllBtn = page.getByTestId("browse-all-templates-button");
    await expect(browseAllBtn).toBeVisible();
    await browseAllBtn.click();

    // 5. Verify Template Gallery Modal contents & filtering
    const modal = page.getByTestId("template-gallery-modal");
    await expect(modal).toBeVisible();
    await expect(modal.getByText("Resume Templates")).toBeVisible();

    // Filter by Premium tier
    const premiumTab = modal.getByRole("tab", { name: /Premium \(3\)/i });
    await premiumTab.click();
    await expect(modal.getByTestId("template-card-creative")).toBeVisible();
    await expect(modal.getByTestId("template-card-bold")).toBeVisible();
    await expect(modal.getByTestId("template-card-elegant")).toBeVisible();

    // Check "Keep my accent color & page size"
    const keepColorToggle = modal.getByTestId("keep-color-checkbox");
    await keepColorToggle.click();

    // Apply "Creative" template
    const applyCreativeBtn = modal.getByTestId("apply-template-creative");
    await applyCreativeBtn.click();

    // Content is completely preserved
    await expect(preview.getByText("Alex Morgan")).toBeVisible();

    // Close modal via Escape or close button
    await page.keyboard.press("Escape");
    await expect(modal).not.toBeVisible();

    // Save resume to persist in D1
    const saveBtn = page.getByTestId("manual-save-button");
    await saveBtn.click();
    await expect(page.getByText(/^saved$/i)).toBeVisible({ timeout: 10000 });

    // 6. Test Editor Header Duplication with Template Switcher
    const duplicateMenuBtn = page.getByTestId("editor-duplicate-menu-button");
    await expect(duplicateMenuBtn).toBeVisible();
    await duplicateMenuBtn.click();

    const duplicateAndSwitchOption = page.getByTestId(
      "editor-duplicate-and-change-template-option"
    );
    await expect(duplicateAndSwitchOption).toBeVisible();
    await duplicateAndSwitchOption.click();

    // 7. Verify redirection to duplicate resume with Template Gallery automatically open
    await expect(page).toHaveURL(/openGallery=true/, { timeout: 15000 });
    await expect(page.getByTestId("template-gallery-modal")).toBeVisible();
    await expect(preview.getByText("Alex Morgan")).toBeVisible();
  });
});
