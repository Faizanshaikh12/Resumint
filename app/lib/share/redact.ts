import type { ResumeContent } from "~/lib/schemas/resume";

/**
 * Pure function that strips candidate email and phone details from resume content.
 * Used when 'hideContact' is enabled on a public share link.
 */
export function redactContactDetails(content: ResumeContent): ResumeContent {
  return {
    ...content,
    personal: {
      ...content.personal,
      email: "",
      phone: "",
    },
  };
}
