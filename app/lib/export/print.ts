/**
 * Resumint Print Engine
 * Handles font loading guarantees, document.title synchronization for default PDF filenames,
 * and afterprint cleanup across desktop and mobile browsers.
 */

export interface PrintResumeOptions {
  filename?: string;
  onBeforePrint?: () => void;
  onAfterPrint?: () => void;
}

/**
 * Triggers the browser print dialog to export the resume to PDF.
 * Sets document.title to filename (so browser defaults to that file name in Save as PDF),
 * awaits document.fonts.ready to ensure all web fonts are embedded,
 * and restores the original document title on afterprint.
 */
export async function printResume(options: PrintResumeOptions = {}): Promise<boolean> {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return false;
  }

  const { filename, onBeforePrint, onAfterPrint } = options;
  const originalTitle = document.title;

  try {
    // 1. Wait for web fonts to be fully rendered
    if ("fonts" in document && document.fonts?.ready) {
      try {
        await document.fonts.ready;
      } catch (fontErr) {
        console.warn("Failed awaiting document.fonts.ready:", fontErr);
      }
    }

    // 2. Set document.title for browser Save as PDF dialog
    if (filename) {
      // Remove .pdf extension if present as browser adds it automatically
      const cleanTitle = filename.replace(/\.pdf$/i, "");
      document.title = cleanTitle;
    }

    onBeforePrint?.();

    // 3. Register afterprint cleanup
    let cleanedUp = false;
    const cleanup = () => {
      if (cleanedUp) return;
      cleanedUp = true;
      document.title = originalTitle;
      window.removeEventListener("afterprint", cleanup);
      onAfterPrint?.();
    };

    window.addEventListener("afterprint", cleanup);
    // Fallback restore in case browser does not fire afterprint (e.g. mobile or headless)
    setTimeout(cleanup, 3000);

    // 4. Trigger print
    window.print();
    return true;
  } catch (err) {
    console.error("Failed to execute window.print:", err);
    document.title = originalTitle;
    return false;
  }
}
