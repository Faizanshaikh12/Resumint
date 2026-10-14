import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test.describe("Resumint Landing Smoke & Accessibility", () => {
  test("loads the landing page with valid title and heading", async ({ page }) => {
    await page.goto("/");

    // Verify Title
    await expect(page).toHaveTitle(/Resumint/i);

    // Verify Main Heading
    const heading = page.getByRole("heading", { level: 1 });
    await expect(heading).toBeVisible();
    await expect(heading).toContainText(/Resume Builder/i);

    // Verify CTA button
    const ctaButton = page.getByTestId("hero-build-cta");
    await expect(ctaButton).toBeVisible();
  });

  test("passes automated axe accessibility standards", async ({ page }) => {
    await page.goto("/");

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa"])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test("verifies /health endpoint status", async ({ request }) => {
    const response = await request.get("/health");
    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(body.status).toBe("ok");
    expect(body.d1).toBe("connected");
  });
});
