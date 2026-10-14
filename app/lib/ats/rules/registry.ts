import type { AtsRule } from "../types";
import { contactRules } from "./contact";
import { structureRules } from "./structure";
import { summaryRules } from "./summary";
import { experienceRules } from "./experience";
import { datesRules } from "./dates";
import { lengthRules } from "./length";
import { languageRules } from "./language";

export const ATS_RULES_REGISTRY: AtsRule[] = [
  contactRules,
  structureRules,
  summaryRules,
  experienceRules,
  datesRules,
  lengthRules,
  languageRules,
];
