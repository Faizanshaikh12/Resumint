import { toast } from "~/components/ui/sonner";

/**
 * Client-side utility to trigger a browser file download using Blob and an object URL.
 * Never touches window/document on the server (SSR safe).
 */
export function downloadText(filename: string, mimeType: string, content: string): void {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return;
  }

  const blob = new Blob([content], { type: `${mimeType};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");

  anchor.href = url;
  anchor.download = filename;
  anchor.style.display = "none";
  document.body.appendChild(anchor);
  anchor.click();

  // Cleanup object URL asynchronously to ensure download starts
  setTimeout(() => {
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  }, 100);
}

/**
 * Copies text to the user's clipboard with fallback and toast feedback.
 * SSR safe.
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return false;
  }

  try {
    if (navigator?.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      toast.success("Copied to clipboard");
      return true;
    }

    // Fallback using temporary textarea
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    textarea.style.pointerEvents = "none";
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();

    const successful = document.execCommand("copy");
    document.body.removeChild(textarea);

    if (successful) {
      toast.success("Copied to clipboard");
      return true;
    } else {
      throw new Error("execCommand returned false");
    }
  } catch (err) {
    toast.error("Failed to copy to clipboard");
    return false;
  }
}
