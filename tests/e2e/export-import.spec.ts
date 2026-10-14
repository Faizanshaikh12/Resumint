import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const pdf = require("pdf-parse/lib/pdf-parse.js");

test.describe("Phase 7: Export and Import E2E", () => {
  const timestamp = Date.now();
  const testUser = {
    name: "Export Tester",
    email: `export-${timestamp}@resumint.dev`,
    password: "Password123!",
  };

  test.beforeEach(async ({ page }) => {
    // Stub window.print so headless browser print dialog never blocks
    await page.addInitScript(() => {
      (window as any).__printed = false;
      window.print = () => {
        (window as any).__printed = true;
      };
    });
  });

  test("full JSON export and import roundtrip preserves content and design", async ({
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

    // Fill candidate details
    await page.getByLabel(/Full Name/i).fill("Alexander Vance");
    await page.getByLabel(/Job Title \/ Headline/i).fill("Staff Reliability Engineer");
    await page.getByLabel(/Email Address/i).fill("alex@vance.dev");
    await page.getByLabel(/Location/i).fill("Seattle, WA");

    // Add Work Experience
    const expNav = page.getByRole("button", { name: /^Work Experience/i }).first();
    await expNav.click();

    await page.getByRole("button", { name: /Add Position/i }).click();
    const positionInputs = page.getByLabel(/Job Title \/ Position/i);
    await positionInputs.last().fill("Staff Infrastructure Engineer");

    const companyInputs = page.getByLabel(/Company \/ Organization/i);
    await companyInputs.last().fill("Datadog");

    await page.getByRole("button", { name: /Add bullet point/i }).last().click();
    const bulletInputs = page.getByPlaceholder(/Add an achievement, metric, or responsibility/i);
    await bulletInputs.last().fill("Reduced multi-region failover latency from 45s to 800ms.");

    // Switch to Design tab and customize template & theme
    await page.getByRole("tab", { name: /^Design/i }).click();
    await page.getByRole("radio", { name: /Technical/i }).click();

    // Save resume manually
    const saveBtn = page.getByTestId("manual-save-button");
    await saveBtn.click();
    await expect(page.getByText(/^saved$/i)).toBeVisible({ timeout: 10000 });

    // 4. Download JSON backup
    const exportTrigger = page.getByTestId("export-menu-trigger");
    await exportTrigger.click();

    const downloadJsonPromise = page.waitForEvent("download");
    await page.getByTestId("export-json-item").click();
    const jsonDownload = await downloadJsonPromise;

    expect(jsonDownload.suggestedFilename()).toMatch(/\.json$/i);

    // Read exported JSON
    const jsonStream = await jsonDownload.createReadStream();
    const chunks: Buffer[] = [];
    for await (const chunk of jsonStream) {
      chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
    }
    const exportedJsonText = Buffer.concat(chunks).toString("utf-8");
    const exportedData = JSON.parse(exportedJsonText);

    expect(exportedData.app).toBe("resumint");
    expect(exportedData.schemaVersion).toBe(1);
    expect(exportedData.resume.content.personal.name).toBe("Alexander Vance");
    expect(exportedData.resume.templateId).toBe("technical");
    const hasAddedPosition = exportedData.resume.content.experience.some(
      (e: any) => e.position === "Staff Infrastructure Engineer"
    );
    expect(hasAddedPosition).toBe(true);

    // 5. Navigate to Dashboard -> /resumes/new to import
    await page.goto("/resumes/new");
    await page.waitForLoadState("networkidle");

    // Click Import from JSON card
    await page.getByTestId("import-json-card-button").click();
    await expect(page.getByRole("dialog")).toBeVisible();

    // Upload the exported JSON file buffer into the hidden file input
    const fileInput = page.getByTestId("import-file-input");
    await fileInput.setInputFiles({
      name: "alexander-vance-backup.json",
      mimeType: "application/json",
      buffer: Buffer.from(exportedJsonText),
    });

    // Check summary card
    await expect(page.getByText("Backup Verified")).toBeVisible();
    await expect(page.getByText("Alexander Vance")).toBeVisible();
    await expect(page.getByTestId("import-summary-card").getByText("technical")).toBeVisible();

    // Confirm import
    await page.getByTestId("confirm-import-button").click();

    // Lands on newly created resume editor
    await page.waitForURL(/\/resumes\/[a-zA-Z0-9_-]+\/edit/, { timeout: 15000 });
    const importedPreview = page.getByTestId("resume-preview-document");
    await expect(importedPreview.getByText("Alexander Vance")).toBeVisible();
    await expect(importedPreview.getByText("Staff Infrastructure Engineer")).toBeVisible();
    await expect(importedPreview.getByText("Datadog")).toBeVisible();
    await expect(
      importedPreview.getByText("Reduced multi-region failover latency from 45s to 800ms.")
    ).toBeVisible();
  });

  test("plain text (.txt) export and clipboard copy", async ({ page }) => {
    // Re-use user from previous or create blank resume
    await page.goto("/signup");
    await page.waitForLoadState("networkidle");
    const uniqueUser = {
      name: "Text Tester",
      email: `text-${Date.now()}@resumint.dev`,
      password: "Password123!",
    };
    await page.fill("#auth-name", uniqueUser.name);
    await page.fill("#auth-email", uniqueUser.email);
    await page.fill("#auth-password", uniqueUser.password);
    await page.click('button[type="submit"]');

    await page.waitForURL("**/dashboard", { timeout: 15000 });
    await page.getByRole("button", { name: /create your first resume/i }).click();
    await page.waitForURL("**/resumes/new", { timeout: 10000 });
    await page.getByRole("button", { name: /create blank resume/i }).click();
    await page.waitForURL(/\/resumes\/[a-zA-Z0-9_-]+\/edit/, { timeout: 15000 });
    await expect(page.getByTestId("manual-save-button")).toBeVisible();

    // Set candidate info
    await page.getByLabel(/Full Name/i).fill("Marcus Brody");
    await page.getByLabel(/Job Title \/ Headline/i).fill("Museum Curator");
    await page.getByLabel(/Email Address/i).fill("mbrody@marshall.edu");

    // Add experience
    await page.getByRole("button", { name: /^Work Experience/i }).first().click();
    await page.getByRole("button", { name: /Add Position/i }).click();
    await page.getByLabel(/Job Title \/ Position/i).last().fill("Curator of Antiquities");
    await page.getByLabel(/Company \/ Organization/i).last().fill("National Museum");

    // Export .txt
    await page.getByTestId("export-menu-trigger").click();
    const downloadTextPromise = page.waitForEvent("download");
    await page.getByTestId("export-text-item").click();
    const textDownload = await downloadTextPromise;

    expect(textDownload.suggestedFilename()).toMatch(/\.txt$/i);

    const stream = await textDownload.createReadStream();
    const chunks: Buffer[] = [];
    for await (const chunk of stream) {
      chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
    }
    const plainText = Buffer.concat(chunks).toString("utf-8");

    expect(plainText).toContain("Marcus Brody");
    expect(plainText).toContain("Museum Curator");
    expect(plainText).toContain("mbrody@marshall.edu");
    expect(plainText).toContain("WORK EXPERIENCE");
    expect(plainText).toContain("Curator of Antiquities");
    expect(plainText).toContain("National Museum");

    // Copy to clipboard
    await page.context().grantPermissions(["clipboard-read", "clipboard-write"]);
    await page.getByTestId("export-menu-trigger").click();
    await page.getByTestId("copy-text-item").click();
    await expect(page.getByText(/Copied to clipboard/i)).toBeVisible();
  });

  test("PDF export across all 5 templates with Chromium print fidelity and text extraction", async ({
    page,
  }) => {
    // Create new resume
    await page.goto("/signup");
    await page.waitForLoadState("networkidle");
    const uniqueUser = {
      name: "PDF Tester",
      email: `pdf-${Date.now()}@resumint.dev`,
      password: "Password123!",
    };
    await page.fill("#auth-name", uniqueUser.name);
    await page.fill("#auth-email", uniqueUser.email);
    await page.fill("#auth-password", uniqueUser.password);
    await page.click('button[type="submit"]');

    await page.waitForURL("**/dashboard", { timeout: 15000 });
    await page.getByRole("button", { name: /create your first resume/i }).click();
    await page.waitForURL("**/resumes/new", { timeout: 10000 });
    await page.getByRole("button", { name: /create blank resume/i }).click();
    await page.waitForURL(/\/resumes\/[a-zA-Z0-9_-]+\/edit/, { timeout: 15000 });
    await expect(page.getByTestId("manual-save-button")).toBeVisible();

    // Set candidate details
    await page.getByLabel(/Full Name/i).fill("Cassian Andor");
    await page.getByLabel(/Job Title \/ Headline/i).fill("Reconnaissance Specialist");

    // Add Work Experience
    await page.getByRole("button", { name: /^Work Experience/i }).first().click();
    await page.getByRole("button", { name: /Add Position/i }).click();
    await page.getByLabel(/Job Title \/ Position/i).last().fill("Intelligence Operative");
    await page.getByLabel(/Company \/ Organization/i).last().fill("Alliance Intelligence");
    await page.getByRole("button", { name: /Add bullet point/i }).last().click();
    await page.getByPlaceholder(/Add an achievement, metric, or responsibility/i).last().fill(
      "Infiltrated Imperial data vault on Scarif."
    );

    // Save
    await page.getByTestId("manual-save-button").click();
    await expect(page.getByText(/^saved$/i)).toBeVisible({ timeout: 10000 });

    const templates = ["modern", "classic", "minimal", "executive", "technical"] as const;

    // Switch to Design tab
    await page.getByRole("tab", { name: /^Design/i }).click();

    for (const tmpl of templates) {
      // Select template
      const templateRadio = page.getByRole("radio", { name: new RegExp(tmpl, "i") });
      await templateRadio.click();

      // Emulate print CSS media
      await page.emulateMedia({ media: "print" });

      // Generate A4 PDF
      const a4Buffer = await page.pdf({
        format: "A4",
        printBackground: true,
        displayHeaderFooter: false,
      });

      expect(a4Buffer).toBeDefined();
      expect(a4Buffer.length).toBeGreaterThan(500);
      expect(a4Buffer.subarray(0, 5).toString("ascii")).toBe("%PDF-");

      // Extract text with pdf-parse
      const parsedA4 = await pdf(a4Buffer);
      expect(parsedA4.text.toLowerCase()).toContain("cassian andor");
      expect(parsedA4.text).toContain("Infiltrated Imperial data vault on Scarif.");
      expect(parsedA4.numpages).toBeGreaterThanOrEqual(1);

      // Return to screen media
      await page.emulateMedia({ media: "screen" });
    }

    // Also verify Letter format on technical template
    await page.emulateMedia({ media: "print" });
    const letterBuffer = await page.pdf({
      format: "Letter",
      printBackground: true,
      displayHeaderFooter: false,
    });
    expect(letterBuffer.length).toBeGreaterThan(500);
    const parsedLetter = await pdf(letterBuffer);
    expect(parsedLetter.text).toContain("Cassian Andor");
    await page.emulateMedia({ media: "screen" });
  });

  test("guest flow on /build: local draft persistence, print hint instructions, and import replace draft", async ({
    browser,
  }) => {
    // Fresh unauthenticated browser context
    const guestContext = await browser.newContext();
    const guestPage = await guestContext.newPage();

    // Stub window.print
    await guestPage.addInitScript(() => {
      (window as any).__printed = false;
      window.print = () => {
        (window as any).__printed = true;
      };
    });

    await guestPage.goto("/build");
    await guestPage.waitForLoadState("networkidle");
    await expect(guestPage.getByTestId("export-menu-trigger")).toBeVisible();
    await expect(guestPage.getByTestId("resume-preview-document")).toBeVisible();

    // Edit candidate name
    await guestPage.getByLabel(/Full Name/i).fill("Rey Skywalker");
    const preview = guestPage.getByTestId("resume-preview-document");
    await expect(preview.getByText("Rey Skywalker")).toBeVisible();

    // Trigger manual save in guest mode to commit to localStorage immediately
    await guestPage.getByTestId("manual-save-button").click();
    await expect(guestPage.getByText(/^saved$/i)).toBeVisible({ timeout: 5000 });

    // Verify localStorage key resumint_guest_draft exists
    const draftKey = await guestPage.evaluate(() => localStorage.getItem("resumint_guest_draft"));
    expect(draftKey).not.toBeNull();
    expect(draftKey).toContain("Rey Skywalker");

    // Click Export -> Download PDF triggers PrintHintDialog
    await guestPage.getByTestId("export-menu-trigger").click();
    await guestPage.getByTestId("export-pdf-item").click();

    // Print hint dialog should be visible
    await expect(guestPage.getByRole("dialog")).toBeVisible();
    await expect(guestPage.getByText(/Save as PDF Instructions/i)).toBeVisible();

    // Check "Don't show this again"
    await guestPage.getByLabel(/Don't show this hint again/i).check();

    // Click "Continue to Print"
    await guestPage.getByTestId("confirm-print-button").click();

    // Verify hint preference saved in localStorage
    const hintPref = await guestPage.evaluate(() =>
      localStorage.getItem("resumint_hide_print_hint")
    );
    expect(hintPref).toBe("true");

    // Click Import JSON in Guest Header
    await guestPage.getByTestId("guest-import-json-button").click();

    // Confirmation dialog appears because existing draft is present
    await expect(guestPage.getByRole("dialog")).toBeVisible();
    await expect(guestPage.getByText(/Replace Current Draft\?/i)).toBeVisible();
    await guestPage.getByTestId("confirm-replace-draft-button").click();

    // Now ImportDialog opens
    await expect(guestPage.getByTestId("import-file-input")).toBeAttached();

    const sampleImport = {
      app: "resumint",
      schemaVersion: 1,
      exportedAt: new Date().toISOString(),
      resume: {
        title: "Imported Jedi Resume",
        templateId: "minimal",
        content: {
          personal: {
            name: "Luke Skywalker",
            title: "Jedi Master",
            email: "luke@rebellion.org",
            phone: "",
            location: "Ahch-To",
            links: [],
          },
          experience: [
            {
              id: "exp-1",
              company: "Jedi Order",
              position: "Grand Master",
              location: "Galaxy",
              date: { start: "4 ABY", end: "Present", current: true },
              bullets: ["Trained a new generation of Jedi knights."],
            },
          ],
          education: [],
          skills: [],
          projects: [],
          certifications: [],
          awards: [],
          interests: [],
          references: [],
        },
        design: {
          accentColor: "#10b981",
          fontFamily: "inter",
          fontScale: 1.0,
          lineSpacing: 1.3,
          pageMargin: 16,
          sectionSpacing: 16,
          pageSize: "A4",
          columns: 1,
          headerAlign: "left",
          dateStyle: "MMM YYYY",
          showIcons: true,
          fontSize: "md",
          margins: "normal",
        },
      },
    };

    // Upload sample import JSON
    const fileInput = guestPage.getByTestId("import-file-input");
    await fileInput.setInputFiles({
      name: "luke-skywalker.json",
      mimeType: "application/json",
      buffer: Buffer.from(JSON.stringify(sampleImport)),
    });

    // Check summary card
    await expect(guestPage.getByText("Luke Skywalker")).toBeVisible();
    await guestPage.getByTestId("confirm-import-button").click();

    // Draft replaced
    await expect(preview.getByText("Luke Skywalker")).toBeVisible();
    await expect(preview.getByText("Jedi Master")).toBeVisible();
    await expect(preview.getByText("Trained a new generation of Jedi knights.")).toBeVisible();

    await guestContext.close();
  });

  test("accessibility scan on ExportMenu, PrintHintDialog, and ImportDialog", async ({ page }) => {
    // Open editor directly
    await page.goto("/build");
    await page.waitForLoadState("networkidle");
    await expect(page.getByTestId("export-menu-trigger")).toBeVisible();
    await expect(page.getByTestId("resume-preview-document")).toBeVisible();

    // 1. Scan Export Menu dropdown
    await page.getByTestId("export-menu-trigger").click();
    await expect(page.getByTestId("export-menu-content")).toBeVisible();

    const menuAxe = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .disableRules(["color-contrast"])
      .analyze();
    expect(menuAxe.violations).toEqual([]);

    // Close menu by pressing Escape and waiting for it to hide
    await page.keyboard.press("Escape");
    await expect(page.getByTestId("export-menu-content")).toBeHidden();

    // 2. Open Print Hint Dialog
    await page.getByTestId("export-menu-trigger").click();
    await expect(page.getByTestId("export-menu-content")).toBeVisible();
    await page.getByTestId("export-pdf-item").click();
    await expect(page.getByRole("dialog")).toBeVisible();

    const hintAxe = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .disableRules(["color-contrast"])
      .analyze();
    expect(hintAxe.violations).toEqual([]);

    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).toBeHidden();

    // 3. Open Import Dialog
    await page.getByRole("button", { name: /Import/i }).click();
    await expect(page.getByRole("dialog")).toBeVisible();

    const importAxe = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .disableRules(["color-contrast"])
      .analyze();
    expect(importAxe.violations).toEqual([]);
  });
});
