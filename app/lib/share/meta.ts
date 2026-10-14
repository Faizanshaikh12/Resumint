import type { ResumeContent, ResumeDesign } from "~/lib/schemas/resume";

export interface BuildShareMetaOptions {
  noindex?: boolean;
  hideContact?: boolean;
  isLocked?: boolean;
}

export interface MetaDescriptor {
  title?: string;
  name?: string;
  property?: string;
  content?: string;
}

/**
 * Strips HTML tags, trims whitespace, and truncates text to a max character length.
 */
export function sanitizeAndTruncateText(text: string, maxLength: number = 160): string {
  if (!text) return "";
  const plain = text
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "")
    .replace(/<[^>]*>/g, "")
    .replace(/\s+/g, " ")
    .trim();

  if (plain.length <= maxLength) {
    return plain;
  }

  return plain.slice(0, maxLength - 1).trim() + "…";
}

/**
 * Builds React Router meta descriptors for public share pages.
 * Never leaks candidate name, title, or summary on locked pages.
 * Never includes contact details (email/phone) in descriptions or meta tags.
 */
export function buildShareMeta(
  content: ResumeContent,
  design?: ResumeDesign,
  options: BuildShareMetaOptions = {}
): MetaDescriptor[] {
  const { noindex = true, isLocked = false } = options;

  // 1. Password-protected state: generic metadata
  if (isLocked) {
    return [
      { title: "Protected Document | Resumint" },
      {
        name: "description",
        content: "This document is password-protected. Enter the password to view.",
      },
      { property: "og:title", content: "Protected Document | Resumint" },
      {
        property: "og:description",
        content: "This document is password-protected. Enter the password to view.",
      },
      { property: "og:type", content: "website" },
      { name: "robots", content: "noindex, nofollow" },
    ];
  }

  // 2. Unlocked / Public state
  const candidateName = (content.personal?.name || "").trim();
  const candidateTitle = (content.personal?.title || "").trim();

  let pageTitle = "Resume | Resumint";
  if (candidateName && candidateTitle) {
    pageTitle = `${candidateName} - ${candidateTitle} | Resumint`;
  } else if (candidateName) {
    pageTitle = `${candidateName} | Resumint`;
  }

  let description = "";
  if (content.summary && content.summary.trim()) {
    description = sanitizeAndTruncateText(content.summary, 160);
  } else if (candidateTitle) {
    description = `Professional resume for ${candidateName || "Candidate"}, ${candidateTitle}.`;
  } else {
    description = `Professional resume for ${candidateName || "Candidate"}.`;
  }

  const descriptors: MetaDescriptor[] = [
    { title: pageTitle },
    { name: "description", content: description },
    { property: "og:title", content: pageTitle },
    { property: "og:description", content: description },
    { property: "og:type", content: "profile" },
  ];

  if (noindex) {
    descriptors.push({ name: "robots", content: "noindex, nofollow" });
  }

  return descriptors;
}
