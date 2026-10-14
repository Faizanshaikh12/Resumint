import type { ResumeDesign } from "../schemas/resume";

/**
 * Merges a template's default design into the current design, preserving fields that
 * the user has explicitly customized ("touched").
 */
export function mergeDesignOnTemplateChange(
  currentDesign: ResumeDesign,
  newTemplateDefault: Partial<ResumeDesign>,
  touchedFields: Set<string> | Iterable<string>
): ResumeDesign {
  const touchedSet = touchedFields instanceof Set ? touchedFields : new Set(touchedFields);
  const result: ResumeDesign = { ...currentDesign };

  for (const [key, defaultValue] of Object.entries(newTemplateDefault)) {
    if (defaultValue !== undefined && !touchedSet.has(key)) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (result as any)[key] = defaultValue;
    }
  }

  return result;
}
