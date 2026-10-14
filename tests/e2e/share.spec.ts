import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { signUpUser, openNewBlankResume } from "./test-utils";

async function createOwnerWithResume(page: Page) {
  const timestamp = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const user = {
    name: "Share Owner",
    email: `owner-${timestamp}@resumint.dev`,
    password: "Password123!",
  };

  // 1. Sign up & navigate to blank resume
  await signUpUser(page, user);
  await openNewBlankResume(page);

  // Fill candidate details
  await page.getByLabel(/Full Name/i).fill("Elena Rostova");
  await page.getByLabel(/Job Title \/ Headline/i).fill("Lead Distributed Systems Engineer");

  // Save changes to clear isDirty state so navigation blockers do not trigger
  await page.getByTestId("manual-save-button").click();
  await expect(page.getByTestId("save-status-indicator")).toContainText("Saved", { timeout: 10000 });

  return user;
}

test.describe("Phase 8: Share via Link E2E", () => {
  test("owner enables share, visitor opens, owner revokes, visitor sees unavailable", async ({
    browser,
    page: ownerPage,
  }) => {
    await createOwnerWithResume(ownerPage);

    // Click "Share" button in Editor Header
    const shareBtn = ownerPage.getByTestId("editor-share-button");
    await expect(shareBtn).toBeVisible();
    await shareBtn.click();

    // Lands on Share Settings page
    await ownerPage.waitForURL(/\/resumes\/[a-zA-Z0-9_-]+\/share/, { timeout: 10000 });
    await expect(ownerPage.getByTestId("share-settings-heading")).toBeVisible();

    // Turn ON sharing via switch
    const shareSwitch = ownerPage.getByTestId("public-share-switch");
    await expect(shareSwitch).toBeVisible();
    await shareSwitch.click();

    // Wait for share link to be enabled and link input visible
    const linkInput = ownerPage.getByTestId("public-link-input");
    await expect(linkInput).toBeVisible({ timeout: 10000 });
    const shareUrl = await linkInput.inputValue();
    expect(shareUrl).toContain("/r/");

    // Open visitor context with zero cookies
    const visitorContext = await browser.newContext();
    const visitorPage = await visitorContext.newPage();

    await visitorPage.goto(shareUrl);
    await visitorPage.waitForLoadState("networkidle");

    // Visitor sees candidate name and resume preview
    await expect(visitorPage.getByTestId("public-resume-preview")).toBeVisible();
    await expect(visitorPage.getByTestId("public-resume-preview")).toContainText("Elena Rostova");

    // Owner turns OFF sharing (disables link)
    await shareSwitch.click();
    await expect(ownerPage.getByTestId("share-status-pill")).toContainText("Sharing Off", { timeout: 10000 });

    // Visitor refreshes and gets uniform 404 unavailable page
    await visitorPage.reload();
    await visitorPage.waitForLoadState("networkidle");

    await expect(visitorPage.getByTestId("unavailable-heading")).toBeVisible();
    await expect(visitorPage.getByText("This link is unavailable")).toBeVisible();
    await expect(visitorPage.getByTestId("public-resume-preview")).toBeHidden();

    await visitorContext.close();
  });

  test("password protection flow: lock, wrong password, correct password, unlock persistence", async ({
    browser,
    page: ownerPage,
  }) => {
    await createOwnerWithResume(ownerPage);

    // Open share page from editor
    await ownerPage.getByTestId("editor-share-button").click();
    await ownerPage.waitForURL(/\/resumes\/[a-zA-Z0-9_-]+\/share/, { timeout: 10000 });

    // Ensure sharing is enabled
    const shareSwitch = ownerPage.getByTestId("public-share-switch");
    if ((await shareSwitch.getAttribute("aria-checked")) !== "true") {
      await shareSwitch.click();
      await expect(ownerPage.getByTestId("public-link-input")).toBeVisible();
    }

    const shareUrl = await ownerPage.getByTestId("public-link-input").inputValue();

    // Set Password on resume
    await ownerPage.getByTestId("set-password-button").click();
    const pwdModal = ownerPage.getByRole("dialog");
    await expect(pwdModal).toBeVisible();
    await ownerPage.getByTestId("share-password-input").fill("VaultGuard99!");
    await ownerPage.getByTestId("save-password-button").click();

    await expect(pwdModal).toBeHidden({ timeout: 10000 });
    await expect(ownerPage.getByText(/Password protection set/i)).toBeVisible();

    // Visitor context navigates to password-protected link
    const visitorContext = await browser.newContext();
    const visitorPage = await visitorContext.newPage();

    await visitorPage.goto(shareUrl);
    await visitorPage.waitForLoadState("networkidle");

    // Verifies locked form is rendered and no candidate details leak
    await expect(visitorPage.getByText("Protected Resume")).toBeVisible();
    await expect(visitorPage.getByTestId("public-password-input")).toBeVisible();
    await expect(visitorPage.getByTestId("public-resume-preview")).toBeHidden();
    await expect(visitorPage.locator("body")).not.toContainText("Elena Rostova");

    // Submit wrong password
    await visitorPage.getByTestId("public-password-input").fill("WrongSecret000!");
    await visitorPage.getByTestId("unlock-submit-button").click();
    await expect(visitorPage.getByTestId("unlock-error-message")).toBeVisible();
    await expect(visitorPage.getByTestId("unlock-error-message")).toContainText("Incorrect password");

    // Submit correct password
    await visitorPage.getByTestId("public-password-input").fill("VaultGuard99!");
    await visitorPage.getByTestId("unlock-submit-button").click();

    // Resume unlocks and displays
    await expect(visitorPage.getByTestId("public-resume-preview")).toBeVisible({ timeout: 10000 });
    await expect(visitorPage.getByTestId("public-resume-preview")).toContainText("Elena Rostova");

    // Survives reload due to signed unlock cookie
    await visitorPage.reload();
    await visitorPage.waitForLoadState("networkidle");
    await expect(visitorPage.getByTestId("public-resume-preview")).toBeVisible();

    await visitorContext.close();
  });

  test("privacy controls: hideContact and allowDownload toggles", async ({
    browser,
    page: ownerPage,
  }) => {
    await createOwnerWithResume(ownerPage);

    await ownerPage.getByTestId("editor-share-button").click();
    await ownerPage.waitForURL(/\/resumes\/[a-zA-Z0-9_-]+\/share/, { timeout: 10000 });

    // Enable sharing
    const shareSwitch = ownerPage.getByTestId("public-share-switch");
    if ((await shareSwitch.getAttribute("aria-checked")) !== "true") {
      await shareSwitch.click();
      await expect(ownerPage.getByTestId("public-link-input")).toBeVisible();
    }

    // Toggle hideContact ON and allowDownload OFF
    const hideContactSwitch = ownerPage.getByTestId("hide-contact-switch");
    if ((await hideContactSwitch.getAttribute("aria-checked")) !== "true") {
      await hideContactSwitch.click();
    }

    const downloadSwitch = ownerPage.getByTestId("allow-download-switch");
    if ((await downloadSwitch.getAttribute("aria-checked")) === "true") {
      await downloadSwitch.click();
    }

    // Wait for save feedback
    await expect(ownerPage.getByText(/Settings saved/i)).toBeVisible({ timeout: 10000 });
    const shareUrl = await ownerPage.getByTestId("public-link-input").inputValue();

    // Visitor opens page
    const visitorContext = await browser.newContext();
    const visitorPage = await visitorContext.newPage();

    await visitorPage.goto(shareUrl);
    await visitorPage.waitForLoadState("networkidle");

    await expect(visitorPage.getByTestId("public-resume-preview")).toBeVisible();

    // Verify Download PDF button is hidden
    await expect(visitorPage.getByTestId("public-download-pdf-button")).toBeHidden();

    // Verify print suppression style is in the DOM
    const printStyle = await visitorPage.getByTestId("print-suppression-style").innerText();
    expect(printStyle).toContain("@media print");
    expect(printStyle).toContain("#public-resume-document");

    await visitorContext.close();
  });

  test("mobile viewport has readable layout without horizontal scroll", async ({
    browser,
    page: ownerPage,
  }) => {
    await createOwnerWithResume(ownerPage);

    await ownerPage.getByTestId("editor-share-button").click();
    await ownerPage.waitForURL(/\/resumes\/[a-zA-Z0-9_-]+\/share/, { timeout: 10000 });

    const shareSwitch = ownerPage.getByTestId("public-share-switch");
    if ((await shareSwitch.getAttribute("aria-checked")) !== "true") {
      await shareSwitch.click();
      await expect(ownerPage.getByTestId("public-link-input")).toBeVisible();
    }

    const shareUrl = await ownerPage.getByTestId("public-link-input").inputValue();

    // Mobile visitor
    const visitorContext = await browser.newContext({
      viewport: { width: 390, height: 844 },
    });
    const visitorPage = await visitorContext.newPage();

    await visitorPage.goto(shareUrl);
    await visitorPage.waitForLoadState("networkidle");

    await expect(visitorPage.getByTestId("public-resume-preview")).toBeVisible();

    // Check no horizontal scrollbar on body
    const scrollWidth = await visitorPage.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await visitorPage.evaluate(() => document.documentElement.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 2);

    await visitorContext.close();
  });

  test("guest user on /build clicking Share opens AuthDialog", async ({ page }) => {
    await page.goto("/build");
    await page.waitForLoadState("networkidle");

    const shareBtn = page.getByTestId("editor-share-button");
    await expect(shareBtn).toBeVisible();
    await shareBtn.click();

    // Opens AuthDialog prompt
    const authDialog = page.getByRole("dialog");
    await expect(authDialog).toBeVisible();
    await expect(authDialog).toContainText("Create an Account to Share");
    await expect(page.getByTestId("auth-dialog-signup-button")).toBeVisible();
  });

  test("accessibility axe scans on share settings, public page, and QR dialog", async ({
    browser,
    page: ownerPage,
  }) => {
    await createOwnerWithResume(ownerPage);

    await ownerPage.getByTestId("editor-share-button").click();
    await ownerPage.waitForURL(/\/resumes\/[a-zA-Z0-9_-]+\/share/, { timeout: 10000 });

    const shareSwitch = ownerPage.getByTestId("public-share-switch");
    if ((await shareSwitch.getAttribute("aria-checked")) !== "true") {
      await shareSwitch.click();
      await expect(ownerPage.getByTestId("public-link-input")).toBeVisible();
    }

    // 1. Scan Share Settings Page
    const settingsAxe = await new AxeBuilder({ page: ownerPage })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .disableRules(["color-contrast"])
      .analyze();
    expect(settingsAxe.violations).toEqual([]);

    // 2. Scan QR Dialog
    await ownerPage.getByTestId("open-qr-dialog-button").click();
    const qrDialog = ownerPage.getByRole("dialog");
    await expect(qrDialog).toBeVisible();

    const qrAxe = await new AxeBuilder({ page: ownerPage })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .disableRules(["color-contrast"])
      .analyze();
    expect(qrAxe.violations).toEqual([]);

    await ownerPage.keyboard.press("Escape");
    await expect(qrDialog).toBeHidden();

    // 3. Scan Public Page in visitor context
    const shareUrl = await ownerPage.getByTestId("public-link-input").inputValue();
    const visitorContext = await browser.newContext();
    const visitorPage = await visitorContext.newPage();

    await visitorPage.goto(shareUrl);
    await visitorPage.waitForLoadState("networkidle");

    const publicAxe = await new AxeBuilder({ page: visitorPage })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .disableRules(["color-contrast"])
      .analyze();
    expect(publicAxe.violations).toEqual([]);

    await visitorContext.close();
  });
});
