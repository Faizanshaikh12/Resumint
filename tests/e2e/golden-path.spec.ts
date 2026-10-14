import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test.describe("Phase 10: Golden Path E2E (Full User Lifecycle)", () => {
  const timestamp = Date.now();
  const testUser = {
    name: "Golden Path User",
    email: `golden-${timestamp}@resumint.dev`,
    password: "Password123!",
  };

  test.beforeEach(async ({ page }) => {
    // Intercept window.print so browser print modal does not halt execution
    await page.addInitScript(() => {
      (window as any).__printed = false;
      window.print = () => {
        (window as any).__printed = true;
      };
    });
  });

  test("runs complete golden path flow across all MVP systems", async ({
    browser,
    page,
  }) => {
    test.setTimeout(60000);
    // -------------------------------------------------------------
    // Step 1: Landing Page -> Guest Build
    // -------------------------------------------------------------
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await expect(page.locator("#main-content")).toBeVisible({ timeout: 10000 });

    const heroHeading = page.getByRole("heading", { level: 1 });
    await expect(heroHeading).toBeVisible();

    // Click primary hero CTA "Build your resume"
    const heroCta = page.getByTestId("hero-build-cta");
    await expect(heroCta).toBeVisible();
    await heroCta.click();

    // Lands on /build (guest editor)
    await page.waitForURL("**/build", { timeout: 15000 });
    await expect(page.getByTestId("manual-save-button")).toBeVisible({ timeout: 10000 });

    // -------------------------------------------------------------
    // Step 2: Pick Template & Accent Color in Design Tab
    // -------------------------------------------------------------
    const designTab = page.getByRole("tab", { name: /^Design/i });
    await designTab.click();
    await expect(page.getByRole("radio", { name: /Technical/i })).toBeVisible({ timeout: 5000 });

    // Switch to Technical template
    await page.getByRole("radio", { name: /Technical/i }).click();

    // -------------------------------------------------------------
    // Step 3: Switch back to Content, Edit Details, Check Tab Fix
    // -------------------------------------------------------------
    const contentTab = page.getByRole("tab", { name: /^Content/i });
    await contentTab.click();

    const nameInput = page.getByLabel(/Full Name/i);
    await expect(nameInput).toBeVisible({ timeout: 5000 });
    await nameInput.fill("Dr. Elena Rostova");

    const headlineInput = page.getByLabel(/Job Title \/ Headline/i);
    await headlineInput.fill("Staff Distributed Systems Engineer");

    // Check Tab & Score
    const checkTab = page.getByRole("tab", { name: /^Check/i });
    await checkTab.click();
    await expect(page.getByTestId("ats-score-gauge-card")).toBeVisible({ timeout: 5000 });
    await expect(page.getByTestId("ats-checker-panel")).toBeVisible();

    // Return to Content tab
    await contentTab.click();

    // Save guest draft to localStorage
    const manualSaveBtn = page.getByTestId("manual-save-button");
    await manualSaveBtn.click();
    await expect(page.getByText(/^saved$/i)).toBeVisible({ timeout: 10000 });

    // -------------------------------------------------------------
    // Step 4: Sign Up in Dialog / Guest Claim
    // -------------------------------------------------------------
    // Click Share button in guest mode which prompts the AuthDialog
    const guestShareBtn = page.getByTestId("editor-share-button");
    await guestShareBtn.click();

    const authDialog = page.getByRole("dialog");
    await expect(authDialog).toBeVisible({ timeout: 5000 });
    await expect(page.getByTestId("auth-dialog-signup-button")).toBeVisible();

    // Navigate to /signup from dialog
    await page.getByTestId("auth-dialog-signup-button").click();
    await page.waitForURL("**/signup", { timeout: 10000 });

    // Complete sign up
    await page.fill("#auth-name", testUser.name);
    await page.fill("#auth-email", testUser.email);
    await page.fill("#auth-password", testUser.password);
    await page.click('button[type="submit"]');

    // Lands on Dashboard
    await page.waitForURL("**/dashboard", { timeout: 15000 });
    await expect(page.getByRole("heading", { name: /my documents/i })).toBeVisible({ timeout: 10000 });

    // -------------------------------------------------------------
    // Step 5: Create / Open Resume in Account Editor & Autosave
    // -------------------------------------------------------------
    const createBtn = page
      .locator("[data-testid='create-first-resume-button']")
      .or(page.getByRole("button", { name: /create (your first )?resume/i }));
    await expect(createBtn).toBeVisible({ timeout: 10000 });
    await createBtn.click();

    await page.waitForURL("**/resumes/new", { timeout: 10000 });
    await page.getByRole("button", { name: /create blank resume/i }).click();

    await page.waitForURL(/\/resumes\/[a-zA-Z0-9_-]+\/edit/, { timeout: 15000 });
    await expect(page.getByTestId("manual-save-button")).toBeVisible({ timeout: 10000 });

    // Edit Name
    const editorNameInput = page.getByLabel(/Full Name/i);
    await editorNameInput.fill("Elena Rostova");
    const editorHeadlineInput = page.getByLabel(/Job Title \/ Headline/i);
    await editorHeadlineInput.fill("Principal Edge Engineer");

    // Save in DB
    await page.getByTestId("manual-save-button").click();
    await expect(page.getByTestId("save-status-indicator")).toContainText("Saved", { timeout: 10000 });

    // -------------------------------------------------------------
    // Step 6: Export JSON and PDF
    // -------------------------------------------------------------
    const exportMenuBtn = page.getByTestId("export-menu-trigger");
    await expect(exportMenuBtn).toBeVisible({ timeout: 5000 });
    await exportMenuBtn.click();

    // 6a. Export JSON
    const downloadPromise = page.waitForEvent("download");
    await page.getByTestId("export-json-item").click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/\.json$/i);

    // 6b. Export PDF (opens hint dialog)
    await exportMenuBtn.click();
    await page.getByTestId("export-pdf-item").click();
    const printHintDialog = page.getByRole("dialog");
    await expect(printHintDialog).toBeVisible({ timeout: 5000 });
    await page.getByTestId("confirm-print-button").click();
    await expect(printHintDialog).toBeHidden({ timeout: 5000 });

    // -------------------------------------------------------------
    // Step 7: Share via Link with Password Protection & Expiry
    // -------------------------------------------------------------
    const shareBtn = page.getByTestId("editor-share-button");
    await shareBtn.click();
    await page.waitForURL(/\/resumes\/[a-zA-Z0-9_-]+\/share/, { timeout: 10000 });

    // Enable sharing
    const shareSwitch = page.getByTestId("public-share-switch");
    await expect(shareSwitch).toBeVisible({ timeout: 5000 });
    await shareSwitch.click();

    // Verify share link generated
    const linkInput = page.getByTestId("public-link-input");
    await expect(linkInput).toBeVisible({ timeout: 10000 });
    const shareUrl = await linkInput.inputValue();
    expect(shareUrl).toContain("/r/");

    // Set Password Protection
    await page.getByTestId("set-password-button").click();
    const pwdModal = page.getByRole("dialog");
    await expect(pwdModal).toBeVisible({ timeout: 5000 });
    await page.getByTestId("share-password-input").fill("GoldenShield99!");
    await page.getByTestId("save-password-button").click();
    await expect(pwdModal).toBeHidden({ timeout: 10000 });
    await expect(page.getByText(/Password protection set/i)).toBeVisible();

    // -------------------------------------------------------------
    // Step 8: Clean Visitor Context -> Enter Password -> View Resume
    // -------------------------------------------------------------
    const visitorContext = await browser.newContext();
    const visitorPage = await visitorContext.newPage();

    await visitorPage.goto(shareUrl);
    await visitorPage.waitForLoadState("networkidle");

    // Visitor sees locked state
    await expect(visitorPage.getByRole("heading", { name: /Protected Resume/i })).toBeVisible({ timeout: 10000 });
    await expect(visitorPage.getByTestId("public-password-input")).toBeVisible();

    // Incorrect password attempt
    await visitorPage.getByTestId("public-password-input").fill("WrongSecret!");
    await visitorPage.getByTestId("unlock-submit-button").click();
    await expect(visitorPage.getByTestId("unlock-error-message")).toBeVisible({ timeout: 10000 });

    // Correct password unlock
    await visitorPage.getByTestId("public-password-input").fill("GoldenShield99!");
    await visitorPage.getByTestId("unlock-submit-button").click();
    await expect(visitorPage.getByTestId("public-resume-preview")).toBeVisible({ timeout: 10000 });
    await expect(visitorPage.getByTestId("public-resume-preview")).toContainText("Elena Rostova");

    // -------------------------------------------------------------
    // Step 9: Owner Revokes Share -> Visitor Sees Unavailable 404
    // -------------------------------------------------------------
    await shareSwitch.click();
    await expect(page.getByTestId("share-status-pill")).toContainText("Sharing Off", { timeout: 10000 });

    // Visitor reloads and sees unavailable page
    await visitorPage.reload();
    await visitorPage.waitForLoadState("networkidle");
    await expect(visitorPage.getByTestId("unavailable-heading")).toBeVisible({ timeout: 10000 });
    await expect(visitorPage.getByTestId("public-resume-preview")).toBeHidden();
    await visitorContext.close();

    // -------------------------------------------------------------
    // Step 10: Delete Resume via Dashboard
    // -------------------------------------------------------------
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");
    await expect(page.getByTestId("resume-card").first()).toBeVisible({ timeout: 10000 });

    const card = page.getByTestId("resume-card").first();
    await card.getByRole("button", { name: /actions for/i }).click();
    await page.getByRole("menuitem", { name: /^delete$/i }).click();

    await expect(page.getByRole("dialog")).toBeVisible({ timeout: 5000 });
    await page.getByTestId("confirm-delete-resume-button").click();
    await expect(page.getByTestId("resume-card")).toHaveCount(0, { timeout: 10000 });

    // -------------------------------------------------------------
    // Step 11: Settings -> Download Data & Delete Account
    // -------------------------------------------------------------
    await page.goto("/settings");
    await page.waitForLoadState("networkidle");
    await expect(page.getByRole("heading", { name: /Account Settings/i })).toBeVisible({ timeout: 10000 });

    // Download Data
    const dataDownloadPromise = page.waitForEvent("download");
    await page.getByTestId("download-all-data-button").click();
    const dataDownload = await dataDownloadPromise;
    expect(dataDownload.suggestedFilename()).toMatch(/resumint-data-.*\.json$/i);

    // Delete Account
    await page.getByTestId("open-delete-account-dialog-button").click();
    const deleteAccountDialog = page.getByRole("dialog");
    await expect(deleteAccountDialog).toBeVisible({ timeout: 5000 });

    await page.fill("#confirmation-input", "delete my account");
    await page.getByTestId("confirm-delete-account-button").click();

    // Redirected to landing page with ?deleted=true and session cleared
    await page.waitForURL(/\/\?deleted=true/, { timeout: 15000 });
    await expect(page.getByTestId("account-deleted-banner")).toBeVisible({ timeout: 10000 });
    await expect(page.getByTestId("account-deleted-banner")).toContainText("permanently deleted");
  });
});
