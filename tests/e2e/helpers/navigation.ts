import type { Page } from "@playwright/test";

/**
 * Navigates to /dashboard via the Main Navigation bar in the header.
 * Handles both desktop viewports and mobile viewports where nav collapses into the user menu.
 */
export async function goToDashboardViaNav(page: Page): Promise<void> {
  const mainNav = page.getByRole("navigation", { name: /main navigation/i });
  const navLink = mainNav.getByRole("link", { name: /dashboard/i });

  if (await navLink.isVisible()) {
    await navLink.click();
  } else {
    // In mobile viewports, the main nav is hidden and accessible via the user menu dropdown
    const userMenu = page.getByRole("button", { name: /user menu/i });
    if (await userMenu.isVisible()) {
      await userMenu.click();
      await page.getByRole("menuitem").getByRole("link", { name: /dashboard/i }).click();
    } else {
      await navLink.click();
    }
  }

  await page.waitForURL("**/dashboard");
}
