import type { ResumeContent, ResumeDesign } from "~/lib/schemas/resume";
import type { AtsContext, BulletTarget } from "./types";
import { STOPWORDS } from "./data/stopwords";

export function buildAtsContext(
  content: ResumeContent,
  design?: ResumeDesign,
  options?: { now?: Date; pageCount?: number }
): AtsContext {
  const hiddenSections = new Set(content.hiddenSections || []);
  const sectionOrder = content.sectionOrder || [
    "summary",
    "experience",
    "education",
    "skills",
    "projects",
    "certifications",
    "languages",
    "interests",
  ];

  const visibleSections: string[] = [];
  const textChunks: string[] = [];
  const bullets: BulletTarget[] = [];

  // Personal Info (always visible)
  if (content.personal) {
    if (content.personal.name) textChunks.push(content.personal.name);
    if (content.personal.title) textChunks.push(content.personal.title);
    if (content.personal.email) textChunks.push(content.personal.email);
    if (content.personal.phone) textChunks.push(content.personal.phone);
    if (content.personal.location) textChunks.push(content.personal.location);
    if (content.personal.links) {
      for (const link of content.personal.links) {
        if (link.label) textChunks.push(link.label);
        if (link.url) textChunks.push(link.url);
      }
    }
  }

  // Iterate ordered sections
  for (const sectionId of sectionOrder) {
    if (hiddenSections.has(sectionId)) continue;

    switch (sectionId) {
      case "summary": {
        if (content.summary?.body?.trim()) {
          visibleSections.push("summary");
          textChunks.push(content.summary.body);
        }
        break;
      }
      case "experience": {
        if (content.experience && content.experience.length > 0) {
          visibleSections.push("experience");
          for (const exp of content.experience) {
            if (exp.company) textChunks.push(exp.company);
            if (exp.position) textChunks.push(exp.position);
            if (exp.location) textChunks.push(exp.location);
            if (exp.startDate) textChunks.push(exp.startDate);
            if (exp.endDate) textChunks.push(exp.endDate);
            if (exp.summary) textChunks.push(exp.summary);

            const isCurrentRole =
              exp.current === true ||
              Boolean(exp.endDate && /present|current/i.test(exp.endDate));

            if (exp.bullets && exp.bullets.length > 0) {
              exp.bullets.forEach((bText, idx) => {
                if (bText?.trim()) {
                  textChunks.push(bText);
                  bullets.push({
                    sectionId: "experience",
                    itemId: exp.id,
                    bulletIndex: idx,
                    text: bText.trim(),
                    roleTitle: exp.position,
                    isCurrentRole,
                  });
                }
              });
            }
          }
        }
        break;
      }
      case "education": {
        if (content.education && content.education.length > 0) {
          visibleSections.push("education");
          for (const edu of content.education) {
            if (edu.institution) textChunks.push(edu.institution);
            if (edu.degree) textChunks.push(edu.degree);
            if (edu.fieldOfStudy) textChunks.push(edu.fieldOfStudy);
            if (edu.location) textChunks.push(edu.location);
            if (edu.startDate) textChunks.push(edu.startDate);
            if (edu.endDate) textChunks.push(edu.endDate);
            if (edu.gpa) textChunks.push(edu.gpa);
            if (edu.bullets) {
              edu.bullets.forEach((bText, idx) => {
                if (bText?.trim()) {
                  textChunks.push(bText);
                  bullets.push({
                    sectionId: "education",
                    itemId: edu.id,
                    bulletIndex: idx,
                    text: bText.trim(),
                  });
                }
              });
            }
          }
        }
        break;
      }
      case "skills": {
        if (content.skills && content.skills.length > 0) {
          visibleSections.push("skills");
          for (const sk of content.skills) {
            if (sk.category) textChunks.push(sk.category);
            if (sk.items && sk.items.length > 0) {
              textChunks.push(...sk.items);
            }
          }
        }
        break;
      }
      case "projects": {
        if (content.projects && content.projects.length > 0) {
          visibleSections.push("projects");
          for (const proj of content.projects) {
            if (proj.name) textChunks.push(proj.name);
            if (proj.description) textChunks.push(proj.description);
            if (proj.url) textChunks.push(proj.url);
            if (proj.highlights && proj.highlights.length > 0) {
              proj.highlights.forEach((hText, idx) => {
                if (hText?.trim()) {
                  textChunks.push(hText);
                  bullets.push({
                    sectionId: "projects",
                    itemId: proj.id,
                    bulletIndex: idx,
                    text: hText.trim(),
                    roleTitle: proj.name,
                  });
                }
              });
            }
          }
        }
        break;
      }
      case "certifications": {
        if (content.certifications && content.certifications.length > 0) {
          visibleSections.push("certifications");
          for (const cert of content.certifications) {
            if (cert.name) textChunks.push(cert.name);
            if (cert.issuer) textChunks.push(cert.issuer);
            if (cert.date) textChunks.push(cert.date);
            if (cert.url) textChunks.push(cert.url);
          }
        }
        break;
      }
      case "languages": {
        if (content.languages && content.languages.length > 0) {
          visibleSections.push("languages");
          for (const lang of content.languages) {
            if (lang.language) textChunks.push(lang.language);
            if (lang.proficiency) textChunks.push(lang.proficiency);
          }
        }
        break;
      }
      case "interests": {
        if (content.interests && content.interests.length > 0) {
          visibleSections.push("interests");
          for (const interest of content.interests) {
            if (interest.name) textChunks.push(interest.name);
            if (interest.keywords) textChunks.push(...interest.keywords);
          }
        }
        break;
      }
      default: {
        // Custom sections
        if (content.customSections && content.customSections[sectionId]) {
          const custom = content.customSections[sectionId]!;
          if (custom.items && custom.items.length > 0) {
            visibleSections.push(sectionId);
            textChunks.push(custom.title);
            for (const item of custom.items) {
              if (item.title) textChunks.push(item.title);
              if (item.subtitle) textChunks.push(item.subtitle);
              if (item.date) textChunks.push(item.date);
              if (item.description) textChunks.push(item.description);
              if (item.bullets) {
                item.bullets.forEach((bText, idx) => {
                  if (bText?.trim()) {
                    textChunks.push(bText);
                    bullets.push({
                      sectionId,
                      itemId: item.id,
                      bulletIndex: idx,
                      text: bText.trim(),
                    });
                  }
                });
              }
            }
          }
        }
        break;
      }
    }
  }

  const plainText = textChunks.join(" ");
  const words = plainText
    .toLowerCase()
    .match(/[a-z0-9+#.-]+/gi) || [];
  const wordCount = words.length;

  // Language Detection Heuristic:
  // If resume has sufficient words (> 25) but fewer than 10% English stopwords, it's likely non-English.
  let language: "en" | "other" = "en";
  if (wordCount >= 25) {
    let stopwordCount = 0;
    for (const w of words) {
      if (STOPWORDS.has(w.toLowerCase())) {
        stopwordCount++;
      }
    }
    const ratio = stopwordCount / wordCount;
    if (ratio < 0.10) {
      language = "other";
    }
  }

  return {
    content,
    design,
    visibleSections,
    plainText,
    wordCount,
    bullets,
    language,
    now: options?.now || new Date(),
    pageCount: options?.pageCount,
  };
}
